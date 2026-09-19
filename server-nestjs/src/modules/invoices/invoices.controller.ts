import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoicePaymentDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.invoicesService.findAll({ serviceId, documentType });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  updatePaymentById(
    @Param('id') id: string,
    @Body() dto: UpdateInvoicePaymentDto,
  ) {
    return this.invoicesService.updatePayment(id, dto.paidAmount);
  }

  @Patch(':id/payment')
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdateInvoicePaymentDto,
  ) {
    return this.invoicesService.updatePayment(id, dto.paidAmount);
  }
}
