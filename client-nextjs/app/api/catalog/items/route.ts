import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");
  const search = all ? `?all=${all}` : "";
  const res = await fetch(`${BACKEND_URL}/catalog/items${search}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/catalog/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
