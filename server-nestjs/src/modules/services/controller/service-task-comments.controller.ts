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

import { ServiceTaskCommentsService } from '../services/service-task-comments.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ServiceTaskCommentsController {
  constructor(
    private readonly commentsService: ServiceTaskCommentsService,
  ) {}

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body()
    body: {
      message: string;
      createdById: string;
      internal?: boolean;
      status?: string;
    },
  ) {
    return this.commentsService.create(taskId, body);
  }

  @Get('tasks/:taskId/comments')
  findAll(@Param('taskId') taskId: string) {
    return this.commentsService.findAll(taskId);
  }

  @Patch('task-comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @Body()
    body: {
      message?: string;
      internal?: boolean;
      status?: string;
    },
  ) {
    return this.commentsService.update(commentId, body);
  }

  @Delete('task-comments/:commentId')
  remove(@Param('commentId') commentId: string) {
    return this.commentsService.remove(commentId);
  }
}
