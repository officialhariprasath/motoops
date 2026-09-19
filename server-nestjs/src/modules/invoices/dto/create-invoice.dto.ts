import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum InvoiceDocumentTypeDto {
  ESTIMATE = 'ESTIMATE',
  BILL = 'BILL',
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  generatedById!: string;

  @IsOptional()
  @IsEnum(InvoiceDocumentTypeDto)
  documentType?: InvoiceDocumentTypeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsBoolean()
  completeJob?: boolean;
}
