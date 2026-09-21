import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId } from '../../common/tenant';
import { GarageSettingsService } from './garage-settings.service';

@Controller('garage-settings')
@UseGuards(JwtAuthGuard)
export class GarageSettingsController {
  constructor(private readonly service: GarageSettingsService) {}

  @Get()
  get(@User() user: any) {
    return this.service.get(resolveGarageId(user));
  }

  @Put()
  upsert(@User() user: any, @Body() body: Record<string, unknown>) {
    return this.service.upsert(resolveGarageId(user), body || {});
  }
}
