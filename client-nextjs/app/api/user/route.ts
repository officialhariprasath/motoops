import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

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

export async function GET() {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await backendFetch(`/users`);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can create users or assign roles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const res = await backendFetch(`/users`, {
      method: "POST",
      json: body,
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}
