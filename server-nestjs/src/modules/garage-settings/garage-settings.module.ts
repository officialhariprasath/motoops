import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GarageSettingsEntity } from './entities/garage-settings.entity';
import { GarageSettingsService } from './garage-settings.service';
import { GarageSettingsController } from './garage-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GarageSettingsEntity])],
  controllers: [GarageSettingsController],
  providers: [GarageSettingsService],
  exports: [GarageSettingsService],
})
export class GarageSettingsModule {}
