import { NextRequest, NextResponse } from "next/server";

async function proxy(path: string, init?: RequestInit) {
  const backendUrl = process.env.BACKEND_SERVER_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : { message: await res.text() };

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
      {
        message:
          (raw || "Leave request failed") + hint,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const mechanicId = req.nextUrl.searchParams.get("mechanicId");
  const qs = mechanicId ? `?mechanicId=${encodeURIComponent(mechanicId)}` : "";
  return proxy(`/leave-requests${qs}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy("/leave-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
