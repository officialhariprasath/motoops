import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LeaveRequestEntity } from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly repo: Repository<LeaveRequestEntity>,
  ) {}

  findAll(garageId: string, mechanicId?: string) {
    const where = mechanicId
      ? { garageId, mechanicId }
      : { garageId };
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateLeaveRequestDto, garageId: string) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
    const row = this.repo.create({
      ...dto,
      garageId,
      reason: dto.reason || '',
      status: 'pending',
    });
    return this.repo.save(row);
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto, garageId: string) {
    const row = await this.repo.findOne({ where: { id, garageId } });
    if (!row) throw new NotFoundException('Leave request not found');
    row.status = dto.status;
    return this.repo.save(row);
  }
}
