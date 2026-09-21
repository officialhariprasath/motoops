import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

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

  const { id } = await context.params;
  const res = await backendFetch(`/invoices/${id}`);
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
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

  const { id } = await context.params;
  const body = await req.json();
  const res = await backendFetch(`/invoices/${id}/payment`, {
    method: "PATCH",
    json: body,
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
