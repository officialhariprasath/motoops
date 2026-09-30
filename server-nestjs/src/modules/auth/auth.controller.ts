// File: src/modules/auth/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';

import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { LoginDto } from '../auth/dto/login.dto';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { getRefreshExpiresIn } from './session-config';

function refreshCookieMaxAgeMs(): number {
  const raw = getRefreshExpiresIn();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return amount * mult;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.login(dto);

    res.cookie('refresh_token', user.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshCookieMaxAgeMs(),
    });

    return user;
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.auth.register(dto);
  }

  @Get('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refresh_token?: string },
  ) {
    const refreshToken =
      body?.refresh_token ||
      (req.cookies?.refresh_token as string | undefined);

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const payload = this.auth.decodeToken(refreshToken) as {
      sub?: string;
    } | null;

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.auth.refreshTokens(payload.sub, refreshToken);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshCookieMaxAgeMs(),
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: tokens.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @User() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.sub);

    res.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }
}
