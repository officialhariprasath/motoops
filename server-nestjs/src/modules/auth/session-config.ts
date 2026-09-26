/**
 * Nest-side session timing (keep in sync with client-nextjs/lib/session-config.ts).
 *
 * JWT_ACCESS_EXPIRES_IN  — 15m | 1h | 12h | 1d   (default 1h)
 * JWT_REFRESH_EXPIRES_IN — 7d | 14d | 30d | 90d  (default 30d)
 */

export const DEFAULT_ACCESS_EXPIRES = '1h';
export const DEFAULT_REFRESH_EXPIRES = '30d';

export function getAccessExpiresIn(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN?.trim() || DEFAULT_ACCESS_EXPIRES;
}

export function getRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN?.trim() || DEFAULT_REFRESH_EXPIRES;
}
