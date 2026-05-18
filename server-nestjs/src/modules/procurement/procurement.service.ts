import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { CreateProcurementItemDto } from './dto/create-procurement-item.dto';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { ProcurementItemEntity } from './entities/procurement-item.entity';
import {
  ProcurementRequestEntity,
  ProcurementRequestStatus,
} from './entities/procurement-request.entity';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(ProcurementItemEntity)
    private readonly itemRepo: Repository<ProcurementItemEntity>,

    @InjectRepository(ProcurementRequestEntity)
    private readonly requestRepo: Repository<ProcurementRequestEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createItem(dto: CreateProcurementItemDto) {
    const item = this.itemRepo.create({
      ...dto,
      availableQuantity: dto.totalQuantity,
    });

    return this.itemRepo.save(item);
  }

  async findItems() {
    return this.itemRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateItem(id: string, dto: Partial<CreateProcurementItemDto>) {
    const item = await this.itemRepo.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('Procurement item not found');
    }

    const issuedQuantity = item.totalQuantity - item.availableQuantity;

    if (dto.totalQuantity !== undefined) {
      if (dto.totalQuantity < issuedQuantity) {
        throw new BadRequestException(
          'Total quantity cannot be lower than issued quantity',
        );
      }

      item.totalQuantity = dto.totalQuantity;
      item.availableQuantity = dto.totalQuantity - issuedQuantity;
    }

    if (dto.name !== undefined) item.name = dto.name;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.sku !== undefined) item.sku = dto.sku;
    if (dto.location !== undefined) item.location = dto.location;
    if (dto.notes !== undefined) item.notes = dto.notes;

    return this.itemRepo.save(item);
  }

  async createRequest(dto: CreateProcurementRequestDto) {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });

    if (!item) {
      throw new NotFoundException('Procurement item not found');
    }

    const mechanic = await this.userRepo.findOne({
      where: { id: dto.mechanicId },
    });

    if (!mechanic) {
      throw new NotFoundException('Mechanic not found');
    }

    const request = this.requestRepo.create({
      item,
      mechanic,
      quantity: dto.quantity,
      reason: dto.reason,
      status: ProcurementRequestStatus.PENDING,
    });

    return this.requestRepo.save(request);
  }

  async findRequests(filters?: { mechanicId?: string; status?: string }) {
    const qb = this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.item', 'item')
      .leftJoinAndSelect('request.mechanic', 'mechanic')
      .orderBy('request.createdAt', 'DESC');

    if (filters?.mechanicId) {
      qb.andWhere('mechanic.id = :mechanicId', {
        mechanicId: filters.mechanicId,
      });
    }

    if (filters?.status) {
      qb.andWhere('request.status = :status', {
        status: filters.status,
      });
    }

    return qb.getMany();
  }

  async updateRequestStatus(id: string, status: ProcurementRequestStatus) {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['item', 'mechanic'],
    });

    if (!request) {
      throw new NotFoundException('Procurement request not found');
    }

    if (
      status === ProcurementRequestStatus.ISSUED &&
      request.status !== ProcurementRequestStatus.ISSUED
    ) {
      if (request.item.availableQuantity < request.quantity) {
        throw new BadRequestException('Not enough available quantity');
      }

      request.item.availableQuantity -= request.quantity;
      await this.itemRepo.save(request.item);
    }

    if (
      status === ProcurementRequestStatus.RETURNED &&
      request.status === ProcurementRequestStatus.ISSUED
    ) {
      request.item.availableQuantity += request.quantity;
      await this.itemRepo.save(request.item);
    }

    request.status = status;

    return this.requestRepo.save(request);
  }
}
