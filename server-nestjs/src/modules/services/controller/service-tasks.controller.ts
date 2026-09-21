// File: src/modules/services/controllers/service-tasks.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ServiceTasksService } from '../services/service-tasks.service';

import {
  CreateServiceTaskDto,
} from '../dto/create-service.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../../common/decorators/user.decorator';
import { resolveGarageId } from '../../../common/tenant';

@Controller()
@UseGuards(JwtAuthGuard)
export class ServiceTasksController {
  constructor(
    private readonly serviceTasksService: ServiceTasksService,
  ) {}

  @Post('services/:serviceId/tasks')
  create(
    @User() user: any,
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceTaskDto,
  ) {
    return this.serviceTasksService.create(
      serviceId,
      dto,
      resolveGarageId(user),
    );
  }

  @Get('services/:serviceId/tasks')
  findAll(
    @User() user: any,
    @Param('serviceId') serviceId: string,
  ) {
    return this.serviceTasksService.findAll(
      serviceId,
      resolveGarageId(user),
    );
  }

  @Get('tasks/:taskId')
  findOne(
    @User() user: any,
    @Param('taskId') taskId: string,
  ) {
    return this.serviceTasksService.findOne(
      taskId,
      resolveGarageId(user),
    );
  }

  @Patch('tasks/:taskId')
  update(
    @User() user: any,
    @Param('taskId') taskId: string,
    @Body() dto: Partial<CreateServiceTaskDto>,
  ) {
    return this.serviceTasksService.update(
      taskId,
      dto,
      resolveGarageId(user),
    );
  }

  @Delete('tasks/:taskId')
  remove(
    @User() user: any,
    @Param('taskId') taskId: string,
  ) {
    return this.serviceTasksService.remove(
      taskId,
      resolveGarageId(user),
    );
  }

  @Patch('tasks/:taskId/mechanics')
  assignMechanics(
    @User() user: any,
    @Param('taskId') taskId: string,
    @Body('mechanicIds') mechanicIds: string[],
  ) {
    return this.serviceTasksService.assignMechanics(
      taskId,
      mechanicIds,
      resolveGarageId(user),
    );
  }

  @Patch('tasks/:taskId/accountable-technician')
  updateAccountableTechnician(
    @User() user: any,
    @Param('taskId') taskId: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.serviceTasksService.updateAccountableTechnician(
      taskId,
      technicianId,
      resolveGarageId(user),
    );
  }
}
