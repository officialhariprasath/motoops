import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { ownerId } = await params;
  const res = await backendFetch(`/vehicles/owner/${ownerId}`);
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
