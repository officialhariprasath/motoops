import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {
  AUTH_COOKIE_BASE,
  sessionUserCookieValue,
  type SessionUser,
} from "@/lib/auth-cookies";
import {
  canAccessAdminRoutes,
  getDashboardHome,
} from "@/lib/dashboard-home";
import {
  getAccessMaxAgeSeconds,
  getRefreshMaxAgeSeconds,
} from "@/lib/session-config";

const secretValue =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "";

function readRole(req: NextRequest, payload: Record<string, unknown>): string {
  const fromJwt = String(payload?.role || "").toLowerCase();
  if (fromJwt) return fromJwt;

  try {
    const raw = req.cookies.get("user")?.value;
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.role || "").toLowerCase();
  } catch {
    try {
      const raw = req.cookies.get("user")?.value;
      if (!raw) return "";
      const parsed = JSON.parse(decodeURIComponent(raw));
      return String(parsed?.role || "").toLowerCase();
    } catch {
      return "";
    }
  }
}

function redirectHome(req: NextRequest) {
  return NextResponse.redirect(new URL("/", req.url));
}

function applySessionCookies(
  response: NextResponse,
  data: {
    access_token: string;
    refresh_token?: string;
    user?: SessionUser;
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

  if (data.user && (data.user.id || data.user.role)) {
    response.cookies.set("user", sessionUserCookieValue(data.user), {
      ...AUTH_COOKIE_BASE,
      maxAge: getRefreshMaxAgeSeconds(),
    });
  }
}

async function refreshSession(
  req: NextRequest,
  secret: Uint8Array
): Promise<{
  access_token: string;
  refresh_token?: string;
  user?: SessionUser;
  payload: Record<string, unknown>;
} | null> {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const backendUrl = process.env.BACKEND_SERVER_URL;
  if (!refreshToken || !backendUrl || !secretValue) return null;

  try {
    const backendRes = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!backendRes.ok) return null;

    const data = await backendRes.json();
    const payload = data.data ?? data;
    if (!payload?.access_token) return null;

    const verified = await jwtVerify(payload.access_token, secret);

    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || refreshToken,
      user: payload.user,
      payload: verified.payload as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

function enforceRoleGates(
  req: NextRequest,
  pathname: string,
  role: string
): NextResponse | null {
  const home = getDashboardHome(role);

  if (pathname.startsWith("/dashboard/admin") && !canAccessAdminRoutes(role)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (
    role === "mechanic" &&
    (pathname.startsWith("/dashboard/user") || pathname === "/dashboard")
  ) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (
    (role === "customer" || role === "user") &&
    (pathname.startsWith("/dashboard/mechanic") || pathname === "/dashboard")
  ) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (!secretValue) {
    console.error(
      "JWT_ACCESS_SECRET (or JWT_SECRET) is not configured for middleware"
    );
    return redirectHome(req);
  }

  const SECRET = new TextEncoder().encode(secretValue);
  const accessToken = req.cookies.get("access_token")?.value;
  let payload: Record<string, unknown> | null = null;
  let refreshed:
    | {
        access_token: string;
        refresh_token?: string;
        user?: SessionUser;
      }
    | null = null;

  if (accessToken) {
    try {
      const verified = await jwtVerify(accessToken, SECRET);
      payload = verified.payload as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  // Access missing/expired → silent renew with refresh token (keeps session alive)
  if (!payload) {
    const session = await refreshSession(req, SECRET);
    if (!session) {
      return redirectHome(req);
    }
    payload = session.payload;
    refreshed = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user,
    };
  }

  const role = readRole(req, payload);
  const gated = enforceRoleGates(req, pathname, role);
  if (gated) {
    if (refreshed) applySessionCookies(gated, refreshed);
    return gated;
  }

  const response = NextResponse.next();
  if (refreshed) applySessionCookies(response, refreshed);
  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
