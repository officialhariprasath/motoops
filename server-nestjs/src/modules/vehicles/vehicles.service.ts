import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { VehicleEntity } from './entities/vehicle.entity';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private repo: Repository<VehicleEntity>,

    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {}

  async create(dto: CreateVehicleDto, garageId: string) {
    const owner = await this.usersRepo.findOne({
      where: { id: dto.ownerId, garageId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const vehicle = this.repo.create({
      registrationNumber: dto.registrationNumber,
      vinNumber: dto.vinNumber,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      color: dto.color,
      engineNumber: dto.engineNumber,
      chassisNumber: dto.chassisNumber,
      mileage: dto.mileage,
      photoUrl: dto.photoUrl,
      owner,
      garageId,
    });

    return this.repo.save(vehicle);
  }

  async findAll(garageId: string) {
    return this.repo.find({
      where: { garageId },
      relations: ['owner'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByOwner(ownerId: string, garageId: string) {
    return this.repo.find({
      where: {
        garageId,
        owner: {
          id: ownerId,
        },
      },

      relations: ['owner'],

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string, garageId: string) {
    const vehicle = await this.repo.findOne({
      where: { id, garageId },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found',
      );
    }

    return vehicle;
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    garageId: string,
  ) {
    const vehicle = await this.findOne(id, garageId);
    const { ownerId, ...vehicleData } = dto;

    Object.assign(vehicle, vehicleData);

    if (ownerId) {
      const owner = await this.usersRepo.findOne({
        where: { id: ownerId, garageId },
      });

      if (!owner) {
        throw new NotFoundException('Owner not found');
      }

      vehicle.owner = owner;
    }

    return this.repo.save(vehicle);
  }

  async remove(id: string, garageId: string) {
    const vehicle = await this.findOne(id, garageId);

    return this.repo.remove(vehicle);
  }

  async search(q: string, garageId: string) {
    if (!q || q.length < 2) {
      return {
        success: true,
        data: [],
      };
    }
   
    const search = `%${q}%`;

    const vehicles = await this.repo
      .createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.owner", "owner")
      .where("vehicle.garageId = :garageId", { garageId })
      .andWhere(
        `(
          vehicle.registrationNumber ILIKE :q
          OR vehicle.vinNumber ILIKE :q
          OR vehicle.brand ILIKE :q
          OR vehicle.model ILIKE :q
          OR owner.name ILIKE :q
          OR owner.mobile ILIKE :q
          OR vehicle.vehicleCode ILIKE :q
          OR owner.customerCode ILIKE :q
        )`,
        { q: search },
      )
      .take(20)
      .getMany();
   
    return {
      success: true,
      data: vehicles,
    };
  }
}
