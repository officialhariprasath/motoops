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

  private async nextInvoiceNumber(documentType: InvoiceDocumentType) {
    const prefix = documentType === 'ESTIMATE' ? 'JME' : 'JMI';
    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.invoiceNumber', 'invoiceNumber')
      .where('invoice.invoiceNumber IS NOT NULL')
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

  async create(dto: CreateInvoiceDto) {
    const documentType =
      (dto.documentType as InvoiceDocumentType) ||
      InvoiceDocumentTypeDto.BILL;

    const serviceRow = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
      relations: ['vehicle', 'customer'],
    });

    if (!serviceRow) throw new NotFoundException('Service not found');

    const user = await this.userRepo.findOne({
      where: { id: dto.generatedById },
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
    await this.serviceRepo.save(serviceRow);

    const existing = await this.invoiceRepo.findOne({
      where: {
        service: { id: dto.serviceId },
        documentType,
      },
      relations: ['service', 'service.vehicle', 'service.customer', 'generatedBy'],
    });

    const paidForCreate =
      documentType === 'ESTIMATE' ? 0 : Number(dto.paidAmount || 0);
    const amounts = this.paymentFromAmounts(total, paidForCreate);

    if (existing) {
      existing.totalAmount = total;
      existing.paidAmount = amounts.paidAmount;
      existing.dueAmount = amounts.dueAmount;
      existing.paymentStatus = amounts.paymentStatus;
      existing.generatedBy = user;
      if (!existing.invoiceNumber) {
        existing.invoiceNumber = await this.nextInvoiceNumber(documentType);
      }
      const saved = await this.invoiceRepo.save(existing);

      if (documentType === 'BILL' && dto.completeJob !== false) {
        if (serviceRow.status !== ServiceStatus.COMPLETED) {
          serviceRow.status = ServiceStatus.COMPLETED;
          await this.serviceRepo.save(serviceRow);
        }
      }

      return this.findOne(saved.id);
    }

    const invoice = this.invoiceRepo.create({
      service: serviceRow,
      generatedBy: user,
      documentType,
      invoiceNumber: await this.nextInvoiceNumber(documentType),
      totalAmount: total,
      paidAmount: amounts.paidAmount,
      dueAmount: amounts.dueAmount,
      paymentStatus: amounts.paymentStatus,
    });

    const saved = await this.invoiceRepo.save(invoice);

    if (documentType === 'BILL' && dto.completeJob !== false) {
      serviceRow.status = ServiceStatus.COMPLETED;
      await this.serviceRepo.save(serviceRow);
    }

    return this.findOne(saved.id);
  }

  async findAll(filters?: { serviceId?: string; documentType?: string }) {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.service', 'service')
      .leftJoinAndSelect('service.vehicle', 'vehicle')
      .leftJoinAndSelect('service.customer', 'customer')
      .leftJoinAndSelect('invoice.generatedBy', 'generatedBy')
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

  async findOne(id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
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

  async updatePayment(id: string, paidAmount: number) {
    const invoice = await this.findOne(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

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
