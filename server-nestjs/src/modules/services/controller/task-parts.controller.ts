// File: src/modules/services/controllers/task-parts.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TaskPartsService } from '../services/task-parts.service';

import {
  CreateTaskPartDto,
} from '../dto/create-service.dto';

@Controller()
export class TaskPartsController {
  constructor(
    private readonly taskPartsService: TaskPartsService,
  ) {}

  // ======================================================
  // ADD PART
  // ======================================================

  @Post('tasks/:taskId/parts')
  create(
    @Param('taskId')
    taskId: string,

    @Body()
    dto: CreateTaskPartDto,
  ) {
    return this.taskPartsService.create(
      taskId,
      dto,
    );
  }

  // ======================================================
  // GET TASK PARTS
  // ======================================================

  @Get('tasks/:taskId/parts')
  findAll(
    @Param('taskId')
    taskId: string,
  ) {
    return this.taskPartsService.findAll(
      taskId,
    );
  }

  // ======================================================
  // UPDATE PART
  // ======================================================

  @Patch('parts/:partId')
  update(
    @Param('partId')
    partId: string,

    @Body()
    dto: Partial<CreateTaskPartDto>,
  ) {
    return this.taskPartsService.update(
      partId,
      dto,
    );
  }

  // ======================================================
  // DELETE PART
  // ======================================================

  @Delete('parts/:partId')
  remove(
    @Param('partId')
    partId: string,
  ) {
    return this.taskPartsService.remove(
      partId,
    );
  }
}