// File: users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId } from '../../common/tenant';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  create(@User() user: any, @Body() dto: CreateUserDto) {
    return this.service.create(dto, resolveGarageId(user));
  }

  @Get()
  findAll(@User() user: any) {
    return this.service.findAll(resolveGarageId(user));
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.service.findOne(id, resolveGarageId(user));
  }

  @Patch(':id')
  update(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto, resolveGarageId(user));
  }

  @Delete(':id')
  remove(@User() user: any, @Param('id') id: string) {
    return this.service.remove(id, resolveGarageId(user));
  }
}
