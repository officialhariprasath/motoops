import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { VehiclesService } from './vehicles.service';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId } from '../../common/tenant';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    private service: VehiclesService,
  ) {}

  @Post()
  create(@User() user: any, @Body() dto: CreateVehicleDto) {
    return this.service.create(dto, resolveGarageId(user));
  }

  @Get()
  findAll(@User() user: any) {
    return this.service.findAll(resolveGarageId(user));
  }

  @Get("search")
  search(@User() user: any, @Query("q") q: string) {
    return this.service.search(q, resolveGarageId(user));
  }

  @Get('/owner/:ownerId')
  findByOwner(
    @User() user: any,
    @Param('ownerId') ownerId: string,
  ) {
    return this.service.findByOwner(ownerId, resolveGarageId(user));
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.service.findOne(id, resolveGarageId(user));
  }

  @Patch(':id')
  update(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.service.update(id, dto, resolveGarageId(user));
  }

  @Delete(':id')
  remove(@User() user: any, @Param('id') id: string) {
    return this.service.remove(id, resolveGarageId(user));
  }
}
