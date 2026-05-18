// File: invoices.services.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InvoiceEntity } from './entities/invoice.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

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

  async create(dto: CreateInvoiceDto) {
  const existingInvoice = await this.invoiceRepo.findOne({
    where: {
      service: {
        id: dto.serviceId,
      },
    },
    relations: ['service', 'generatedBy'],
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const service = await this.serviceRepo.findOne({
    where: { id: dto.serviceId },
    relations: ['tasks'],
  });

  if (!service) throw new NotFoundException('Service not found');

  const user = await this.userRepo.findOne({
    where: { id: dto.generatedById },
  });

  if (!user) throw new NotFoundException('User not found');

  const subtotal =
    service.tasks?.reduce(
      (sum, task) => sum + Number(task.totalCost || 0),
      0,
    ) || 0;

  const discount = Number(service.discount || 0);
  const tax = Number(service.tax || 0);

  const total = Number(service.totalCost || 0) || subtotal - discount + tax;
  const paidAmount = Number(dto.paidAmount || 0);
  const dueAmount = Math.max(total - paidAmount, 0);

  let paymentStatus: 'unpaid' | 'paid' | 'partial' = 'unpaid';

  if (paidAmount >= total) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }

  const invoice = this.invoiceRepo.create({
    service,
    generatedBy: user,
    totalAmount: total,
    paidAmount,
    dueAmount,
    paymentStatus,
  });

  return this.invoiceRepo.save(invoice);
}

  async findAll() {
    return this.invoiceRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    return this.invoiceRepo.findOne({
      where: { id },
      relations: [
        'service',
        'service.vehicle',
        'service.customer',
        'service.tasks',
        'service.tasks.parts',
        'service.tasks.subtasks',
        'service.tasks.comments',
        'generatedBy',
      ],
    });
  }

  async updateStatus(id: string, status: string) {
    const invoice = await this.findOne(id);
    if (!invoice) throw new NotFoundException();

    invoice.paymentStatus = status as any;
    return this.invoiceRepo.save(invoice);
  }

  async updatePayment(id: string, paidAmount: number) {
    const invoice = await this.findOne(id);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const total = Number(invoice.totalAmount || 0);
    const paid = Number(paidAmount || 0);

    invoice.paidAmount = paid;
    invoice.dueAmount = Math.max(total - paid, 0);

    if (paid >= total) {
      invoice.paymentStatus = 'paid';
    } else if (paid > 0) {
      invoice.paymentStatus = 'partial';
    } else {
      invoice.paymentStatus = 'unpaid';
    }

    return this.invoiceRepo.save(invoice);
  }
}
