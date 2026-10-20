import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEventEntity } from '../entities/audit-event.entity.js';
import { Role } from '../common/enums.js';

export interface AuditWriteInput {
  requestId?: string | null;
  actorRole: Role | string;
  action: string;
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly auditRepo: Repository<AuditEventEntity>,
  ) {}

  async append(input: AuditWriteInput): Promise<AuditEventEntity> {
    const event = this.auditRepo.create({
      requestId: input.requestId ?? null,
      actorRole: input.actorRole,
      action: input.action,
      reason: input.reason ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
    });
    return this.auditRepo.save(event);
  }

  async listForRequest(requestId: string): Promise<AuditEventEntity[]> {
    return this.auditRepo.find({
      where: { requestId },
      order: { createdAt: 'ASC' },
    });
  }

  async listAll(limit = 200): Promise<AuditEventEntity[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
