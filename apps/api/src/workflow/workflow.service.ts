import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { MergeLinkEntity } from '../entities/merge-link.entity.js';
import { AuditService } from '../audit/audit.service.js';
import {
  AuditAction,
  RequestState,
  Role,
} from '../common/enums.js';
import {
  assertManager,
  assertTransition,
} from './workflow.transitions.js';
import { AiProposalDto, AiProposalSchema } from '../common/schemas.js';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepo: Repository<ProposalEntity>,
    @InjectRepository(MergeLinkEntity)
    private readonly mergeRepo: Repository<MergeLinkEntity>,
    private readonly audit: AuditService,
  ) {}

  private async getOrThrow(id: string): Promise<RequestEntity> {
    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException(`Request ${id} not found`);
    return req;
  }

  async approve(
    id: string,
    role: Role,
    reason: string,
  ): Promise<RequestEntity> {
    assertManager(role, 'approve');
    if (!reason?.trim()) {
      throw new BadRequestException('Audit reason is required to approve');
    }
    const req = await this.getOrThrow(id);
    assertTransition(req.state, RequestState.Approved, role);
    const before = { state: req.state };
    req.state = RequestState.Approved;
    await this.requestRepo.save(req);

    // Manager approval is the gate; Open is created as the execution task.
    assertTransition(req.state, RequestState.Open, role);
    req.state = RequestState.Open;
    await this.requestRepo.save(req);

    await this.audit.append({
      requestId: req.id,
      actorRole: role,
      action: AuditAction.Approved,
      reason,
      before,
      after: { state: RequestState.Approved },
    });
    await this.audit.append({
      requestId: req.id,
      actorRole: role,
      action: AuditAction.Opened,
      reason: 'Execution task opened after Manager approval',
      after: { state: RequestState.Open },
    });
    return req;
  }

  async reject(
    id: string,
    role: Role,
    reason: string,
  ): Promise<RequestEntity> {
    assertManager(role, 'reject');
    if (!reason?.trim()) {
      throw new BadRequestException('Audit reason is required to reject');
    }
    const req = await this.getOrThrow(id);
    assertTransition(req.state, RequestState.Rejected, role);
    const before = { state: req.state };
    req.state = RequestState.Rejected;
    await this.requestRepo.save(req);
    await this.audit.append({
      requestId: req.id,
      actorRole: role,
      action: AuditAction.Rejected,
      reason,
      before,
      after: { state: req.state },
    });
    return req;
  }

  async edit(
    id: string,
    role: Role,
    reason: string,
    edits: Partial<AiProposalDto>,
  ): Promise<RequestEntity> {
    assertManager(role, 'edit');
    if (!reason?.trim()) {
      throw new BadRequestException('Audit reason is required to edit');
    }
    const req = await this.getOrThrow(id);
    if (
      req.state !== RequestState.Draft &&
      req.state !== RequestState.NeedsReview
    ) {
      throw new BadRequestException(
        `Cannot edit proposal in state ${req.state}`,
      );
    }

    const current = await this.proposalRepo.findOne({
      where: { requestId: req.id, isCurrent: true },
    });
    if (!current) {
      throw new BadRequestException('No current proposal to edit');
    }

    const merged = {
      department: edits.department ?? current.department,
      priority: edits.priority ?? current.priority,
      confidence: edits.confidence ?? current.confidence,
      summary: edits.summary ?? current.summary,
      proposed_owner: edits.proposed_owner ?? current.proposedOwner,
      proposed_steps: edits.proposed_steps ?? current.proposedSteps,
      risk_flags: edits.risk_flags ?? current.riskFlags,
      recommended_state:
        edits.recommended_state ?? current.recommendedState,
    };

    const parsed = AiProposalSchema.safeParse(merged);
    if (!parsed.success) {
      throw new BadRequestException(
        `Edited proposal invalid: ${parsed.error.message}`,
      );
    }

    current.isCurrent = false;
    await this.proposalRepo.save(current);

    const next = this.proposalRepo.create({
      requestId: req.id,
      version: current.version + 1,
      department: parsed.data.department,
      priority: parsed.data.priority,
      confidence: parsed.data.confidence,
      summary: parsed.data.summary,
      proposedOwner: parsed.data.proposed_owner,
      proposedSteps: parsed.data.proposed_steps,
      riskFlags: parsed.data.risk_flags,
      recommendedState: parsed.data.recommended_state,
      isCurrent: true,
      editedByRole: role,
    });
    await this.proposalRepo.save(next);

    req.department = parsed.data.department;
    req.priority = parsed.data.priority;
    req.riskFlags = parsed.data.risk_flags;
    await this.requestRepo.save(req);

    await this.audit.append({
      requestId: req.id,
      actorRole: role,
      action: AuditAction.Edited,
      reason,
      before: { version: current.version },
      after: { version: next.version, summary: next.summary },
    });
    return req;
  }

  async merge(
    duplicateId: string,
    canonicalExternalId: string,
    role: Role,
    reason: string,
  ): Promise<RequestEntity> {
    assertManager(role, 'merge');
    if (!reason?.trim()) {
      throw new BadRequestException('Audit reason is required to merge');
    }
    const duplicate = await this.getOrThrow(duplicateId);
    const canonical = await this.requestRepo.findOne({
      where: { externalId: canonicalExternalId },
    });
    if (!canonical) {
      throw new NotFoundException(
        `Canonical request ${canonicalExternalId} not found`,
      );
    }
    if (duplicate.externalId === canonical.externalId) {
      throw new BadRequestException('Cannot merge a request into itself');
    }
    assertTransition(duplicate.state, RequestState.Merged, role);

    const before = { state: duplicate.state };
    duplicate.state = RequestState.Merged;
    duplicate.duplicateOf = canonical.externalId;
    await this.requestRepo.save(duplicate);

    const link = this.mergeRepo.create({
      duplicateRequestId: duplicate.id,
      canonicalExternalId: canonical.externalId,
      mergedByRole: role,
      reason,
    });
    await this.mergeRepo.save(link);

    await this.audit.append({
      requestId: duplicate.id,
      actorRole: role,
      action: AuditAction.Merged,
      reason,
      before,
      after: {
        state: RequestState.Merged,
        canonical: canonical.externalId,
      },
    });
    return duplicate;
  }

  async recordClarification(
    id: string,
    role: Role,
    note: string,
  ): Promise<RequestEntity> {
    if (!note?.trim()) {
      throw new BadRequestException('Clarification note is required');
    }
    const req = await this.getOrThrow(id);
    await this.audit.append({
      requestId: req.id,
      actorRole: role,
      action: AuditAction.Clarification,
      reason: note,
    });
    return req;
  }
}
