import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function GET(req: NextRequest, context: any) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { taskId } = await context.params;
  const res = await backendFetch(`/tasks/${taskId}/comments`);
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, context: any) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { taskId } = await context.params;
  const body = await req.json();
  const res = await backendFetch(`/tasks/${taskId}/comments`, {
    method: "POST",
    json: body,
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
