import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function GET() {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await backendFetch(`/garage-settings`);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Garage settings GET proxy error", error);
    return NextResponse.json(
      { message: "Failed to load garage settings" },
      { status: 502 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const res = await backendFetch(`/garage-settings`, {
      method: "PUT",
      json: body,
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Garage settings PUT proxy error", error);
    return NextResponse.json(
      { message: "Failed to update garage settings" },
      { status: 500 }
    );
  }
}
