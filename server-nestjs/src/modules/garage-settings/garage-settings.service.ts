import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GarageSettingsEntity } from './entities/garage-settings.entity';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  garageName: 'MotoOps',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  invoiceNote: 'Thank you for choosing MotoOps.',
  invoiceLogoUrl: '/motoops-logo.png',
  jobCardPrefix: 'JC',
  deleteActionsEnabled: false,
  listPageSize: 10,
  passwordEditingEnabled: false,
  notificationsEnabled: true,
};

@Injectable()
export class GarageSettingsService {
  constructor(
    @InjectRepository(GarageSettingsEntity)
    private readonly repo: Repository<GarageSettingsEntity>,
  ) {}

  async get(garageId: string) {
    const row = await this.repo.findOne({ where: { garageId } });
    return {
      ...DEFAULT_SETTINGS,
      ...(row?.settings || {}),
    };
  }

  async upsert(garageId: string, settings: Record<string, unknown>) {
    let row = await this.repo.findOne({ where: { garageId } });
    const merged = {
      ...DEFAULT_SETTINGS,
      ...(row?.settings || {}),
      ...settings,
    };

    if (!row) {
      row = this.repo.create({ garageId, settings: merged });
    } else {
      row.settings = merged;
    }

    await this.repo.save(row);
    return merged;
  }
}
