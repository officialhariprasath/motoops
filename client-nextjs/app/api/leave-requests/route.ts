import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  parseBackendResponse,
  getBackendUrl,
} from "@/lib/backend-fetch";

async function proxyLeave(path: string, init?: Parameters<typeof backendFetch>[1]) {
  if (!getBackendUrl()) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const res = await backendFetch(path, init);
  const data = await parseBackendResponse(res);

  if (!res.ok) {
    const raw =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : "";
    const hint =
      /cannot (post|get|patch) \/leave-requests/i.test(raw) ||
      res.status === 404
        ? " Leave API is missing on the backend - restart Nest locally, or push/redeploy so LeaveModule is live."
        : "";
    return NextResponse.json(
      { message: (raw || "Leave request failed") + hint },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const mechanicId = req.nextUrl.searchParams.get("mechanicId");
  const qs = mechanicId ? `?mechanicId=${encodeURIComponent(mechanicId)}` : "";
  return proxyLeave(`/leave-requests${qs}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyLeave("/leave-requests", {
    method: "POST",
    json: body,
  });
}
