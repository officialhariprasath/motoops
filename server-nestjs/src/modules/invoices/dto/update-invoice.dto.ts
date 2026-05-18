import { IsNumber, Min } from 'class-validator';

export class UpdateInvoicePaymentDto {
  @IsNumber()
  @Min(0)
  paidAmount!: number;
}