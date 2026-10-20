import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { AiAdapterService } from './ai-adapter.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  AuditAction,
  RecommendedState,
  RequestState,
  Role,
} from '../common/enums.js';
import { assertTransition } from '../workflow/workflow.transitions.js';

@Injectable()
export class TriageService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepo: Repository<ProposalEntity>,
    private readonly aiAdapter: AiAdapterService,
    private readonly audit: AuditService,
  ) {}

  async triageRequest(request: RequestEntity): Promise<RequestEntity> {
    if (request.state !== RequestState.Received) {
      return request;
    }

    assertTransition(request.state, RequestState.Triaged, Role.Manager);
    request.state = RequestState.Triaged;
    await this.requestRepo.save(request);

    const result = await this.aiAdapter.propose(request.externalId);

    if (!result.ok) {
      request.state = RequestState.NeedsReview;
      request.triageError = `${result.error}: ${result.detail}`;
      await this.requestRepo.save(request);
      await this.audit.append({
        requestId: request.id,
        actorRole: 'system',
        action: AuditAction.AiFailed,
        reason: request.triageError,
        after: { state: request.state, error: result.error },
      });
      return request;
    }

    const proposal = result.proposal;
    const nextState =
      proposal.recommended_state === RecommendedState.Draft
        ? RequestState.Draft
        : RequestState.NeedsReview;

    assertTransition(RequestState.Triaged, nextState, Role.Manager);

    await this.proposalRepo.update(
      { requestId: request.id, isCurrent: true },
      { isCurrent: false },
    );

    const entity = this.proposalRepo.create({
      requestId: request.id,
      version: 1,
      department: proposal.department,
      priority: proposal.priority,
      confidence: proposal.confidence,
      summary: proposal.summary,
      proposedOwner: proposal.proposed_owner,
      proposedSteps: proposal.proposed_steps,
      riskFlags: proposal.risk_flags,
      recommendedState: proposal.recommended_state,
      isCurrent: true,
    });
    await this.proposalRepo.save(entity);

    request.state = nextState;
    request.department = proposal.department;
    request.priority = proposal.priority;
    request.riskFlags = proposal.risk_flags;
    request.duplicateOf = proposal.duplicate_of ?? null;
    request.triageError = null;
    await this.requestRepo.save(request);

    await this.audit.append({
      requestId: request.id,
      actorRole: 'system',
      action: AuditAction.Triaged,
      reason: 'AI proposal generated and validated',
      after: {
        state: request.state,
        confidence: proposal.confidence,
        risk_flags: proposal.risk_flags,
        recommended_state: proposal.recommended_state,
      },
    });

    return request;
  }
}
