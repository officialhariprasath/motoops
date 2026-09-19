//  File: src/module/auth/auth.service.ts

import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from '../auth/dto/login.dto';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const expectedKey = process.env.SIGNUP_ACCESS_KEY?.trim();
    if (!expectedKey) {
      throw new ForbiddenException(
        'Signup is disabled. Contact MotoOps for access.',
      );
    }

    const provided = String(dto.accessKey || '').trim();
    if (!provided || provided !== expectedKey) {
      throw new ForbiddenException('Invalid access key');
    }

    console.log('Register received', {
      username: dto.username,
      email: dto.email,
    });

    // Access key already proves invitation — garage owner can log in immediately.
    const user = await this.usersService.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
      password: dto.password,
      designation: dto.designation,
      role: Role.ADMIN,
      isVerified: true,
      verificationToken: undefined,
    });

    return {
      user,
      message: 'Registration successful. You can sign in now.',
    };
  }

  //async login(email: string, password: string) {
  async login(dto: LoginDto) {
      const user = await this.usersService.fineOneByIdentifier(dto.identifier);

      if (!user) throw new UnauthorizedException('Invalid credentials');

      if (!user.isVerified) {
        throw new UnauthorizedException('Account not verified. Activate your account before signing in.');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password);
      
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      const tokens = await this.generateTokens(user);

      await this.updateRefreshToken(user.id, tokens.refresh_token);

      //return tokens;
      return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            mobile: user.mobile,
            designation: user.designation,
            role: user.role,
          },
        };

  }
  
  

  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    // await this.usersService.update(userId, {
    //   refreshToken: hashed,
    // });
    await this.usersService.updateRefreshToken(userId, hashed);
  }

  async refreshTokens(userId: string, refreshToken: string) {
      const user = await this.usersService.findOne(userId);

      if (!user || !user.refreshToken)
        throw new Error('Access Denied');

      const isMatch = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isMatch) throw new Error('Invalid refresh token');

      const tokens = await this.generateTokens(user);

      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return tokens;
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token);
    
  }
  
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.usersService.markVerified(user.id);

    return { message: 'Email verified. You can now sign in.' };
  }

  async logout(userId: string) {
    return this.usersService.updateRefreshToken(userId, null);
  }
  

}


