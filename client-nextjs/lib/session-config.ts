/**
 * Session length options (set on Render + Vercel to match):
 *
 * JWT_ACCESS_EXPIRES_IN  — short-lived access token
 *   Examples: 15m | 1h | 12h | 1d
 *   Default: 1h
 *
 * JWT_REFRESH_EXPIRES_IN — how long you stay signed in (silent renew)
 *   Examples: 7d | 14d | 30d | 90d
 *   Default: 30d
 *
 * Format: number + unit (s = seconds, m = minutes, h = hours, d = days)
 */

export const DEFAULT_ACCESS_EXPIRES = "1h";
export const DEFAULT_REFRESH_EXPIRES = "30d";

export function durationToSeconds(
  value: string | undefined,
  fallbackSeconds: number
): number {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackSeconds;

  const unit = match[2].toLowerCase();
  const multiplier =
    unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;

  return amount * multiplier;
}

export function getAccessExpiresIn(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN?.trim() || DEFAULT_ACCESS_EXPIRES;
}

export function getRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN?.trim() || DEFAULT_REFRESH_EXPIRES;
}

export function getAccessMaxAgeSeconds(): number {
  return durationToSeconds(getAccessExpiresIn(), 60 * 60);
}

export function getRefreshMaxAgeSeconds(): number {
  return durationToSeconds(getRefreshExpiresIn(), 60 * 60 * 24 * 30);
}
