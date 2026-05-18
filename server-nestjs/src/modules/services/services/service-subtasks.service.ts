// File: src/modules/services/services/service-subtasks.service.ts

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  ServiceSubTaskEntity,
} from '../entities/service-subtask.entity';

import {
  ServiceTaskEntity,
} from '../entities/service-task.entity';

import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class ServiceSubTasksService {
  constructor(
    @InjectRepository(
      ServiceSubTaskEntity,
    )
    private readonly subtaskRepo: Repository<ServiceSubTaskEntity>,

    @InjectRepository(ServiceTaskEntity)
    private readonly taskRepo: Repository<ServiceTaskEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(
    taskId: string,
    body: {
      title: string;
      assignedToId?: string;
    },
  ) {
    const task =
      await this.taskRepo.findOne({
        where: {
          id: taskId,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    let assignedTo:
      | UserEntity
      | null = null;

    if (body.assignedToId) {
      assignedTo =
        await this.userRepo.findOne({
          where: {
            id: body.assignedToId,
          },
        });

      if (!assignedTo) {
        throw new NotFoundException(
          'Assigned mechanic not found',
        );
      }
    }

    const subtask =
      this.subtaskRepo.create({
        title: body.title,

        completed: false,

        task,

        assignedTo,
      });

    return this.subtaskRepo.save(
      subtask,
    );
  }

  async findAll(taskId: string) {
    return this.subtaskRepo.find({
      where: {
        task: {
          id: taskId,
        },
      },

      relations: [
        'task',
        'assignedTo',
      ],

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async update(
    subtaskId: string,
    body: {
      title?: string;
      completed?: boolean;
      assignedToId?: string;
      status?: string;
      progress?: number;
      mechanicId?: string;
    },
  ) {
    const subtask =
      await this.subtaskRepo.findOne({
        where: {
          id: subtaskId,
        },

        relations: [
          'assignedTo',
          'task',
          'task.accountableTechnician',
          'task.mechanics',
        ],
      });

    if (!subtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    const isAssignedMechanic =
      subtask.assignedTo?.id === body.mechanicId ||
      subtask.task?.accountableTechnician?.id === body.mechanicId ||
      subtask.task?.mechanics?.some(
        (mechanic) => mechanic.id === body.mechanicId,
      );

    if (body.mechanicId && !isAssignedMechanic) {
      throw new ForbiddenException(
        'You can only update subtasks assigned to you',
      );
    }

    if (body.title !== undefined) {
      subtask.title = body.title;
    }

    if (
      body.completed !== undefined
    ) {
      subtask.completed =
        body.completed;
    }

    if (body.progress !== undefined) {
      const progress = Math.min(
        100,
        Math.max(0, Number(body.progress)),
      );

      subtask.progress = progress;

      if (progress >= 100) {
        subtask.completed = true;
        subtask.status = 'COMPLETED';
      } else if (
        subtask.status === 'COMPLETED'
      ) {
        subtask.completed = false;
        subtask.status = 'IN_PROGRESS';
      }
    }

    if (body.status !== undefined) {
      subtask.status = body.status;
      subtask.completed =
        body.status === 'COMPLETED';

      if (body.status === 'COMPLETED') {
        subtask.progress = 100;
      }
    }

    if (body.assignedToId) {
      const user =
        await this.userRepo.findOne({
          where: {
            id: body.assignedToId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'Assigned mechanic not found',
        );
      }

      subtask.assignedTo = user;
    }

    return this.subtaskRepo.save(
      subtask,
    );
  }

  async remove(subtaskId: string) {
    const subtask =
      await this.subtaskRepo.findOne({
        where: {
          id: subtaskId,
        },
      });

    if (!subtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    return this.subtaskRepo.remove(
      subtask,
    );
  }
}
