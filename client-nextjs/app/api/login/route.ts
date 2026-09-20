import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: Request) {
  try {
    const backendUrl = process.env.BACKEND_SERVER_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { message: "BACKEND_SERVER_URL is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const backendRes = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = backendRes.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendRes.json()
      : { message: await backendRes.text() };

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Login failed" },
        { status: backendRes.status }
      );
    }

    const loginData = data.data ?? data;

    if (!loginData.access_token || !loginData.user) {
      return NextResponse.json(
        { message: "Invalid login response from backend" },
        { status: 502 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        access_token: loginData.access_token,
        user: loginData.user,
      },
      { status: 200 }
    );

    setAuthCookies(response, {
      access_token: loginData.access_token,
      refresh_token: loginData.refresh_token,
      user: loginData.user,
    });

    return response;
  } catch (error) {
    console.error("Login proxy error", error);

    return NextResponse.json(
      { message: "Server error while contacting backend login" },
      { status: 500 }
    );
  }
}
