import { NextResponse } from 'next/server';

let lastCapturedPayload: unknown = null;
let lastCapturedAt: string | null = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    lastCapturedPayload = body;
    lastCapturedAt = new Date().toISOString();

    return NextResponse.json({
      received: true,
      capturedAt: lastCapturedAt,
      node: 'n8n-webhook-trigger',
      data: body,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    node: 'n8n-webhook-trigger',
    lastCapturedAt,
    lastCapturedPayload,
  });
}
