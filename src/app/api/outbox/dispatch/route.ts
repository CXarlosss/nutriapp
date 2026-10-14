import { dispatchPendingOutboxEvents, getOutboxStoreRecords } from '@/lib/outbox/outboxService';

export async function POST(req: Request) {
  try {
    const result = await dispatchPendingOutboxEvents(10);
    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const events = getOutboxStoreRecords();
  return Response.json({
    totalEvents: events.length,
    events,
  });
}
