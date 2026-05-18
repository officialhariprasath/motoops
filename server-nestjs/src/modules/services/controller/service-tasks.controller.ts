// File: src/modules/services/controllers/service-tasks.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ServiceTasksService } from '../services/service-tasks.service';

import {
  CreateServiceTaskDto,
} from '../dto/create-service.dto';

@Controller()
export class ServiceTasksController {
  constructor(
    private readonly serviceTasksService: ServiceTasksService,
  ) {}

  // ======================================================
  // CREATE TASK
  // ======================================================

  @Post('services/:serviceId/tasks')
  create(
    @Param('serviceId')
    serviceId: string,

    @Body()
    dto: CreateServiceTaskDto,
  ) {
    return this.serviceTasksService.create(
      serviceId,
      dto,
    );
  }

  // ======================================================
  // GET TASKS OF SERVICE
  // ======================================================

  @Get('services/:serviceId/tasks')
  findAll(
    @Param('serviceId')
    serviceId: string,
  ) {
    return this.serviceTasksService.findAll(
      serviceId,
    );
  }

  // ======================================================
  // GET SINGLE TASK
  // ======================================================

  @Get('tasks/:taskId')
  findOne(
    @Param('taskId')
    taskId: string,
  ) {
    return this.serviceTasksService.findOne(
      taskId,
    );
  }

  // ======================================================
  // UPDATE TASK
  // ======================================================

  @Patch('tasks/:taskId')
  update(
    @Param('taskId')
    taskId: string,

    @Body()
    dto: Partial<CreateServiceTaskDto>,
  ) {
    return this.serviceTasksService.update(
      taskId,
      dto,
    );
  }

  // ======================================================
  // DELETE TASK
  // ======================================================

  @Delete('tasks/:taskId')
  remove(
    @Param('taskId')
    taskId: string,
  ) {
    return this.serviceTasksService.remove(
      taskId,
    );
  }

  // ======================================================
  // ASSIGN MECHANICS
  // ======================================================

  @Patch('tasks/:taskId/mechanics')
  assignMechanics(
    @Param('taskId')
    taskId: string,

    @Body('mechanicIds')
    mechanicIds: string[],
  ) {
    return this.serviceTasksService.assignMechanics(
      taskId,
      mechanicIds,
    );
  }

  // ======================================================
  // UPDATE ACCOUNTABLE TECHNICIAN
  // ======================================================

  @Patch(
    'tasks/:taskId/accountable-technician',
  )
  updateAccountableTechnician(
    @Param('taskId')
    taskId: string,

    @Body('technicianId')
    technicianId: string,
  ) {
    return this.serviceTasksService.updateAccountableTechnician(
      taskId,
      technicianId,
    );
  }
}