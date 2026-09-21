import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto, UpdateCatalogItemDto } from './dto/catalog-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId } from '../../common/tenant';

@Controller('catalog/items')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll(@User() user: any, @Query('all') all?: string) {
    return this.catalogService.findAll(resolveGarageId(user), all === 'true');
  }

  @Post()
  create(@User() user: any, @Body() dto: CreateCatalogItemDto) {
    return this.catalogService.create(dto, resolveGarageId(user));
  }

  @Patch(':id')
  update(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.catalogService.update(id, dto, resolveGarageId(user));
  }

  @Delete(':id')
  remove(@User() user: any, @Param('id') id: string) {
    return this.catalogService.remove(id, resolveGarageId(user));
  }
}
