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

  const { search } = new URL(req.url);
  const res = await backendFetch(`/invoices${search}`);
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const res = await backendFetch(`/invoices`, {
    method: "POST",
    json: body,
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
