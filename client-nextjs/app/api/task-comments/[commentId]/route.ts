import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

export async function PATCH(req: NextRequest, context: any) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { commentId } = await context.params;
  const body = await req.json();
  const res = await backendFetch(`/task-comments/${commentId}`, {
    method: "PATCH",
    json: body,
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, context: any) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const { commentId } = await context.params;
  const res = await backendFetch(`/task-comments/${commentId}`, {
    method: "DELETE",
  });
  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}
