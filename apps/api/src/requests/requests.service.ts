import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { ConfigService } from '@nestjs/config';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { TriageService } from '../triage/triage.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, RequestState } from '../common/enums.js';

export interface ListFilters {
  state?: string;
  department?: string;
  priority?: string;
  riskFlag?: string;
  source?: string;
  search?: string;
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepo: Repository<ProposalEntity>,
    private readonly triage: TriageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async importFixture(): Promise<{
    imported: number;
    skipped: number;
    total: number;
  }> {
    const fixturesDir = resolve(
      process.cwd(),
      this.config.get<string>('FIXTURES_DIR') ?? '../../fixtures',
    );
    const csvPath = join(fixturesDir, 'assessment_requests.csv');
    const content = readFileSync(csvPath, 'utf8');
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{
      id: string;
      source: string;
      department_hint: string;
      requester_role: string;
      submitted_at: string;
      content: string;
    }>;

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const existing = await this.requestRepo.findOne({
        where: { externalId: row.id },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const entity = this.requestRepo.create({
        externalId: row.id,
        source: row.source,
        departmentHint: row.department_hint || null,
        requesterRole: row.requester_role,
        submittedAt: new Date(row.submitted_at),
        content: row.content,
        state: RequestState.Received,
      });
      const saved = await this.requestRepo.save(entity);
      await this.audit.append({
        requestId: saved.id,
        actorRole: 'system',
        action: AuditAction.Imported,
        reason: `Imported fixture ${row.id}`,
        after: { externalId: row.id, state: RequestState.Received },
      });
      await this.triage.triageRequest(saved);
      imported += 1;
    }

    const total = await this.requestRepo.count();
    return { imported, skipped, total };
  }

  async list(filters: ListFilters = {}): Promise<RequestEntity[]> {
    const where: FindOptionsWhere<RequestEntity> = {};
    if (filters.state) where.state = filters.state as RequestState;
    if (filters.department) where.department = filters.department;
    if (filters.priority) where.priority = filters.priority;
    if (filters.source) where.source = filters.source;

    let results = await this.requestRepo.find({
      where,
      order: { submittedAt: 'ASC' },
    });

    if (filters.riskFlag) {
      results = results.filter((r) =>
        (r.riskFlags ?? []).includes(filters.riskFlag!),
      );
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.externalId.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.department ?? '').toLowerCase().includes(q),
      );
    }
    return results;
  }

  async findById(id: string) {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) return null;
    const proposal = await this.proposalRepo.findOne({
      where: { requestId: id, isCurrent: true },
    });
    const audit = await this.audit.listForRequest(id);
    return { request, proposal, audit };
  }

  async findByExternalId(externalId: string) {
    return this.requestRepo.findOne({ where: { externalId } });
  }

  async countUniqueSourceRequests(): Promise<number> {
    return this.requestRepo.count();
  }

  /** Search helper kept for potential future TypeORM ILike path. */
  async searchContent(term: string) {
    return this.requestRepo.find({
      where: { content: ILike(`%${term}%`) },
    });
  }
}
