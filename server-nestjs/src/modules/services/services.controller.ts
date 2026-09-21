// File: src/modules/services/services.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ServicesService } from './services.service';

import { CreateServiceDto } from './dto/create-service.dto';

import { UpdateServiceDto } from './dto/updateService.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId, resolveUserId } from '../../common/tenant';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
  ) {}

  @Post()
  create(@User() user: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(
      dto,
      resolveGarageId(user),
      resolveUserId(user),
    );
  }

  @Get()
  findAll(
    @User() user: any,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.servicesService.findAll(resolveGarageId(user), {
      status,
      customerId,
      vehicleId,
      technicianId,
    });
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.servicesService.findOne(id, resolveGarageId(user));
  }

  @Patch(':id')
  update(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto, resolveGarageId(user));
  }

  @Delete(':id')
  remove(@User() user: any, @Param('id') id: string) {
    return this.servicesService.remove(id, resolveGarageId(user));
  }

  @Patch(':id/status')
  updateStatus(
    @User() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.servicesService.updateStatus(
      id,
      status,
      resolveGarageId(user),
    );
  }
}
