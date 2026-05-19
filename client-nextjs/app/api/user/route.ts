// File: app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

function getCurrentUser(req: NextRequest) {
  const rawUser = req.cookies.get("user")?.value;
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(rawUser));
    } catch {
      return null;
    }
  }
}

function isAdmin(req: NextRequest) {
  return getCurrentUser(req)?.role === "admin";
}

// ================= GET USERS =================
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/users`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch users",
      },
      {
        status: 500,
      }
    );
  }
}

// ================= CREATE USER =================
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can create users or assign roles" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create user",
      },
      {
        status: 500,
      }
    );
  }
}

