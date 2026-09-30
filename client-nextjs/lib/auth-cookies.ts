import type { NextResponse } from "next/server";

import {
  getAccessMaxAgeSeconds,
  getRefreshMaxAgeSeconds,
} from "@/lib/session-config";

/** Cookie options shared by login/logout/refresh so Set-Cookie is consistent. */
export const AUTH_COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // lax survives the post-login full navigation better than strict on mobile
  sameSite: "lax" as const,
  path: "/",
};

export type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  mobile?: string;
  designation?: string | null;
  role?: string;
  garageId?: string;
};

/** Compact user payload for the httpOnly cookie (avoid oversized Set-Cookie). */
export function sessionUserCookieValue(user: SessionUser): string {
  return JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    designation: user.designation ?? null,
    role: user.role,
    garageId: user.garageId,
  });
}

export function setAuthCookies(
  response: NextResponse,
  data: {
    access_token: string;
    refresh_token?: string;
    user: SessionUser;
  }
) {
  response.cookies.set("access_token", data.access_token, {
    ...AUTH_COOKIE_BASE,
    maxAge: getAccessMaxAgeSeconds(),
  });

  if (data.refresh_token) {
    response.cookies.set("refresh_token", data.refresh_token, {
      ...AUTH_COOKIE_BASE,
      maxAge: getRefreshMaxAgeSeconds(),
    });
  }

  response.cookies.set("user", sessionUserCookieValue(data.user), {
    ...AUTH_COOKIE_BASE,
    maxAge: getRefreshMaxAgeSeconds(),
  });
}

export function clearAuthCookies(response: NextResponse) {
  const expired = { ...AUTH_COOKIE_BASE, expires: new Date(0), maxAge: 0 };
  response.cookies.set("access_token", "", expired);
  response.cookies.set("refresh_token", "", expired);
  response.cookies.set("user", "", expired);
}
