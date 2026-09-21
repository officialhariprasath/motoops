import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const res = await backendFetch(`/leave-requests/${id}`, {
    method: "PATCH",
    json: body,
  });
  const data = await parseBackendResponse(res);

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || "Failed to update leave" },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
