import {
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Min,
  Max,
  ValidateIf,
  MinLength,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';

import { ServiceStatus } from '../entities/service.entity';

/** Keep date fields as ISO strings so @IsDateString works with enableImplicitConversion. */
function toOptionalIsoDateString({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00.000Z`;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return trimmed;
  }
  return value;
}

export class CreateTaskPartDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export enum SubTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
}

export class CreateServiceSubTaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @IsOptional()
  @IsEnum(SubTaskStatus)
  status?: SubTaskStatus = SubTaskStatus.PENDING;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedDuration?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number = 0;
}

export class CreateTaskCommentDto {
  @IsString()
  message!: string;

  @IsOptional()
  internal?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateServiceTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  accountableTechnicianId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mechanicIds?: string[];

  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  additionalCost?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskPartDto)
  parts?: CreateTaskPartDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceSubTaskDto)
  subtasks?: CreateServiceSubTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskCommentDto)
  comments?: CreateTaskCommentDto[];
}

export class CreateServiceDto {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsString()
  problemDescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nextServiceOdometer?: string;

  @IsOptional()
  @Transform(toOptionalIsoDateString)
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

  @IsOptional()
  @IsString()
  jobCardNumber?: string;

  @IsOptional()
  @Transform(toOptionalIsoDateString)
  @IsDateString()
  jobCardAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  petrolLevel?: number;

  @IsOptional()
  @IsArray()
  lineItems?: Array<{
    id: string;
    description: string;
    rate: number;
    quantity: number;
    discountPercent: number;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  damagePhotoUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  repairProofPhotoUrls?: string[];

  @IsOptional()
  @Transform(toOptionalIsoDateString)
  @IsDateString()
  serviceDate?: string;

  @IsOptional()
  @Transform(toOptionalIsoDateString)
  @IsDateString()
  deliveryDate?: string;

  // Customer intake
  @ValidateIf((o) => !o.customerId)
  @IsString()
  @MinLength(2)
  customerName?: string;

  @ValidateIf((o) => !o.customerId)
  @IsString()
  @MinLength(8)
  customerMobile?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  // Vehicle intake
  @ValidateIf((o) => !o.vehicleId)
  @IsString()
  @MinLength(2)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  modelYear?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  odometerReading?: string;

  @ValidateIf((o) => !o.registrationNumber)
  @IsUUID()
  vehicleId?: string;

  @ValidateIf((o) => !o.customerMobile)
  @IsUUID()
  customerId?: string;

  @IsUUID()
  createdById!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedMechanicIds?: string[];

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceTaskDto)
  tasks?: CreateServiceTaskDto[];
}
