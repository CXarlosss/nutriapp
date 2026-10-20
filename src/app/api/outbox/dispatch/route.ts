import { NextResponse, type NextRequest } from 'next/server';
import { processPendingOutboxEvents } from '@/lib/outbox/outboxDispatcher';
import { getOutboxStoreRecords } from '@/lib/outbox/outboxService';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Si se ha configurado CRON_SECRET, validar la cabecera Bearer
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const result = await processPendingOutboxEvents(50);
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error desconocido al procesar outbox' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const events = getOutboxStoreRecords();
  return NextResponse.json({
    totalEvents: events.length,
    events,
  });
}
