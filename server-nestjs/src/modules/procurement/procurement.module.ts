import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { ProcurementItemEntity } from './entities/procurement-item.entity';
import { ProcurementRequestEntity } from './entities/procurement-request.entity';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProcurementItemEntity,
      ProcurementRequestEntity,
      UserEntity,
    ]),
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService],
})
export class ProcurementModule {}
