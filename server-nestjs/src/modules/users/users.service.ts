// File: src/modules/users/users.service.ts

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {
    console.log('UsersService initialized');
  }

  private async ensureUniqueUserFields(
    dto: Partial<Pick<CreateUserDto, 'username' | 'email' | 'mobile'>>,
    currentUserId?: string,
  ) {
    const checks = [
      { field: 'username' as const, label: 'Username', value: dto.username },
      { field: 'email' as const, label: 'Email', value: dto.email },
      { field: 'mobile' as const, label: 'Mobile', value: dto.mobile },
    ];

    for (const check of checks) {
      if (!check.value) continue;

      const existing = await this.repo.findOne({
        where: {
          [check.field]: check.value,
          ...(currentUserId ? { id: Not(currentUserId) } : {}),
        },
      });

      if (existing) {
        throw new ConflictException(`${check.label} already exists`);
      }
    }
  }

  async create(dto: CreateUserDto) {
    await this.ensureUniqueUserFields(dto);

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
      designation: dto.designation,
      password: hashed,
      role: dto.role,
    });

    return this.repo.save(user);
  }

  findAll() {
    return this.repo.find({});
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async fineOneByIdentifier(identifier: string) {
    let user: any;

    if (identifier.includes('@')) {
      user = await this.repo.findOne({
        where: { email: identifier },
        select: ['id', 'name', 'username', 'email', 'mobile', 'designation', 'password', 'role'],
      });
    } else {
      user = await this.repo.findOne({
        where: [{ username: identifier }, { mobile: identifier }],
        select: ['id', 'name', 'username', 'email', 'mobile', 'designation', 'password', 'role'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    return user;
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByMobile(mobile: string) {
    return this.repo.findOne({ where: { mobile } });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    await this.ensureUniqueUserFields(
      {
        username: dto.username,
        email: dto.email,
        mobile: dto.mobile,
      },
      id,
    );

    const updateData = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, updateData);

    return this.repo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.repo.remove(user);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.repo.update(userId, {
      refreshToken: refreshToken ?? undefined,
    });
  }
}




