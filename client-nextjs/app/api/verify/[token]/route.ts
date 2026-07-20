import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "BACKEND_SERVER_URL is not configured" },
        { status: 500 }
      );
    }

    const { token } = await params;

    const res = await fetch(`${BACKEND_URL}/auth/verify/${token}`, {
      method: "GET",
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : { message: await res.text() };

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to verify email" },
      { status: 500 }
    );
  }
}
