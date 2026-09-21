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

  const all = req.nextUrl.searchParams.get("all");
  const search = all ? `?all=${all}` : "";
  const res = await backendFetch(`/catalog/items${search}`);
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
  const res = await backendFetch(`/catalog/items`, {
    method: "POST",
    json: body,
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
