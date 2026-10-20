import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEventEntity } from '../entities/audit-event.entity.js';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEventEntity])],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
