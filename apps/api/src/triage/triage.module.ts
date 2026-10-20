import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { AiAdapterService } from './ai-adapter.service.js';
import { TriageService } from './triage.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, ProposalEntity]),
    AuditModule,
  ],
  providers: [AiAdapterService, TriageService],
  exports: [AiAdapterService, TriageService],
})
export class TriageModule {}
