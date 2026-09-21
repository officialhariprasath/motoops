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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const res = await backendFetch(
    `/vehicles/search?q=${encodeURIComponent(q)}`
  );
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
