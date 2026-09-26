import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_SERVER_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { message: "BACKEND_SERVER_URL is not configured" },
        { status: 500 }
      );
    }

    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      const response = NextResponse.json(
        { message: "Session expired. Please sign in again." },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    const backendRes = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    const contentType = backendRes.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendRes.json()
      : { message: await backendRes.text() };

    if (!backendRes.ok) {
      const response = NextResponse.json(
        { message: data.message || "Session expired. Please sign in again." },
        { status: backendRes.status }
      );
      clearAuthCookies(response);
      return response;
    }

    const payload = data.data ?? data;
    if (!payload.access_token) {
      const response = NextResponse.json(
        { message: "Invalid refresh response from backend" },
        { status: 502 }
      );
      clearAuthCookies(response);
      return response;
    }

    const existingUserCookie = req.cookies.get("user")?.value;
    let user = payload.user;
    if (!user && existingUserCookie) {
      try {
        user = JSON.parse(existingUserCookie);
      } catch {
        try {
          user = JSON.parse(decodeURIComponent(existingUserCookie));
        } catch {
          user = undefined;
        }
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        access_token: payload.access_token,
        user: user ?? null,
      },
      { status: 200 }
    );

    setAuthCookies(response, {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || refreshToken,
      user: user || {},
    });

    return response;
  } catch (error) {
    console.error("Refresh proxy error", error);
    return NextResponse.json(
      { message: "Server error while refreshing session" },
      { status: 500 }
    );
  }
}
