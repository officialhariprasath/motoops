import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

@Controller('leave-requests')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@Query('mechanicId') mechanicId?: string) {
    return this.leaveService.findAll(mechanicId);
  }

  @Post()
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(dto);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveStatusDto) {
    return this.leaveService.updateStatus(id, dto);
  }
}
