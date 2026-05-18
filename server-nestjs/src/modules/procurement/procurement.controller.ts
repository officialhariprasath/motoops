import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateProcurementItemDto } from './dto/create-procurement-item.dto';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { ProcurementRequestStatus } from './entities/procurement-request.entity';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('items')
  findItems() {
    return this.procurementService.findItems();
  }

  @Post('items')
  createItem(@Body() dto: CreateProcurementItemDto) {
    return this.procurementService.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProcurementItemDto>,
  ) {
    return this.procurementService.updateItem(id, dto);
  }

  @Get('requests')
  findRequests(
    @Query('mechanicId') mechanicId?: string,
    @Query('status') status?: string,
  ) {
    return this.procurementService.findRequests({ mechanicId, status });
  }

  @Post('requests')
  createRequest(@Body() dto: CreateProcurementRequestDto) {
    return this.procurementService.createRequest(dto);
  }

  @Patch('requests/:id/status')
  updateRequestStatus(
    @Param('id') id: string,
    @Body('status') status: ProcurementRequestStatus,
  ) {
    return this.procurementService.updateRequestStatus(id, status);
  }
}
