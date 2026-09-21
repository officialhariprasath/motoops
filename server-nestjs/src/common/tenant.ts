import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '../modules/users/enums/role.enum';

/** JWT / request.user shape after JwtStrategy.validate */
export type AuthUser = {
  sub: string;
  role?: string;
  garageId?: string | null;
  email?: string;
  mobile?: string;
};

/**
 * Tenant id for the current user.
 * Admin (garage owner): own user id (or garageId if set).
 * Mechanic / customer: their garageId (set when created under an admin).
 */
export function resolveGarageId(user?: AuthUser | null): string {
  if (!user?.sub) {
    throw new UnauthorizedException('Authentication required');
  }

  const role = String(user.role || '').toLowerCase();
  if (role === Role.ADMIN || role === 'admin') {
    return user.garageId || user.sub;
  }

  if (!user.garageId) {
    throw new ForbiddenException(
      'Account is not linked to a garage. Contact your garage admin.',
    );
  }

  return user.garageId;
}

export function resolveUserId(user?: AuthUser | null): string {
  if (!user?.sub) {
    throw new UnauthorizedException('Authentication required');
  }
  return user.sub;
}
