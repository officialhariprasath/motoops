import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProcurementRequestDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  mechanicId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
