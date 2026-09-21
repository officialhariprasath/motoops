import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  InvoiceEntity,
  InvoiceDocumentType,
  PaymentStatus,
} from './entities/invoice.entity';
import { ServiceEntity, ServiceStatus } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { CreateInvoiceDto, InvoiceDocumentTypeDto } from './dto/create-invoice.dto';

function calcLineItemsTotal(
  lineItems?: Array<{
    rate?: number;
    quantity?: number;
    discountPercent?: number;
  }>,
) {
  return (lineItems || []).reduce((sum, item) => {
    const amount = Number(item.rate || 0) * Number(item.quantity || 0);
    const discountAmount = amount * (Number(item.discountPercent || 0) / 100);
    return sum + (amount - discountAmount);
  }, 0);
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private invoiceRepo: Repository<InvoiceEntity>,

    @InjectRepository(ServiceEntity)
    private serviceRepo: Repository<ServiceEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

    @InjectRepository(VehicleEntity)
    private vehicleRepo: Repository<VehicleEntity>,
  ) {}

  private paymentFromAmounts(total: number, paidAmount: number): {
    paidAmount: number;
    dueAmount: number;
    paymentStatus: PaymentStatus;
  } {
    const paid = Math.max(0, Number(paidAmount || 0));
    const dueAmount = Math.max(total - paid, 0);
    let paymentStatus: PaymentStatus = 'unpaid';
    if (total > 0 && paid >= total) paymentStatus = 'paid';
    else if (paid > 0) paymentStatus = 'partial';
    return { paidAmount: paid, dueAmount, paymentStatus };
  }

  private async nextInvoiceNumber(
    documentType: InvoiceDocumentType,
    garageId: string,
  ) {
    const prefix = documentType === 'ESTIMATE' ? 'JME' : 'JMI';
    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.invoiceNumber', 'invoiceNumber')
      .where('invoice.garageId = :garageId', { garageId })
      .andWhere('invoice.invoiceNumber IS NOT NULL')
      .andWhere('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawMany<{ invoiceNumber: string }>();

    let max = 0;
    for (const row of rows) {
      const match = String(row.invoiceNumber || '').match(
        new RegExp(`^${prefix}(\\d+)$`, 'i'),
      );
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `${prefix}${String(max + 1).padStart(6, '0')}`;
  }

  async create(
    dto: CreateInvoiceDto,
    garageId: string,
    generatedByUserId: string,
  ) {
    const documentType =
      (dto.documentType as InvoiceDocumentType) ||
      InvoiceDocumentTypeDto.BILL;

    const serviceRow = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, garageId },
      relations: ['vehicle', 'customer'],
    });

    if (!serviceRow) throw new NotFoundException('Service not found');

    const user = await this.userRepo.findOne({
      where: { id: generatedByUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const total = Number(
      calcLineItemsTotal(serviceRow.lineItems).toFixed(2),
    );
    if (total <= 0 && documentType === 'BILL') {
      throw new BadRequestException(
        'Add line items before generating a bill',
      );
    }

    serviceRow.subtotal = total;
    serviceRow.totalCost = total;
    serviceRow.grandTotal = total;

    // Prefer next-service fields from the create payload (bill modal), then DB
    if (documentType === 'BILL') {
      if (dto.nextServiceOdometer !== undefined) {
        serviceRow.nextServiceOdometer = dto.nextServiceOdometer || undefined;
      }
      if (dto.nextServiceAt !== undefined) {
        serviceRow.nextServiceAt = dto.nextServiceAt
          ? (dto.nextServiceAt as unknown as Date)
          : undefined;
      }
      if (dto.futureWorksNotes !== undefined) {
        serviceRow.futureWorksNotes = dto.futureWorksNotes || undefined;
      }
      if (dto.includeNextServiceOnBill !== undefined) {
        serviceRow.includeNextServiceOnBill = Boolean(
          dto.includeNextServiceOnBill,
        );
      }

      if (serviceRow.vehicle) {
        if (dto.nextServiceAt !== undefined) {
          serviceRow.vehicle.nextServiceAt = dto.nextServiceAt
            ? (dto.nextServiceAt as unknown as Date)
            : undefined;
        } else if (serviceRow.nextServiceAt) {
          serviceRow.vehicle.nextServiceAt = serviceRow.nextServiceAt;
        }
        if (dto.nextServiceOdometer !== undefined) {
          serviceRow.vehicle.nextServiceOdometer =
            dto.nextServiceOdometer || undefined;
        } else if (serviceRow.nextServiceOdometer) {
          serviceRow.vehicle.nextServiceOdometer =
            serviceRow.nextServiceOdometer;
        }
        if (dto.futureWorksNotes !== undefined) {
          serviceRow.vehicle.futureWorksNotes =
            dto.futureWorksNotes || undefined;
        } else if (serviceRow.futureWorksNotes) {
          serviceRow.vehicle.futureWorksNotes = serviceRow.futureWorksNotes;
        }
        if (!serviceRow.vehicle.garageId) {
          serviceRow.vehicle.garageId = garageId;
        }
        await this.vehicleRepo.save(serviceRow.vehicle);
      }
    }

    await this.serviceRepo.save(serviceRow);

    const existing = await this.invoiceRepo.findOne({
      where: {
        garageId,
        service: { id: dto.serviceId },
        documentType,
      },
      relations: ['service', 'service.vehicle', 'service.customer', 'generatedBy'],
    });

    const paidForCreate =
      documentType === 'ESTIMATE' ? 0 : Number(dto.paidAmount || 0);
    const amounts = this.paymentFromAmounts(total, paidForCreate);

    const includeFlag =
      dto.includeNextServiceOnBill !== undefined
        ? Boolean(dto.includeNextServiceOnBill)
        : Boolean(serviceRow.includeNextServiceOnBill);
    const odometer =
      dto.nextServiceOdometer !== undefined
        ? dto.nextServiceOdometer || undefined
        : serviceRow.nextServiceOdometer || undefined;
    const nextAtRaw =
      dto.nextServiceAt !== undefined
        ? dto.nextServiceAt
        : serviceRow.nextServiceAt
          ? String(serviceRow.nextServiceAt).slice(0, 10)
          : null;
    const futureNotes =
      dto.futureWorksNotes !== undefined
        ? dto.futureWorksNotes || undefined
        : serviceRow.futureWorksNotes || undefined;

    const billExtras =
      documentType === 'BILL'
        ? {
            includeNextServiceOnBill: includeFlag,
            nextServiceOdometer: odometer,
            nextServiceAt: nextAtRaw
              ? String(nextAtRaw).slice(0, 10)
              : null,
            futureWorksNotes: futureNotes,
          }
        : undefined;

    if (existing) {
      existing.totalAmount = total;
      existing.paidAmount = amounts.paidAmount;
      existing.dueAmount = amounts.dueAmount;
      existing.paymentStatus = amounts.paymentStatus;
      existing.generatedBy = user;
      existing.garageId = garageId;
      if (billExtras) {
        existing.billExtras = billExtras;
      }
      if (!existing.invoiceNumber) {
        existing.invoiceNumber = await this.nextInvoiceNumber(
          documentType,
          garageId,
        );
      }
      const saved = await this.invoiceRepo.save(existing);

      if (documentType === 'BILL' && dto.completeJob !== false) {
        if (serviceRow.status !== ServiceStatus.COMPLETED) {
          serviceRow.status = ServiceStatus.COMPLETED;
          await this.serviceRepo.save(serviceRow);
        }
      }

      return this.findOne(saved.id, garageId);
    }

    const invoice = this.invoiceRepo.create({
      service: serviceRow,
      generatedBy: user,
      documentType,
      garageId,
      invoiceNumber: await this.nextInvoiceNumber(documentType, garageId),
      totalAmount: total,
      paidAmount: amounts.paidAmount,
      dueAmount: amounts.dueAmount,
      paymentStatus: amounts.paymentStatus,
      billExtras,
    });

    const saved = await this.invoiceRepo.save(invoice);

    if (documentType === 'BILL' && dto.completeJob !== false) {
      serviceRow.status = ServiceStatus.COMPLETED;
      await this.serviceRepo.save(serviceRow);
    }

    return this.findOne(saved.id, garageId);
  }

  async findAll(
    garageId: string,
    filters?: { serviceId?: string; documentType?: string },
  ) {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.service', 'service')
      .leftJoinAndSelect('service.vehicle', 'vehicle')
      .leftJoinAndSelect('service.customer', 'customer')
      .leftJoinAndSelect('invoice.generatedBy', 'generatedBy')
      .where('invoice.garageId = :garageId', { garageId })
      .orderBy('invoice.createdAt', 'DESC');

    if (filters?.serviceId) {
      qb.andWhere('service.id = :serviceId', { serviceId: filters.serviceId });
    }
    if (filters?.documentType) {
      qb.andWhere('invoice.documentType = :documentType', {
        documentType: filters.documentType,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string, garageId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, garageId },
      relations: [
        'service',
        'service.vehicle',
        'service.customer',
        'generatedBy',
      ],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updatePayment(id: string, paidAmount: number, garageId: string) {
    const invoice = await this.findOne(id, garageId);

    if (invoice.documentType === 'ESTIMATE') {
      throw new BadRequestException('Cannot record payment on an estimate');
    }

    const total = Number(invoice.totalAmount || 0);
    const amounts = this.paymentFromAmounts(total, paidAmount);
    invoice.paidAmount = amounts.paidAmount;
    invoice.dueAmount = amounts.dueAmount;
    invoice.paymentStatus = amounts.paymentStatus;

    return this.invoiceRepo.save(invoice);
  }
}
