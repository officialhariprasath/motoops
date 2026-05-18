// File: api/register/route.ts

import { NextResponse } from "next/server";

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
      credentials: "include",
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

    response.cookies.set("access_token", loginData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    if (loginData.refresh_token) {
      response.cookies.set("refresh_token", loginData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    response.cookies.set("user", JSON.stringify(loginData.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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
