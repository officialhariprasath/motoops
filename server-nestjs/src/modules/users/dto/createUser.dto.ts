import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Role } from '../enums/role.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  mobile!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  /** Invite / access key required for public garage signup */
  @IsOptional()
  @IsString()
  accessKey?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}


