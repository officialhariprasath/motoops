import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {
  canAccessAdminRoutes,
  getDashboardHome,
} from "@/lib/dashboard-home";

const secretValue =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "";
const SECRET = new TextEncoder().encode(secretValue);

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

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Without a shared secret, JWT checks cannot succeed — send users home
  // instead of throwing inside Edge middleware.
  if (!secretValue) {
    console.error(
      "JWT_ACCESS_SECRET (or JWT_SECRET) is not configured for middleware"
    );
    return redirectHome(req);
  }

  const accessToken = req.cookies.get("access_token")?.value;

  if (!accessToken) {
    return redirectHome(req);
  }

  try {
    const { payload } = await jwtVerify(accessToken, SECRET);
    const role = readRole(req, payload as Record<string, unknown>);
    const home = getDashboardHome(role);

    // Role-aware gates: non-admins cannot use /dashboard/admin/*
    if (
      pathname.startsWith("/dashboard/admin") &&
      !canAccessAdminRoutes(role)
    ) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    // Mechanics stay in mechanic area (except shared Profile/settings)
    if (
      role === "mechanic" &&
      (pathname.startsWith("/dashboard/user") || pathname === "/dashboard")
    ) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    // Customers stay in user area
    if (
      (role === "customer" || role === "user") &&
      (pathname.startsWith("/dashboard/mechanic") ||
        pathname === "/dashboard")
    ) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  } catch {
    return redirectHome(req);
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
