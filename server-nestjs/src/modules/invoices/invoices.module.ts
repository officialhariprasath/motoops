import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

import { InvoiceEntity } from './entities/invoice.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      ServiceEntity,
      UserEntity,
      VehicleEntity,
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
