import type { NextResponse } from "next/server";

/** Cookie options shared by login/logout so Set-Cookie is consistent. */
export const AUTH_COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // lax survives the post-login full navigation better than strict on mobile
  sameSite: "lax" as const,
  path: "/",
};

export const ACCESS_TOKEN_MAX_AGE = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

type SessionUser = {
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
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (data.refresh_token) {
    response.cookies.set("refresh_token", data.refresh_token, {
      ...AUTH_COOKIE_BASE,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  response.cookies.set("user", sessionUserCookieValue(data.user), {
    ...AUTH_COOKIE_BASE,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const expired = { ...AUTH_COOKIE_BASE, expires: new Date(0), maxAge: 0 };
  response.cookies.set("access_token", "", expired);
  response.cookies.set("refresh_token", "", expired);
  response.cookies.set("user", "", expired);
}
