import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_SERVER_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const res = await fetch(`${backendUrl}/leave-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : { message: await res.text() };

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || "Failed to update leave" },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: res.status });
}
