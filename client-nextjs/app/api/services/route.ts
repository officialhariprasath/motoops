import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

async function parseBackendResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return {
      message: "Backend returned a non-JSON response",
      detail: text.slice(0, 300),
    };
  }
}

export async function GET(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const { search } = new URL(req.url);
    const res = await fetch(`${BACKEND_URL}/services${search}`, {
      cache: "no-store",
    });
    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Services GET proxy error", error);
    return NextResponse.json(
      { message: "Failed to load services from backend" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "BACKEND_SERVER_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Services POST proxy error", error);
    return NextResponse.json(
      { message: "Failed to create service" },
      { status: 500 }
    );
  }
}
