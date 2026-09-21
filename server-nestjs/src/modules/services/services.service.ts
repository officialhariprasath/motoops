// File: src/modules/services/services.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  ILike,
} from 'typeorm';

import {  ServiceEntity,  ServiceStatus,} from './entities/service.entity';
import {  ServiceTaskEntity,} from './entities/service-task.entity';
import {  VehicleEntity,} from '../vehicles/entities/vehicle.entity';
import {  UserEntity,} from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import {  CreateServiceDto, SubTaskStatus} from './dto/create-service.dto';
import {  UpdateServiceDto,} from './dto/updateService.dto';
import { TaskPartEntity } from './entities/task-part.entity';
import { ServiceSubTaskEntity } from './entities/service-subtask.entity';
import { ServiceTaskCommentEntity } from './entities/service-task-comment.entity';
import * as bcrypt from 'bcrypt';


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

  async create(dto: CreateServiceDto, garageId: string, createdByUserId: string) {
    const createdBy = await this.userRepo.findOne({
      where: { id: createdByUserId },
    });

    if (!createdBy) {
      throw new NotFoundException('Created by user not found');
    }

    const { vehicle, customer } = await this.resolveVehicleAndCustomer(
      dto,
      garageId,
    );

    if (dto.jobCardNumber?.trim()) {
      const existing = await this.serviceRepo.findOne({
        where: { jobCardNumber: dto.jobCardNumber.trim(), garageId },
      });
      if (existing) {
        throw new ConflictException('Job card number already exists');
      }
    }

    const jobCardAt = dto.jobCardAt ? new Date(dto.jobCardAt) : new Date();
    const serviceDate = dto.serviceDate
      ? new Date(dto.serviceDate)
      : jobCardAt;
    const deliveryDate = dto.deliveryDate
      ? new Date(dto.deliveryDate)
      : undefined;

    const service = this.serviceRepo.create({
      status: dto.status || ServiceStatus.PENDING,
      problemDescription: dto.problemDescription,
      notes: dto.notes,
      jobCardNumber: dto.jobCardNumber?.trim() || undefined,
      jobCardAt,
      petrolLevel: dto.petrolLevel ?? 0,
      lineItems: dto.lineItems ?? [],
      damagePhotoUrls: [],
      repairProofPhotoUrls: [],
      serviceDate,
      deliveryDate,
      discount: 0,
      tax: 0,
      subtotal: 0,
      totalCost: 0,
      vehicle,
      customer,
      createdBy,
      garageId,
      assignedMechanics: [],
    });

    if (dto.assignedMechanicIds?.length) {
      service.assignedMechanics = await this.userRepo.find({
        where: dto.assignedMechanicIds.map((id) => ({ id, garageId })),
      });
      if (
        !dto.status ||
        dto.status === ServiceStatus.PENDING
      ) {
        service.status = ServiceStatus.ASSIGNED;
      }
    }

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
      garageId,
    );
  }

  // ======================================================
  // FIND ALL
  // ======================================================

  async findAll(
    garageId: string,
    filters?: {
      status?: string;
      customerId?: string;
      vehicleId?: string;
      technicianId?: string;
    },
  ) {
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
      'service.assignedMechanics',
      'assignedMechanics',
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

    qb.where('service.garageId = :garageId', { garageId });

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
          OR assignedMechanics.id = :technicianId
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

  async assertServiceInGarage(serviceId: string, garageId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, garageId },
      select: ['id'],
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  // ======================================================
  // FIND ONE
  // ======================================================

  async findOne(id: string, garageId?: string) {
    const service =
      await this.serviceRepo.findOne({
        where: garageId ? { id, garageId } : { id },

        relations: [
          'vehicle',
          'customer',
          'createdBy',
          'assignedMechanics',

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

    const lineTotal = (service.lineItems || []).reduce((sum, item) => {
      const amount = Number(item.rate || 0) * Number(item.quantity || 0);
      const discountAmount =
        amount * (Number(item.discountPercent || 0) / 100);
      return sum + (amount - discountAmount);
    }, 0);

    if ((service.lineItems || []).length > 0) {
      service.subtotal = lineTotal;
      service.totalCost = lineTotal;
      service.grandTotal = lineTotal;
    } else {
      let laborCost = 0;
      let partsCost = 0;
      let subtotal = 0;

      for (const task of service.tasks || []) {
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
    }

    return service;
  }

  // ======================================================
  // UPDATE SERVICE
  // ======================================================

  async update(id: string, dto: UpdateServiceDto, garageId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id, garageId },
      relations: ["createdBy", "customer", "vehicle", "assignedMechanics"],
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

    if (dto.nextServiceOdometer !== undefined) {
      service.nextServiceOdometer = dto.nextServiceOdometer;
    }

    if (dto.nextServiceAt !== undefined) {
      service.nextServiceAt = dto.nextServiceAt
        ? (dto.nextServiceAt as unknown as Date)
        : undefined;
    }

    if (dto.futureWorksNotes !== undefined) {
      service.futureWorksNotes = dto.futureWorksNotes;
    }

    if (dto.includeNextServiceOnBill !== undefined) {
      service.includeNextServiceOnBill = Boolean(dto.includeNextServiceOnBill);
    }

    // Mirror next-service onto the vehicle for Vehicles list filters
    if (
      service.vehicle &&
      (dto.nextServiceAt !== undefined ||
        dto.nextServiceOdometer !== undefined ||
        dto.futureWorksNotes !== undefined)
    ) {
      if (dto.nextServiceAt !== undefined) {
        service.vehicle.nextServiceAt = dto.nextServiceAt
          ? (dto.nextServiceAt as unknown as Date)
          : undefined;
      }
      if (dto.nextServiceOdometer !== undefined) {
        service.vehicle.nextServiceOdometer = dto.nextServiceOdometer || undefined;
      }
      if (dto.futureWorksNotes !== undefined) {
        service.vehicle.futureWorksNotes = dto.futureWorksNotes || undefined;
      }
      await this.vehicleRepo.save(service.vehicle);
    }

    if (dto.jobCardNumber !== undefined) {
      service.jobCardNumber = dto.jobCardNumber?.trim() || undefined;
    }

    if (dto.jobCardAt !== undefined) {
      service.jobCardAt = dto.jobCardAt ? new Date(dto.jobCardAt) : undefined;
    }

    if (dto.petrolLevel !== undefined) {
      service.petrolLevel = dto.petrolLevel;
    }

    if (dto.lineItems !== undefined) {
      service.lineItems = dto.lineItems;
      const netTotal = (dto.lineItems || []).reduce((sum, item) => {
        const amount = Number(item.rate || 0) * Number(item.quantity || 0);
        const discountAmount = amount * (Number(item.discountPercent || 0) / 100);
        return sum + (amount - discountAmount);
      }, 0);
      service.subtotal = netTotal;
      service.totalCost = netTotal;
      service.grandTotal = netTotal;
    }

    if (dto.assignedMechanicIds !== undefined) {
      if (!dto.assignedMechanicIds.length) {
        service.assignedMechanics = [];
        if (service.status === ServiceStatus.ASSIGNED) {
          service.status = ServiceStatus.PENDING;
        }
      } else {
        service.assignedMechanics = await this.userRepo.find({
          where: dto.assignedMechanicIds.map((id) => ({ id, garageId })),
        });
        if (
          service.status === ServiceStatus.PENDING ||
          !service.status
        ) {
          service.status = ServiceStatus.ASSIGNED;
        }
      }
    }

    // Job-card intake fields can also refresh customer/vehicle on edit
    if (
      dto.customerName ||
      dto.customerMobile ||
      dto.customerAddress !== undefined ||
      dto.registrationNumber ||
      dto.make ||
      dto.model ||
      dto.modelYear ||
      dto.engineNumber !== undefined ||
      dto.chassisNumber !== undefined ||
      dto.odometerReading !== undefined
    ) {
      const resolved = await this.resolveVehicleAndCustomer(
        {
          ...dto,
          customerId: dto.customerId || service.customer?.id,
          vehicleId: dto.vehicleId || service.vehicle?.id,
          createdById: dto.createdById || service.createdBy?.id,
        } as CreateServiceDto,
        garageId,
      );
      service.customer = resolved.customer;
      service.vehicle = resolved.vehicle;
    }

    if (dto.damagePhotoUrls !== undefined) {
      service.damagePhotoUrls = dto.damagePhotoUrls;
    }

    if (dto.repairProofPhotoUrls !== undefined) {
      service.repairProofPhotoUrls = dto.repairProofPhotoUrls;
    }

    // ---------------- DATES ----------------

    if (dto.serviceDate) {
      service.serviceDate = new Date(dto.serviceDate);
    }

    if (dto.deliveryDate) {
      service.deliveryDate = new Date(dto.deliveryDate);
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

    

    return this.findOne(id, garageId);
  }

  // ======================================================
  // DELETE SERVICE
  // ======================================================

  async remove(id: string, garageId: string) {
    await this.assertServiceInGarage(id, garageId);
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

    const service = await this.serviceRepo.findOne({ where: { id, garageId } });
    if (service) {
      await this.serviceRepo.remove(service);
    }
    return { deleted: true };
  }

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  async updateStatus(
    id: string,
    status: string,
    garageId: string,
  ) {
    const service =
      await this.findOne(id, garageId);

    service.status =
      status as ServiceStatus;

    await this.serviceRepo.save(
      service,
    );

    return this.findOne(id, garageId);
  }

  // ======================================================
  // JOB CARD: find-or-create vehicle + customer
  // ======================================================

  private normalizeRegistration(value: string) {
    return value.replace(/\s+/g, '').toUpperCase();
  }

  private async nextCustomerCode(garageId: string) {
    const rows = await this.userRepo
      .createQueryBuilder('user')
      .select('user.customerCode', 'customerCode')
      .where('user.garageId = :garageId', { garageId })
      .andWhere('user.customerCode IS NOT NULL')
      .getRawMany<{ customerCode: string }>();

    let max = 0;
    for (const row of rows) {
      const match = String(row.customerCode || '').match(/^JMC(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `JMC${String(max + 1).padStart(6, '0')}`;
  }

  private async nextVehicleCode(garageId: string) {
    const rows = await this.vehicleRepo
      .createQueryBuilder('vehicle')
      .select('vehicle.vehicleCode', 'vehicleCode')
      .where('vehicle.garageId = :garageId', { garageId })
      .andWhere('vehicle.vehicleCode IS NOT NULL')
      .getRawMany<{ vehicleCode: string }>();

    let max = 0;
    for (const row of rows) {
      const match = String(row.vehicleCode || '').match(/^JMV(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `JMV${String(max + 1).padStart(6, '0')}`;
  }

  private async ensureCustomerCode(customer: UserEntity, garageId: string) {
    if (customer.customerCode) return customer;
    customer.customerCode = await this.nextCustomerCode(garageId);
    return this.userRepo.save(customer);
  }

  private async ensureVehicleCode(vehicle: VehicleEntity, garageId: string) {
    if (vehicle.vehicleCode) return vehicle;
    vehicle.vehicleCode = await this.nextVehicleCode(garageId);
    return this.vehicleRepo.save(vehicle);
  }

  private async resolveVehicleAndCustomer(
    dto: CreateServiceDto,
    garageId: string,
  ) {
    let customer: UserEntity | null = null;
    let vehicle: VehicleEntity | null = null;

    if (dto.customerId) {
      customer = await this.userRepo.findOne({
        where: { id: dto.customerId, garageId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      let dirty = false;
      if (dto.customerName?.trim() && customer.name !== dto.customerName.trim()) {
        customer.name = dto.customerName.trim();
        dirty = true;
      }
      if (dto.customerMobile?.trim() && customer.mobile !== dto.customerMobile.trim()) {
        customer.mobile = dto.customerMobile.trim();
        dirty = true;
      }
      if (dto.customerAddress !== undefined) {
        const address = (dto.customerAddress || '—').trim() || '—';
        if (customer.address !== address) {
          customer.address = address;
          dirty = true;
        }
      }
      if (!customer.garageId) {
        customer.garageId = garageId;
        dirty = true;
      }
      if (dirty) customer = await this.userRepo.save(customer);
      customer = await this.ensureCustomerCode(customer, garageId);
    } else if (dto.customerMobile && dto.customerName) {
      const mobile = dto.customerMobile.trim();
      const address = (dto.customerAddress || '—').trim() || '—';
      customer = await this.userRepo.findOne({
        where: { mobile, garageId },
      });

      if (!customer) {
        const usernameBase = `cust_${garageId.slice(0, 8)}_${mobile}`.slice(0, 40);
        const hashed = await bcrypt.hash(`temp_${mobile}`, 10);
        customer = await this.userRepo.save(
          this.userRepo.create({
            name: dto.customerName.trim(),
            username: usernameBase,
            email: `${garageId.slice(0, 8)}_${mobile}@customer.local`,
            mobile,
            address,
            password: hashed,
            role: Role.USER,
            isVerified: true,
            garageId,
            customerCode: await this.nextCustomerCode(garageId),
          }),
        );
      } else {
        let dirty = false;
        if (dto.customerName.trim() && customer.name !== dto.customerName.trim()) {
          customer.name = dto.customerName.trim();
          dirty = true;
        }
        if (dto.customerAddress !== undefined && customer.address !== address) {
          customer.address = address;
          dirty = true;
        }
        if (dirty) customer = await this.userRepo.save(customer);
        customer = await this.ensureCustomerCode(customer, garageId);
      }
    } else {
      throw new BadRequestException(
        'Provide customerId or customerName + customerMobile',
      );
    }

    if (dto.vehicleId) {
      vehicle = await this.vehicleRepo.findOne({
        where: { id: dto.vehicleId, garageId },
        relations: ['owner'],
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');

      if (dto.registrationNumber?.trim()) {
        vehicle.registrationNumber = dto.registrationNumber.trim().toUpperCase();
      }
      if (dto.make?.trim()) vehicle.brand = dto.make.trim();
      if (dto.model?.trim()) vehicle.model = dto.model.trim();
      if (dto.modelYear?.trim()) vehicle.year = dto.modelYear.trim();
      if (dto.engineNumber !== undefined) {
        vehicle.engineNumber = dto.engineNumber?.trim() || vehicle.engineNumber;
      }
      if (dto.chassisNumber !== undefined) {
        vehicle.chassisNumber =
          dto.chassisNumber?.trim() || vehicle.chassisNumber;
      }
      if (dto.odometerReading !== undefined) {
        vehicle.mileage = dto.odometerReading?.trim() || vehicle.mileage;
      }
      vehicle.owner = customer;
      vehicle.garageId = garageId;
      vehicle = await this.vehicleRepo.save(vehicle);
      vehicle = await this.ensureVehicleCode(vehicle, garageId);
    } else if (dto.registrationNumber) {
      const registrationNumber = dto.registrationNumber.trim().toUpperCase();
      const normalized = this.normalizeRegistration(registrationNumber);

      vehicle = await this.vehicleRepo.findOne({
        where: { registrationNumber: ILike(registrationNumber), garageId },
        relations: ['owner'],
      });

      if (!vehicle) {
        const all = await this.vehicleRepo.find({
          where: { garageId },
          relations: ['owner'],
        });
        vehicle =
          all.find(
            (v) => this.normalizeRegistration(v.registrationNumber) === normalized,
          ) ?? null;
      }

      const brand = (dto.make || 'Unknown').trim() || 'Unknown';
      const model = (dto.model || 'Unknown').trim() || 'Unknown';
      const year =
        (dto.modelYear || String(new Date().getFullYear())).trim() ||
        String(new Date().getFullYear());

      if (!vehicle) {
        vehicle = await this.vehicleRepo.save(
          this.vehicleRepo.create({
            registrationNumber,
            brand,
            model,
            year,
            engineNumber: dto.engineNumber?.trim() || undefined,
            chassisNumber: dto.chassisNumber?.trim() || undefined,
            mileage: dto.odometerReading?.trim() || undefined,
            owner: customer,
            garageId,
            vehicleCode: await this.nextVehicleCode(garageId),
          }),
        );
      } else {
        vehicle.registrationNumber = registrationNumber;
        vehicle.brand = brand;
        vehicle.model = model;
        vehicle.year = year;
        if (dto.engineNumber !== undefined) {
          vehicle.engineNumber = dto.engineNumber?.trim() || vehicle.engineNumber;
        }
        if (dto.chassisNumber !== undefined) {
          vehicle.chassisNumber =
            dto.chassisNumber?.trim() || vehicle.chassisNumber;
        }
        if (dto.odometerReading !== undefined) {
          vehicle.mileage = dto.odometerReading?.trim() || vehicle.mileage;
        }
        vehicle.owner = customer;
        vehicle.garageId = garageId;
        vehicle = await this.vehicleRepo.save(vehicle);
        vehicle = await this.ensureVehicleCode(vehicle, garageId);
      }
    } else {
      throw new BadRequestException(
        'Provide vehicleId or registrationNumber',
      );
    }

    return { vehicle, customer };
  }
}

