import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  generatedById!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;
}