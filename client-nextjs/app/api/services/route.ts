import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function GET(req: NextRequest) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const { search } = new URL(req.url);
    const res = await backendFetch(`/services${search}`);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Services GET proxy error", error);
    return NextResponse.json(
      { message: "Failed to load services from backend" },
      { status: 502 }
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
    const body = await req.json();
    const res = await backendFetch(`/services`, {
      method: "POST",
      json: body,
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Services POST proxy error", error);
    return NextResponse.json(
      { message: "Failed to create service" },
      { status: 500 }
    );
  }
}
