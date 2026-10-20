import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ListFilters, RequestsService } from './requests.service.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post('import')
  importFixture() {
    return this.requests.importFixture();
  }

  @Get()
  list(
    @Query('state') state?: string,
    @Query('department') department?: string,
    @Query('priority') priority?: string,
    @Query('riskFlag') riskFlag?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
  ) {
    const filters: ListFilters = {
      state,
      department,
      priority,
      riskFlag,
      source,
      search,
    };
    return this.requests.list(filters);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const detail = await this.requests.findById(id);
    if (!detail) throw new NotFoundException(`Request ${id} not found`);
    return detail;
  }
}
