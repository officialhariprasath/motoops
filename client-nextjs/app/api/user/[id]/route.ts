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

function includesAdminOnlyFields(body: Record<string, unknown>) {
  return (
    Object.prototype.hasOwnProperty.call(body, "role") ||
    Object.prototype.hasOwnProperty.call(body, "designation")
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const { id } = await context.params;
    const res = await backendFetch(`/users/${id}`);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    if (includesAdminOnlyFields(body) && !isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can update role or designation" },
        { status: 403 }
      );
    }

    const res = await backendFetch(`/users/${id}`, {
      method: "PATCH",
      json: body,
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can delete users" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const res = await backendFetch(`/users/${id}`, {
      method: "DELETE",
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
