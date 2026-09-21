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
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { message: "Owner ID required" },
        { status: 400 }
      );
    }

    const res = await backendFetch(`/vehicles/owner/${ownerId}`);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
