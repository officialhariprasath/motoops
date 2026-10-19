import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

import { InvoiceEntity } from './entities/invoice.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { GarageSettingsModule } from '../garage-settings/garage-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      ServiceEntity,
      UserEntity,
      VehicleEntity,
    ]),
    GarageSettingsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
