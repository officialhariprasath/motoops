import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";

  const res = await fetch(
    `${BACKEND_URL}/vehicles/search?q=${encodeURIComponent(q)}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  return NextResponse.json(data, {
    status: res.status,
  });
}