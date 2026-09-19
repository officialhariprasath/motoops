import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CatalogItemEntity } from './entities/catalog-item.entity';
import { CreateCatalogItemDto, UpdateCatalogItemDto } from './dto/catalog-item.dto';

const DEFAULT_BIKE_ITEMS: Array<{ name: string; rate: number }> = [
  { name: 'Engine Oil (1L)', rate: 450 },
  { name: 'Oil Filter', rate: 120 },
  { name: 'Air Filter', rate: 180 },
  { name: 'Spark Plug', rate: 150 },
  { name: 'Brake Shoe / Pad', rate: 350 },
  { name: 'Brake Oil', rate: 120 },
  { name: 'Chain Sprocket Kit', rate: 1200 },
  { name: 'Chain Lubricant', rate: 180 },
  { name: 'Clutch Plate', rate: 650 },
  { name: 'General Service Labour', rate: 400 },
  { name: 'Wash & Polish', rate: 200 },
  { name: 'Puncture Repair', rate: 50 },
  { name: 'Tube', rate: 280 },
  { name: 'Tyre', rate: 1800 },
  { name: 'Battery', rate: 2500 },
  { name: 'Headlight Bulb', rate: 90 },
  { name: 'Indicator Bulb', rate: 40 },
  { name: 'Clutch Cable', rate: 150 },
  { name: 'Accelerator Cable', rate: 140 },
  { name: 'Side Mirror', rate: 220 },
  { name: 'Grease Pack', rate: 60 },
];

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(CatalogItemEntity)
    private readonly repo: Repository<CatalogItemEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    await this.repo.save(
      DEFAULT_BIKE_ITEMS.map((item) =>
        this.repo.create({
          name: item.name,
          rate: item.rate,
          isActive: true,
        }),
      ),
    );
  }

  findAll(includeInactive = false) {
    return this.repo.find({
      where: includeInactive ? undefined : { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateCatalogItemDto) {
    const item = this.repo.create({
      name: dto.name.trim(),
      rate: dto.rate,
      isActive: true,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCatalogItemDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.rate !== undefined) item.rate = dto.rate;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    return this.repo.save(item);
  }

  async remove(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    item.isActive = false;
    return this.repo.save(item);
  }
}
