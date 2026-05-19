// File: app/api/users/[id]/route.ts

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

function includesAdminOnlyFields(body: Record<string, unknown>) {
  return Object.prototype.hasOwnProperty.call(body, "role") ||
    Object.prototype.hasOwnProperty.call(body, "designation");
}

// ================= GET SINGLE USER =================
export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${BACKEND_URL}/users/${id}`, {
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
        message: "Failed to fetch user",
      },
      {
        status: 500,
      }
    );
  }
}

// ================= UPDATE USER =================
export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (includesAdminOnlyFields(body) && !isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can update role or designation" },
        { status: 403 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/users/${id}`, {
      method: "PATCH",
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
        message: "Failed to update user",
      },
      {
        status: 500,
      }
    );
  }
}

// ================= DELETE USER =================
export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { message: "Only admin can delete users" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const res = await fetch(`${BACKEND_URL}/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete user",
      },
      {
        status: 500,
      }
    );
  }
}

