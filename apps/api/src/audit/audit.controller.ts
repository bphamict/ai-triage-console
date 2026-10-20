import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  listAll(@Query('limit') limit?: string) {
    return this.auditService.listAll(limit ? Number(limit) : 200);
  }

  @Get('request/:requestId')
  listForRequest(@Param('requestId') requestId: string) {
    return this.auditService.listForRequest(requestId);
  }
}
