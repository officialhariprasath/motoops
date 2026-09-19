import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeaveRequestEntity } from './entities/leave-request.entity';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequestEntity])],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
