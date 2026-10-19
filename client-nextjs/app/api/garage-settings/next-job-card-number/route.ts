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
    const at = searchParams.get("at");
    const dateKey = searchParams.get("dateKey");
    const query = new URLSearchParams();
    if (dateKey) query.set("dateKey", dateKey);
    else if (at) query.set("at", at);

    const path = query.toString()
      ? `/garage-settings/next-job-card-number?${query}`
      : `/garage-settings/next-job-card-number`;

    const res = await backendFetch(path);
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Next job card number proxy error", error);
    return NextResponse.json(
      { message: "Failed to allocate next job card number" },
      { status: 502 }
    );
  }
}
