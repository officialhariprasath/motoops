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
} from '@nestjs/common';

import { ServicesService } from './services.service';

import { CreateServiceDto } from './dto/create-service.dto';

import { UpdateServiceDto } from './dto/updateService.dto';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
  ) {}

  // ======================================================
  // CREATE SERVICE
  // ======================================================

  @Post()
  create(
    @Body() dto: CreateServiceDto,
  ) {

    return this.servicesService.create(dto);
  }

  // ======================================================
  // GET ALL SERVICES
  // ======================================================

  @Get()
  findAll(
    @Query('status') status?: string,

    @Query('customerId')
    customerId?: string,

    @Query('vehicleId')
    vehicleId?: string,

    @Query('technicianId')
    technicianId?: string,
  ) {
    return this.servicesService.findAll({
      status,
      customerId,
      vehicleId,
      technicianId,
    });
  }

  // ======================================================
  // GET SINGLE SERVICE
  // ======================================================

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.servicesService.findOne(id);
  }

  // ======================================================
  // UPDATE SERVICE
  // ======================================================

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateServiceDto,
  ) {
    console.log('Update data: ',dto);
    return this.servicesService.update(
      id,
      dto,
    );
  }

  // ======================================================
  // DELETE SERVICE
  // ======================================================

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.servicesService.remove(id);
  }

  // ======================================================
  // UPDATE SERVICE STATUS
  // ======================================================

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,

    @Body('status')
    status: string,
  ) {
    return this.servicesService.updateStatus(
      id,
      status,
    );
  }
}