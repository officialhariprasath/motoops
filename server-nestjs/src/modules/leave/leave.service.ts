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

  findAll(mechanicId?: string) {
    const where = mechanicId ? { mechanicId } : {};
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateLeaveRequestDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
    const row = this.repo.create({
      ...dto,
      reason: dto.reason || '',
      status: 'pending',
    });
    return this.repo.save(row);
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Leave request not found');
    row.status = dto.status;
    return this.repo.save(row);
  }
}
