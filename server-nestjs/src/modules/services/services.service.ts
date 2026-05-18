// File: src/modules/services/services.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {  ServiceEntity,  ServiceStatus,} from './entities/service.entity';
import {  ServiceTaskEntity,} from './entities/service-task.entity';
import {  VehicleEntity,} from '../vehicles/entities/vehicle.entity';
import {  UserEntity,} from '../users/entities/user.entity';
import {  CreateServiceDto, SubTaskStatus} from './dto/create-service.dto';
import {  UpdateServiceDto,} from './dto/updateService.dto';
import { TaskPartEntity } from './entities/task-part.entity';
import { ServiceSubTaskEntity } from './entities/service-subtask.entity';
import { ServiceTaskCommentEntity } from './entities/service-task-comment.entity';


@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,

    @InjectRepository(ServiceTaskEntity)
    private readonly taskRepo: Repository<ServiceTaskEntity>,

    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(TaskPartEntity)
    private readonly partRepo: Repository<TaskPartEntity>,

    @InjectRepository(ServiceSubTaskEntity)
    private readonly subtaskRepo: Repository<ServiceSubTaskEntity>,

    @InjectRepository(ServiceTaskCommentEntity)
    private readonly commentRepo: Repository<ServiceTaskCommentEntity>,
  ) {}

  // ======================================================
  // CREATE SERVICE
  // ======================================================

  async create(dto: CreateServiceDto) {
    // ---------------- VEHICLE ----------------

    const vehicle =
      await this.vehicleRepo.findOne({
        where: {
          id: dto.vehicleId,
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found',
      );
    }

    // ---------------- CUSTOMER ----------------

    const customer =
      await this.userRepo.findOne({
        where: {
          id: dto.customerId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    // ---------------- CREATED BY ----------------

    const createdBy =
      await this.userRepo.findOne({
        where: {
          id: dto.createdById,
        },
      });

    if (!createdBy) {
      throw new NotFoundException(
        'Created by user not found',
      );
    }

    // ======================================================
    // CREATE SERVICE
    // ======================================================

    const service =
      this.serviceRepo.create({
        status:dto.status ||  ServiceStatus.PENDING,
        problemDescription:dto.problemDescription,
        notes: dto.notes,
        serviceDate:  dto.serviceDate,
        deliveryDate:  dto.deliveryDate,
        discount:  dto.discount || 0,
        tax: dto.tax || 0,
        subtotal: 0,
        totalCost: 0,
        vehicle,
        customer,
        createdBy,
      });

    const savedService =  await this.serviceRepo.save(  service,  );

    // ======================================================
    // CREATE TASKS
    // ======================================================

    if ( dto.tasks &&   dto.tasks.length > 0
    ) {
      for (const taskDto of dto.tasks) {
        // ---------------- ACCOUNTABLE TECHNICIAN ----------------

        let accountableTechnician:  | UserEntity | null = null;

        if (  taskDto.accountableTechnicianId
        ) {
          accountableTechnician =
            await this.userRepo.findOne({
              where: {
                id:
                  taskDto.accountableTechnicianId,
              },
            });

          if (
            !accountableTechnician
          ) {
            throw new NotFoundException(
              'Accountable technician not found',
            );
          }
        }

        // ---------------- MECHANICS ----------------

        let mechanics:  UserEntity[] = [];

        if ( taskDto.mechanicIds &&  taskDto.mechanicIds.length >0) {
          mechanics =  await this.userRepo.find({
                          where: taskDto.mechanicIds.map(
                            (id) => ({
                              id,
                            }),
                          ),
                        });
          }

        // ---------------- TASK ----------------

       let taskPartsCost = 0;

          const task = this.taskRepo.create({
            title: taskDto.title,
            description: taskDto.description,
            laborCost: taskDto.laborCost || 0,
            additionalCost: taskDto.additionalCost || 0,
            partsCost: 0,
            totalCost:
              Number(taskDto.laborCost || 0) +
              Number(taskDto.additionalCost || 0),
            service: savedService,
            accountableTechnician,
            mechanics,
          });

          const savedTask = await this.taskRepo.save(task);

          
          

        // PARTS
        if (taskDto.parts?.length) {
          for (const partDto of taskDto.parts) {
            const totalPrice =  Number(partDto.quantity || 0) * Number(partDto.unitPrice || 0);

            const part = this.partRepo.create({
              name: partDto.name,
              partNumber: partDto.partNumber,
              quantity: partDto.quantity,
              unitPrice: partDto.unitPrice,
              totalPrice,
              task: savedTask,
            });

            await this.partRepo.save(part);
          }
        }

        const savedParts = await this.partRepo.find({
          where: {
            task: {
              id: savedTask.id,
            },
          },
        });

        savedTask.partsCost = savedParts.reduce(
          (sum, part) => sum + Number(part.totalPrice || 0),
          0,
        );

        savedTask.totalCost =
          Number(savedTask.laborCost || 0) +
          Number(savedTask.additionalCost || 0) +
          Number(savedTask.partsCost || 0);

        await this.taskRepo.save(savedTask);

        // SUBTASKS
        if (taskDto.subtasks?.length) {
          for (const subtaskDto of taskDto.subtasks) {
            
            let assignedTo: UserEntity | null = null;

            if (subtaskDto.assignedToId) {
              const user = await this.userRepo.findOne({
                where: { id: subtaskDto.assignedToId },
              });

              if (!user) {
                throw new NotFoundException('Assigned user not found');
              }

              assignedTo = user;
            }

          

           const subtask = this.subtaskRepo.create({
            title: subtaskDto.title,
            completed: (subtaskDto.progress ?? 0) >= 100,
            status: subtaskDto.status ?? SubTaskStatus.PENDING,
            estimatedDuration: subtaskDto.estimatedDuration ?? 0,
            progress: subtaskDto.progress ?? 0,
            task: savedTask,
            assignedTo,
          });

            await this.subtaskRepo.save(subtask);
          }
        }

        // COMMENTS
        if (taskDto.comments?.length) {
          for (const commentDto of taskDto.comments) {
            const comment = this.commentRepo.create({
              message: commentDto.message,
              internal: commentDto.internal || false,
              status: commentDto.status,
              task: savedTask,
              createdBy,
            });

            await this.commentRepo.save(comment);
          }
        }
      }
    }

    // ======================================================
    // RECALCULATE TOTALS
    // ======================================================

    return this.findOne(
      savedService.id,
    );
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  async findAll(filters?: {
    status?: string;
    customerId?: string;
    vehicleId?: string;
    technicianId?: string;
  }) {
    const qb =
      this.serviceRepo.createQueryBuilder(
        'service',
      );

    // ======================================================
    // RELATIONS
    // ======================================================

    qb.leftJoinAndSelect(
      'service.vehicle',
      'vehicle',
    );

    qb.leftJoinAndSelect(
      'service.customer',
      'customer',
    );

    qb.leftJoinAndSelect(
      'service.createdBy',
      'createdBy',
    );

    qb.leftJoinAndSelect(
      'service.tasks',
      'tasks',
    );

    qb.leftJoinAndSelect(
      'tasks.accountableTechnician',
      'accountableTechnician',
    );

    qb.leftJoinAndSelect(
      'tasks.mechanics',
      'mechanics',
    );

    qb.leftJoinAndSelect(
      'tasks.parts',
      'parts',
    );

    qb.leftJoinAndSelect(
      'tasks.subtasks',
      'subtasks',
    );

    qb.leftJoinAndSelect(
      'tasks.comments',
      'comments',
    );

    qb.leftJoinAndSelect(
      'subtasks.assignedTo',
      'subtaskAssignedTo',
    );

    // ======================================================
    // FILTERS
    // ======================================================

    if (filters?.status) {
      qb.andWhere(
        'service.status = :status',
        {
          status:
            filters.status,
        },
      );
    }

    if (filters?.customerId) {
      qb.andWhere(
        'customer.id = :customerId',
        {
          customerId:
            filters.customerId,
        },
      );
    }

    if (filters?.vehicleId) {
      qb.andWhere(
        'vehicle.id = :vehicleId',
        {
          vehicleId:
            filters.vehicleId,
        },
      );
    }

    if (
      filters?.technicianId
    ) {
      qb.andWhere(
        `
        (
          accountableTechnician.id = :technicianId
          OR mechanics.id = :technicianId
        )
        `,
        {
          technicianId:
            filters.technicianId,
        },
      );
    }

    qb.orderBy(
      'service.createdAt',
      'DESC',
    );

    return qb.getMany();
  }

  // ======================================================
  // FIND ONE
  // ======================================================

  async findOne(id: string) {
    const service =
      await this.serviceRepo.findOne({
        where: {
          id,
        },

        relations: [
          'vehicle',
          'customer',
          'createdBy',

          'tasks',
          'tasks.accountableTechnician',
          'tasks.mechanics',
          'tasks.parts',
          'tasks.subtasks',
          'tasks.subtasks.assignedTo',
          'tasks.comments',

          'invoices',
        ],
      });

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    // ======================================================
    // RECALCULATE TOTALS
    // ======================================================

    let laborCost = 0;
    let partsCost = 0;
    let subtotal = 0;

    for (const task of service.tasks) {
      laborCost += Number(task.laborCost || 0);
      partsCost += Number(task.partsCost || 0);
      subtotal += Number(task.totalCost || 0);
    }

    service.laborCost = laborCost;
    service.partsCost = partsCost;
    service.subtotal = subtotal;

    const discount = Number(service.discount || 0);
    const tax = Number(service.tax || 0);

    service.totalCost = subtotal - discount + tax;
    service.grandTotal = service.totalCost;

    await this.serviceRepo.save(service); // saving

    return service;
  }

  // ======================================================
  // UPDATE SERVICE
  // ======================================================

  async update(  id: string,  dto: UpdateServiceDto,
  ) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ["createdBy"],
    });

    if (!service) {
      throw new NotFoundException("Service not found");
}

    // ---------------- STATUS ----------------

    if (dto.status) {
      service.status =  dto.status;
    }

    // ---------------- PROBLEM ----------------

    if (
      dto.problemDescription !==  undefined
    ) {
      service.problemDescription =  dto.problemDescription;
    }

    // ---------------- NOTES ----------------

    if (dto.notes !== undefined) {
      service.notes = dto.notes;
    }

    // ---------------- DATES ----------------

    if (dto.serviceDate) {
      service.serviceDate =  dto.serviceDate;
    }

    if (dto.deliveryDate) {
      service.deliveryDate =  dto.deliveryDate;
    }

    // ---------------- BILLING ----------------

    if (
      dto.discount !== undefined
    ) {
      service.discount =  dto.discount;
    }

    if (dto.tax !== undefined) {
      service.tax = dto.tax;
    }

    // ---------------- VEHICLE ----------------

    if (dto.vehicleId) {
      const vehicle =
        await this.vehicleRepo.findOne({
          where: {
            id: dto.vehicleId,
          },
        });

      if (!vehicle) {
        throw new NotFoundException(
          'Vehicle not found',
        );
      }

      service.vehicle = vehicle;
    }

    // ---------------- CUSTOMER ----------------

    if (dto.customerId) {
      const customer =
        await this.userRepo.findOne({
          where: {
            id: dto.customerId,
          },
        });

      if (!customer) {
        throw new NotFoundException(
          'Customer not found',
        );
      }

      service.customer =
        customer;
    }

    await this.serviceRepo.save(service);

    //____________ Tasks -----------------------

    if (dto.tasks !== undefined) {
      const oldTasks = await this.taskRepo.find({
          where: {
            service: {
              id: service.id,
            },
          },
          relations: ["parts", "subtasks", "comments", "mechanics"],
        });

        if (oldTasks.length > 0) {
          await this.taskRepo.remove(oldTasks);
        }

      for (const taskDto of dto.tasks) {
        let accountableTechnician: UserEntity | null = null;

        if (taskDto.accountableTechnicianId) {
          accountableTechnician = await this.userRepo.findOne({
            where: { id: taskDto.accountableTechnicianId },
          });
        }

        let mechanics: UserEntity[] = [];

        if (taskDto.mechanicIds?.length) {
          mechanics = await this.userRepo.find({
            where: taskDto.mechanicIds.map((id) => ({ id })),
          });
        }

        const task = this.taskRepo.create({
          title: taskDto.title,
          description: taskDto.description,
          laborCost: Number(taskDto.laborCost || 0),
          additionalCost: Number(taskDto.additionalCost || 0),
          partsCost: 0,
          totalCost: 0,
          service,
          accountableTechnician,
          mechanics,
        });

        const savedTask = await this.taskRepo.save(task);

        let partsCost = 0;

        for (const partDto of taskDto.parts ?? []) {
          const totalPrice =
            Number(partDto.quantity || 0) * Number(partDto.unitPrice || 0);

          partsCost += totalPrice;

          await this.partRepo.save(
            this.partRepo.create({
              name: partDto.name,
              partNumber: partDto.partNumber,
              quantity: partDto.quantity,
              unitPrice: partDto.unitPrice,
              totalPrice,
              task: savedTask,
            }),
          );
        }

        savedTask.partsCost = partsCost;
        savedTask.totalCost =
          Number(savedTask.laborCost || 0) +
          Number(savedTask.additionalCost || 0) +
          partsCost;

        await this.taskRepo.save(savedTask);

        for (const subtaskDto of taskDto.subtasks ?? []) {
          let assignedTo: UserEntity | null = null;

          if (subtaskDto.assignedToId) {
            assignedTo = await this.userRepo.findOne({
              where: { id: subtaskDto.assignedToId },
            });
          }

          await this.subtaskRepo.save(
            this.subtaskRepo.create({
              title: subtaskDto.title,
              status: subtaskDto.status ?? SubTaskStatus.PENDING,
              estimatedDuration: subtaskDto.estimatedDuration ?? 0,
              progress: subtaskDto.progress ?? 0,
              completed: Number(subtaskDto.progress ?? 0) >= 100,
              task: savedTask,
              assignedTo,
            }),
          );
        }

        for (const commentDto of taskDto.comments ?? []) {
          await this.commentRepo.save(
            this.commentRepo.create({
              message: commentDto.message,
              internal: commentDto.internal || false,
              status: commentDto.status,
              task: savedTask,
              createdBy: service.createdBy,
            }),
          );
        }
      }
    }

    

    return this.findOne(id);
  }

  // ======================================================
  // DELETE SERVICE
  // ======================================================

  async remove(id: string) {
    const oldTasks = await this.taskRepo.find({
          where: {
            service: {
              id: id,
            },
          },
          relations: ["parts", "subtasks", "comments", "mechanics"],
        });

        if (oldTasks.length > 0) {
          await this.taskRepo.remove(oldTasks);
        }
  }

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  async updateStatus(
    id: string,
    status: string,
  ) {
    const service =
      await this.findOne(id);

    service.status =
      status as ServiceStatus;

    await this.serviceRepo.save(
      service,
    );

    return this.findOne(id);
  }
}
