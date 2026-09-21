// File: src/modules/services/services/service-tasks.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import { ServiceEntity } from '../entities/service.entity';

import {
  ServiceTaskEntity,
} from '../entities/service-task.entity';

import { UserEntity } from '../../users/entities/user.entity';

import {
  CreateServiceTaskDto,
} from '../dto/create-service.dto';

@Injectable()
export class ServiceTasksService {
  constructor(
    @InjectRepository(ServiceTaskEntity)
    private readonly taskRepo: Repository<ServiceTaskEntity>,

    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(
    serviceId: string,
    dto: CreateServiceTaskDto,
    garageId: string,
  ) {
    const service =
      await this.serviceRepo.findOne({
        where: { id: serviceId, garageId },
      });

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    let accountableTechnician:
      | UserEntity
      | null = null;

    if (dto.accountableTechnicianId) {
      accountableTechnician =
        await this.userRepo.findOne({
          where: {
            id: dto.accountableTechnicianId,
            garageId,
          },
        });

      if (!accountableTechnician) {
        throw new NotFoundException(
          'Accountable technician not found',
        );
      }
    }

    let mechanics: UserEntity[] = [];

    if (
      dto.mechanicIds &&
      dto.mechanicIds.length > 0
    ) {
      mechanics =
        await this.userRepo.find({
          where: {
            id: In(dto.mechanicIds),
            garageId,
          },
        });
    }

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      laborCost: dto.laborCost || 0,
      additionalCost: dto.additionalCost || 0,
      partsCost: 0,
      totalCost:
        (dto.laborCost || 0) +
        (dto.additionalCost || 0),
      service,
      accountableTechnician,
      mechanics,
    });

    return this.taskRepo.save(task);
  }

  async findAll(serviceId: string, garageId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, garageId },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.taskRepo.find({
      where: {
        service: {
          id: serviceId,
        },
      },
      relations: [
        'service',
        'accountableTechnician',
        'mechanics',
        'parts',
        'subtasks',
        'comments',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(taskId: string, garageId: string) {
    const task =
      await this.taskRepo.findOne({
        where: {
          id: taskId,
          service: { garageId },
        },
        relations: [
          'service',
          'accountableTechnician',
          'mechanics',
          'parts',
          'subtasks',
          'comments',
        ],
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return task;
  }

  async update(
    taskId: string,
    dto: Partial<CreateServiceTaskDto>,
    garageId: string,
  ) {
    const task =
      await this.findOne(taskId, garageId);

    if (dto.title !== undefined) {
      task.title = dto.title;
    }

    if (
      dto.description !== undefined
    ) {
      task.description =
        dto.description;
    }

    if (dto.laborCost !== undefined) {
      task.laborCost =
        dto.laborCost;
    }

    if (
      dto.additionalCost !== undefined
    ) {
      task.additionalCost =
        dto.additionalCost;
    }

    task.totalCost =
      Number(task.laborCost || 0) +
      Number(task.partsCost || 0) +
      Number(task.additionalCost || 0);

    return this.taskRepo.save(task);
  }

  async remove(taskId: string, garageId: string) {
    const task =
      await this.findOne(taskId, garageId);

    return this.taskRepo.remove(task);
  }

  async assignMechanics(
    taskId: string,
    mechanicIds: string[],
    garageId: string,
  ) {
    const task =
      await this.findOne(taskId, garageId);

    const mechanics =
      await this.userRepo.find({
        where: {
          id: In(mechanicIds),
          garageId,
        },
      });

    task.mechanics = mechanics;

    return this.taskRepo.save(task);
  }

  async updateAccountableTechnician(
    taskId: string,
    technicianId: string,
    garageId: string,
  ) {
    const task =
      await this.findOne(taskId, garageId);

    const technician =
      await this.userRepo.findOne({
        where: {
          id: technicianId,
          garageId,
        },
      });

    if (!technician) {
      throw new NotFoundException(
        'Technician not found',
      );
    }

    task.accountableTechnician =
      technician;

    return this.taskRepo.save(task);
  }
}
