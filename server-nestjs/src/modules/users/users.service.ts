// File: src/modules/users/users.service.ts

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './enums/role.enum';

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

  async create(
    dto: CreateUserDto & { isVerified?: boolean; verificationToken?: string },
    garageId?: string,
  ) {
    await this.ensureUniqueUserFields(dto);

    const hashed = await bcrypt.hash(dto.password, 10);
    const role = dto.role || Role.USER;
    const isAdmin = String(role).toLowerCase() === Role.ADMIN;

    if (!isAdmin && !garageId) {
      throw new ForbiddenException('garageId is required for this user');
    }

    const user = this.repo.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
      designation: dto.designation,
      password: hashed,
      role,
      isVerified: dto.isVerified ?? true,
      verificationToken: dto.verificationToken,
      garageId: isAdmin ? undefined : garageId,
    });

    const saved = await this.repo.save(user);

    if (isAdmin) {
      saved.garageId = saved.id;
      return this.repo.save(saved);
    }

    return saved;
  }

  async setGarageId(userId: string, garageId: string) {
    await this.repo.update(userId, { garageId });
  }

  findAll(garageId: string) {
    return this.repo.find({
      where: { garageId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, garageId?: string) {
    const user = await this.repo.findOne({
      where: garageId ? { id, garageId } : { id },
      relations: ['vehicles'],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Loads refreshToken (select:false) for session renewal. */
  async findOneForAuth(id: string) {
    const user = await this.repo
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async fineOneByIdentifier(identifier: string) {
    let user: any;

    if (identifier.includes('@')) {
      user = await this.repo.findOne({
        where: { email: identifier },
        select: [
          'id',
          'name',
          'username',
          'email',
          'mobile',
          'designation',
          'password',
          'role',
          'isVerified',
          'garageId',
        ],
      });
    } else {
      user = await this.repo.findOne({
        where: [{ username: identifier }, { mobile: identifier }],
        select: [
          'id',
          'name',
          'username',
          'email',
          'mobile',
          'designation',
          'password',
          'role',
          'isVerified',
          'garageId',
        ],
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

  async findByVerificationToken(token: string) {
    return this.repo.findOne({ where: { verificationToken: token } });
  }

  async markVerified(userId: string) {
    await this.repo.update(userId, {
      isVerified: true,
      verificationToken: null,
    });
  }

  async update(id: string, dto: UpdateUserDto, garageId?: string) {
    const user = await this.findOne(id, garageId);

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

  async remove(id: string, garageId?: string) {
    const user = await this.findOne(id, garageId);
    return this.repo.remove(user);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.repo.update(userId, {
      refreshToken: refreshToken,
    });
  }
}
