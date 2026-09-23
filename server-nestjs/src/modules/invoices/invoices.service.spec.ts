import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { InvoicesService } from './invoices.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';

describe('InvoicesService', () => {
  let service: InvoicesService;
  const invoiceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const serviceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const userRepo = { findOne: jest.fn() };
  const vehicleRepo = { save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(InvoiceEntity), useValue: invoiceRepo },
        { provide: getRepositoryToken(ServiceEntity), useValue: serviceRepo },
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepo },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePayment', () => {
    it('records payment on an estimate', async () => {
      const estimate = {
        id: 'inv-1',
        garageId: 'g1',
        documentType: 'ESTIMATE',
        totalAmount: 1000,
        paidAmount: 0,
        dueAmount: 1000,
        paymentStatus: 'unpaid',
      };
      invoiceRepo.findOne.mockResolvedValue(estimate);
      invoiceRepo.save.mockImplementation(async (row) => row);

      const result = await service.updatePayment('inv-1', 400, 'g1');

      expect(result.paidAmount).toBe(400);
      expect(result.dueAmount).toBe(600);
      expect(result.paymentStatus).toBe('partial');
      expect(invoiceRepo.save).toHaveBeenCalled();
    });

    it('marks estimate fully paid when paid covers total', async () => {
      const estimate = {
        id: 'inv-2',
        garageId: 'g1',
        documentType: 'ESTIMATE',
        totalAmount: 500,
        paidAmount: 0,
        dueAmount: 500,
        paymentStatus: 'unpaid',
      };
      invoiceRepo.findOne.mockResolvedValue(estimate);
      invoiceRepo.save.mockImplementation(async (row) => row);

      const result = await service.updatePayment('inv-2', 500, 'g1');

      expect(result.paymentStatus).toBe('paid');
      expect(result.dueAmount).toBe(0);
    });

    it('throws when invoice is missing', async () => {
      invoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePayment('missing', 10, 'g1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
