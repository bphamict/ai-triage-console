import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { RequestsService } from './requests.service.js';
import { RequestsController } from './requests.controller.js';
import { TriageModule } from '../triage/triage.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, ProposalEntity]),
    TriageModule,
    AuditModule,
  ],
  providers: [RequestsService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
