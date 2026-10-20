import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { resolveRole } from '../auth/roles.guard.js';
import type { AiProposalDto } from '../common/schemas.js';

@Controller('requests')
export class WorkflowController {
  constructor(private readonly workflow: WorkflowService) {}

  @Post(':id/approve')
  @Roles(Role.Manager)
  approve(
    @Param('id') id: string,
    @Headers('x-role') roleHeader: string,
    @Body() body: { reason: string },
  ) {
    return this.workflow.approve(id, resolveRole(roleHeader), body.reason);
  }

  @Post(':id/reject')
  @Roles(Role.Manager)
  reject(
    @Param('id') id: string,
    @Headers('x-role') roleHeader: string,
    @Body() body: { reason: string },
  ) {
    return this.workflow.reject(id, resolveRole(roleHeader), body.reason);
  }

  @Post(':id/edit')
  @Roles(Role.Manager)
  edit(
    @Param('id') id: string,
    @Headers('x-role') roleHeader: string,
    @Body() body: { reason: string; proposal: Partial<AiProposalDto> },
  ) {
    return this.workflow.edit(
      id,
      resolveRole(roleHeader),
      body.reason,
      body.proposal ?? {},
    );
  }

  @Post(':id/merge')
  @Roles(Role.Manager)
  merge(
    @Param('id') id: string,
    @Headers('x-role') roleHeader: string,
    @Body() body: { canonicalExternalId: string; reason: string },
  ) {
    return this.workflow.merge(
      id,
      body.canonicalExternalId,
      resolveRole(roleHeader),
      body.reason,
    );
  }

  @Post(':id/clarify')
  clarify(
    @Param('id') id: string,
    @Headers('x-role') roleHeader: string,
    @Body() body: { note: string },
  ) {
    return this.workflow.recordClarification(
      id,
      resolveRole(roleHeader),
      body.note,
    );
  }
}
