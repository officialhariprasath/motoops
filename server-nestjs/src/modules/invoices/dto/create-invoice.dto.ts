import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @IsString()
  nextServiceOdometer?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsDateString()
  nextServiceAt?: string;

  @IsOptional()
  @IsString()
  futureWorksNotes?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  includeNextServiceOnBill?: boolean;
}
