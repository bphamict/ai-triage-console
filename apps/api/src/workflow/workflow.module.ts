import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../entities/request.entity.js';
import { ProposalEntity } from '../entities/proposal.entity.js';
import { MergeLinkEntity } from '../entities/merge-link.entity.js';
import { WorkflowService } from './workflow.service.js';
import { WorkflowController } from './workflow.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      ProposalEntity,
      MergeLinkEntity,
    ]),
    AuditModule,
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
