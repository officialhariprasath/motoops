import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_SERVER_URL;

async function parse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function GET(req: NextRequest, context: any) {
  const { serviceId } = await context.params;
  const res = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
    cache: 'no-store',
  });
  const data = await parse(res);

  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, context: any) {
  const { serviceId } = await context.params;
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await parse(res);
  return NextResponse.json(data, { status: res.status });

  
}

export async function DELETE(req: NextRequest, context: any) {
  const { serviceId } = await context.params;

  const res = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
    method: "DELETE",
  });

  const data = await parse(res);

  return NextResponse.json(data, {
    status: res.status,
  });
}
