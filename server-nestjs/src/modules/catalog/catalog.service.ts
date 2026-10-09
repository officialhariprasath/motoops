import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';

import { CatalogItemEntity } from './entities/catalog-item.entity';
import { CreateCatalogItemDto, UpdateCatalogItemDto } from './dto/catalog-item.dto';

const DEFAULT_BIKE_ITEMS: Array<{
  name: string;
  rate: number;
  itemKind?: 'GENERAL' | 'PROFIT';
}> = [
  { name: 'Engine Oil (1L)', rate: 450 },
  { name: 'Oil Filter', rate: 120 },
  { name: 'Air Filter', rate: 180 },
  { name: 'Spark Plug', rate: 150 },
  { name: 'Brake Shoe / Pad', rate: 350 },
  { name: 'Brake Oil', rate: 120 },
  { name: 'Chain Sprocket Kit', rate: 1200 },
  { name: 'Chain Lubricant', rate: 180 },
  { name: 'Clutch Plate', rate: 650 },
  { name: 'General Service Labour', rate: 400, itemKind: 'PROFIT' },
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

function kindLabel(kind: 'GENERAL' | 'PROFIT') {
  return kind === 'PROFIT' ? 'Profit items' : 'General items';
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogItemEntity)
    private readonly repo: Repository<CatalogItemEntity>,
  ) {}

  private async ensureDefaults(garageId: string) {
    const count = await this.repo.count({ where: { garageId } });
    if (count > 0) return;

    await this.repo.save(
      DEFAULT_BIKE_ITEMS.map((item) =>
        this.repo.create({
          name: item.name,
          rate: item.rate,
          itemKind: item.itemKind ?? 'GENERAL',
          isActive: true,
          garageId,
        }),
      ),
    );
  }

  private async assertUniqueName(
    garageId: string,
    name: string,
    excludeId?: string,
  ) {
    const trimmed = name.trim();
    const existing = await this.repo.findOne({
      where: {
        garageId,
        name: ILike(trimmed),
        isActive: true,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (!existing) return;
    const kind = (existing.itemKind === 'PROFIT' ? 'PROFIT' : 'GENERAL') as
      | 'GENERAL'
      | 'PROFIT';
    throw new BadRequestException(
      `Item already exists in ${kindLabel(kind)}`,
    );
  }

  async findAll(garageId: string, includeInactive = false) {
    await this.ensureDefaults(garageId);
    return this.repo.find({
      where: includeInactive
        ? { garageId }
        : { garageId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateCatalogItemDto, garageId: string) {
    const itemKind = dto.itemKind === 'PROFIT' ? 'PROFIT' : 'GENERAL';
    await this.assertUniqueName(garageId, dto.name);
    const item = this.repo.create({
      name: dto.name.trim(),
      rate: dto.rate,
      itemKind,
      isActive: true,
      garageId,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCatalogItemDto, garageId: string) {
    const item = await this.repo.findOne({ where: { id, garageId } });
    if (!item) throw new NotFoundException('Item not found');

    if (dto.name !== undefined) {
      await this.assertUniqueName(garageId, dto.name, id);
      item.name = dto.name.trim();
    }
    if (dto.rate !== undefined) item.rate = dto.rate;
    if (dto.itemKind !== undefined) {
      item.itemKind = dto.itemKind === 'PROFIT' ? 'PROFIT' : 'GENERAL';
    }
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    return this.repo.save(item);
  }

  async remove(id: string, garageId: string) {
    const item = await this.repo.findOne({ where: { id, garageId } });
    if (!item) throw new NotFoundException('Item not found');
    item.isActive = false;
    return this.repo.save(item);
  }
}
