// File: src/modules/services/services/task-parts.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  TaskPartEntity,
} from '../entities/task-part.entity';

import {
  ServiceTaskEntity,
} from '../entities/service-task.entity';

import {
  CreateTaskPartDto,
} from '../dto/create-service.dto';

@Injectable()
export class TaskPartsService {
  constructor(
    @InjectRepository(TaskPartEntity)
    private readonly partRepo: Repository<TaskPartEntity>,

    @InjectRepository(ServiceTaskEntity)
    private readonly taskRepo: Repository<ServiceTaskEntity>,
  ) {}

  async create(
    taskId: string,
    dto: CreateTaskPartDto,
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

    const totalPrice =
      Number(dto.quantity) *
      Number(dto.unitPrice);

    const part =
      this.partRepo.create({
        name: dto.name,

        partNumber:
          dto.partNumber,

        quantity: dto.quantity,

        unitPrice: dto.unitPrice,

        totalPrice,

        task,
      });

    const savedPart =
      await this.partRepo.save(part);

    // recalculate task cost
    const parts =
      await this.partRepo.find({
        where: {
          task: {
            id: taskId,
          },
        },
      });

    task.partsCost = parts.reduce(
      (sum, p) =>
        sum + Number(p.totalPrice),
      0,
    );

    task.totalCost =
      Number(task.laborCost || 0) +
      Number(task.additionalCost || 0) +
      Number(task.partsCost || 0);

    await this.taskRepo.save(task);

    return savedPart;
  }

  async findAll(taskId: string) {
    return this.partRepo.find({
      where: {
        task: {
          id: taskId,
        },
      },

      relations: ['task'],
    });
  }

  async update(
    partId: string,
    dto: Partial<CreateTaskPartDto>,
  ) {
    const part =
      await this.partRepo.findOne({
        where: {
          id: partId,
        },

        relations: ['task'],
      });

    if (!part) {
      throw new NotFoundException(
        'Part not found',
      );
    }

    if (dto.name !== undefined) {
      part.name = dto.name;
    }

    if (
      dto.partNumber !== undefined
    ) {
      part.partNumber =
        dto.partNumber;
    }

    if (dto.quantity !== undefined) {
      part.quantity = dto.quantity;
    }

    if (
      dto.unitPrice !== undefined
    ) {
      part.unitPrice =
        dto.unitPrice;
    }

    part.totalPrice =
      Number(part.quantity) *
      Number(part.unitPrice);

    const saved =
      await this.partRepo.save(part);

    // recalculate task cost
    const parts =
      await this.partRepo.find({
        where: {
          task: {
            id: part.task.id,
          },
        },
      });

    part.task.partsCost =
      parts.reduce(
        (sum, p) =>
          sum + Number(p.totalPrice),
        0,
      );

    part.task.totalCost =
      Number(
        part.task.laborCost || 0,
      ) +
      Number(
        part.task.additionalCost ||
          0,
      ) +
      Number(
        part.task.partsCost || 0,
      );

    await this.taskRepo.save(
      part.task,
    );

    return saved;
  }

  async remove(partId: string) {
    const part =
      await this.partRepo.findOne({
        where: {
          id: partId,
        },

        relations: ['task'],
      });

    if (!part) {
      throw new NotFoundException(
        'Part not found',
      );
    }

    const task = part.task;

    await this.partRepo.remove(part);

    const parts =
      await this.partRepo.find({
        where: {
          task: {
            id: task.id,
          },
        },
      });

    task.partsCost = parts.reduce(
      (sum, p) =>
        sum + Number(p.totalPrice),
      0,
    );

    task.totalCost =
      Number(task.laborCost || 0) +
      Number(task.additionalCost || 0) +
      Number(task.partsCost || 0);

    await this.taskRepo.save(task);

    return {
      message:
        'Part removed successfully',
    };
  }
}