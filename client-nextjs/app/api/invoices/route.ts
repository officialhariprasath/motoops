import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

async function parseBackendResponse(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

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
  const { search } = new URL(req.url);
  const res = await fetch(`${BACKEND_URL}/invoices${search}`, {
    cache: "no-store",
  });

  const data = await parseBackendResponse(res);

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await parseBackendResponse(res);

  return NextResponse.json(data, { status: res.status });
}
