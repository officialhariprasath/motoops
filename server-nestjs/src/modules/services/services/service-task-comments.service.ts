import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ServiceTaskCommentEntity } from '../entities/service-task-comment.entity';
import { ServiceTaskEntity } from '../entities/service-task.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class ServiceTaskCommentsService {
  constructor(
    @InjectRepository(ServiceTaskCommentEntity)
    private readonly commentRepo: Repository<ServiceTaskCommentEntity>,

    @InjectRepository(ServiceTaskEntity)
    private readonly taskRepo: Repository<ServiceTaskEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(
    taskId: string,
    body: {
      message: string;
      createdById: string;
      internal?: boolean;
      status?: string;
    },
  ) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) throw new NotFoundException('Task not found');

    const user = await this.userRepo.findOne({
      where: { id: body.createdById },
    });

    if (!user) throw new NotFoundException('User not found');

    const comment = this.commentRepo.create({
      message: body.message,
      internal: body.internal || false,
      status: body.status,
      task,
      createdBy: user,
    });

    return this.commentRepo.save(comment);
  }

  async findAll(taskId: string) {
    return this.commentRepo.find({
      where: { task: { id: taskId } },
      relations: ['task', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    commentId: string,
    body: {
      message?: string;
      internal?: boolean;
      status?: string;
    },
  ) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    if (body.message !== undefined) comment.message = body.message;
    if (body.internal !== undefined) comment.internal = body.internal;
    if (body.status !== undefined) comment.status = body.status;

    return this.commentRepo.save(comment);
  }

  async remove(commentId: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    return this.commentRepo.remove(comment);
  }
}
