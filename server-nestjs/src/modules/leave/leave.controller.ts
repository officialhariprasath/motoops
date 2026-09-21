import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId } from '../../common/tenant';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(
    @User() user: any,
    @Query('mechanicId') mechanicId?: string,
  ) {
    return this.leaveService.findAll(resolveGarageId(user), mechanicId);
  }

  @Post()
  create(@User() user: any, @Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(dto, resolveGarageId(user));
  }

  @Patch(':id')
  updateStatus(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.leaveService.updateStatus(id, dto, resolveGarageId(user));
  }
}
