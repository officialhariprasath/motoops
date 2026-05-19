import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Min,
  Max
} from 'class-validator';

import { Type } from 'class-transformer';

import { ServiceStatus } from '../entities/service.entity';

// ======================================================
// CREATE TASK PART DTO
// ======================================================

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

// ======================================================
// CREATE SUBTASK DTO
// ======================================================

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

// ======================================================
// CREATE Comment DTO
// ======================================================
export class CreateTaskCommentDto {
  @IsString()
  message!: string;

  @IsOptional()
  internal?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}

// ======================================================
// CREATE TASK DTO
// ======================================================

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
  @IsUUID('4', {
    each: true,
  })
  mechanicIds?: string[];

  // =====================================
  // COSTING
  // =====================================

  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  additionalCost?: number;

  // =====================================
  // PARTS
  // =====================================

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateTaskPartDto)
  parts?: CreateTaskPartDto[];

  // =====================================
  // SUBTASKS
  // =====================================

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateServiceSubTaskDto)
  subtasks?: CreateServiceSubTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskCommentDto)
  comments?: CreateTaskCommentDto[];
}

// ======================================================
// CREATE SERVICE DTO
// ======================================================

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
  @IsArray()
  @IsString({ each: true })
  damagePhotoUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  repairProofPhotoUrls?: string[];

  @IsOptional()
  @IsDateString()
  serviceDate?: Date;

  @IsOptional()
  @IsDateString()
  deliveryDate?: Date;

  // =====================================
  // RELATIONS
  // =====================================

  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  createdById!: string;

  // =====================================
  // BILLING
  // =====================================

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  // =====================================
  // TASKS
  // =====================================

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateServiceTaskDto)
  tasks?: CreateServiceTaskDto[];


}


