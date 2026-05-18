// File: src/modules/services/controllers/service-subtasks.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ServiceSubTasksService } from '../services/service-subtasks.service';

@Controller()
export class ServiceSubTasksController {
  constructor(
    private readonly subtasksService: ServiceSubTasksService,
  ) {}

  // ======================================================
  // CREATE SUBTASK
  // ======================================================

  @Post('tasks/:taskId/subtasks')
  create(
    @Param('taskId')
    taskId: string,

    @Body()
    body: {
      title: string;
      assignedToId?: string;
    },
  ) {
    return this.subtasksService.create(
      taskId,
      body,
    );
  }

  // ======================================================
  // GET SUBTASKS
  // ======================================================

  @Get('tasks/:taskId/subtasks')
  findAll(
    @Param('taskId')
    taskId: string,
  ) {
    return this.subtasksService.findAll(
      taskId,
    );
  }

  // ======================================================
  // UPDATE SUBTASK
  // ======================================================

  @Patch('subtasks/:subtaskId')
  update(
    @Param('subtaskId')
    subtaskId: string,

    @Body()
    body: {
      title?: string;
      completed?: boolean;
      assignedToId?: string;
      status?: string;
      progress?: number;
      mechanicId?: string;
    },
  ) {
    return this.subtasksService.update(
      subtaskId,
      body,
    );
  }

  // ======================================================
  // DELETE SUBTASK
  // ======================================================

  @Delete('subtasks/:subtaskId')
  remove(
    @Param('subtaskId')
    subtaskId: string,
  ) {
    return this.subtasksService.remove(
      subtaskId,
    );
  }
}
