import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ProcurementItemType } from '../entities/procurement-item.entity';

export class CreateProcurementItemDto {
  @IsString()
  name!: string;

  @IsEnum(ProcurementItemType)
  type!: ProcurementItemType;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(0)
  totalQuantity!: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
