import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoicePaymentDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { resolveGarageId, resolveUserId } from '../../common/tenant';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@User() user: any, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(
      dto,
      resolveGarageId(user),
      resolveUserId(user),
    );
  }

  @Get()
  findAll(
    @User() user: any,
    @Query('serviceId') serviceId?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.invoicesService.findAll(resolveGarageId(user), {
      serviceId,
      documentType,
    });
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.invoicesService.findOne(id, resolveGarageId(user));
  }

  @Patch(':id')
  updatePaymentById(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateInvoicePaymentDto,
  ) {
    return this.invoicesService.updatePayment(
      id,
      dto.paidAmount,
      resolveGarageId(user),
    );
  }

  @Patch(':id/payment')
  updatePayment(
    @User() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateInvoicePaymentDto,
  ) {
    return this.invoicesService.updatePayment(
      id,
      dto.paidAmount,
      resolveGarageId(user),
    );
  }
}
