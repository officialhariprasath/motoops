import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsUUID()
  mechanicId!: string;

  @IsString()
  @MinLength(1)
  mechanicName!: string;

  @IsString()
  @MinLength(1)
  leaveType!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
