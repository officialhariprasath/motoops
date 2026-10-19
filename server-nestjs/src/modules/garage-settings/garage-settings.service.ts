import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { ServiceEntity } from '../services/entities/service.entity';
import { GarageSettingsEntity } from './entities/garage-settings.entity';
import {
  dateKeyFromValue,
  formatJobCardNumber,
  normalizeJobCardPrefix,
  parseJobCardSequence,
} from './job-card-number';

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
  documentFontSize: 11.5,
};

@Injectable()
export class GarageSettingsService {
  constructor(
    @InjectRepository(GarageSettingsEntity)
    private readonly repo: Repository<GarageSettingsEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
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

  async getJobCardPrefix(garageId: string) {
    const settings = await this.get(garageId);
    return normalizeJobCardPrefix(settings.jobCardPrefix);
  }

  /**
   * Next free job card number for this garage from DB + saved prefix.
   * Same account on any device gets the garage prefix and the next
   * sequence after existing cards for that calendar date.
   */
  async nextJobCardNumber(garageId: string, at?: string | Date | null) {
    const prefix = await this.getJobCardPrefix(garageId);
    const dateKey = dateKeyFromValue(at);
    const numberPrefix = `${prefix}${dateKey}`;

    const rows = await this.serviceRepo
      .createQueryBuilder('service')
      .select('service.jobCardNumber', 'jobCardNumber')
      .where('service.garageId = :garageId', { garageId })
      .andWhere('service.jobCardNumber IS NOT NULL')
      .andWhere('service.jobCardNumber ILIKE :pattern', {
        pattern: `${numberPrefix}%`,
      })
      .getRawMany<{ jobCardNumber: string }>();

    let max = 0;
    for (const row of rows) {
      const sequence = parseJobCardSequence(
        row.jobCardNumber,
        prefix,
        dateKey,
      );
      if (sequence != null) max = Math.max(max, sequence);
    }

    const sequence = max + 1;
    return {
      jobCardNumber: formatJobCardNumber(prefix, dateKey, sequence),
      prefix,
      dateKey,
      sequence,
    };
  }

  /**
   * Resolve a free number for create.
   * - Keeps preferred when it is free and uses this garage's saved prefix
   * - Otherwise allocates the next DB-backed number (never a stale JC default)
   */
  async allocateJobCardNumber(
    garageId: string,
    at?: string | Date | null,
    preferred?: string | null,
  ) {
    const prefix = await this.getJobCardPrefix(garageId);
    const preferredTrimmed = normalizeJobCardPrefix(preferred || '', '');
    const dateKey = dateKeyFromValue(at);

    if (preferredTrimmed && preferredTrimmed.startsWith(prefix)) {
      const existing = await this.serviceRepo.findOne({
        where: { garageId, jobCardNumber: ILike(preferredTrimmed) },
      });
      if (!existing) {
        const sequence =
          parseJobCardSequence(preferredTrimmed, prefix, dateKey) ?? 0;
        return {
          jobCardNumber: preferredTrimmed,
          prefix,
          dateKey:
            preferredTrimmed.match(/(\d{8})\d{4}$/)?.[1] || dateKey,
          sequence,
          reusedPreferred: true,
        };
      }
    }

    const next = await this.nextJobCardNumber(garageId, at);
    return { ...next, reusedPreferred: false };
  }
}
