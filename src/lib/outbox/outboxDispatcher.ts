import { getSupabaseAdminClient, OutboxEventRecord, OutboxEventStatus } from '@/lib/outbox/outboxService';
import { resolveCurrentClinicId } from '@/lib/services/tenantResolver';

export interface DispatchResult {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  errors: Array<{ eventId: string; message: string }>;
}

/**
 * Procesa el payload del evento según su tipo clínico o financiero.
 * Despacha asíncronamente a webhooks (n8n) o integra tareas de fondo.
 */
async function handleEventPayload(event: {
  id: string;
  event_type: string;
  aggregate_type?: string;
  aggregate_id?: string;
  payload: Record<string, any>;
}): Promise<void> {
  const n8nWebhookUrl =
    process.env.N8N_WEBHOOK_PAYMENT_URL ||
    process.env.N8N_WEBHOOK_URL ||
    'http://localhost:3000/api/webhooks/n8n-mock';

  // Si no hay URL configurada o estamos en desarrollo sin servidor mock externo, registrar en logs
  if (!n8nWebhookUrl) {
    console.log(`[outboxDispatcher] Evento ${event.id} (${event.event_type}) registrado para procesamiento local.`);
    return;
  }

  // Despacho HTTP con timeout controlado de 5 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Outbox-Event-Id': event.id,
        'X-Outbox-Event-Type': event.event_type,
      },
      body: JSON.stringify({
        eventId: event.id,
        eventType: event.event_type,
        aggregateType: event.aggregate_type || 'unknown',
        aggregateId: event.aggregate_id || 'unknown',
        payload: event.payload,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Endpoint n8n respondió con error HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout al despachar evento ${event.id} a n8n (> 5000ms)`);
    }
    throw err;
  }
}

/**
 * Despachador directo in-process para la tabla Outbox.
 * Elimina la necesidad de peticiones HTTP circulares (fetch loopback)
 * y garantiza ejecución fiable tanto en Server Actions como en Cron Jobs.
 */
export async function processPendingOutboxEvents(batchSize: number = 20): Promise<DispatchResult> {
  const result: DispatchResult = {
    processedCount: 0,
    succeededCount: 0,
    failedCount: 0,
    errors: [],
  };

  const supabase = getSupabaseAdminClient();
  const clinicId = await resolveCurrentClinicId();

  // Si no hay cliente Supabase disponible (modo desarrollo offline/mock), salir limpiamente
  if (!supabase) {
    return result;
  }

  // 1. Consultar eventos pendientes en PostgreSQL
  let query = supabase
    .from('outbox_events')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data: events, error: fetchError } = await query;

  if (fetchError) {
    console.error('[outboxDispatcher] Error consultando outbox_events en Supabase:', fetchError.message);
    throw new Error(`[outboxDispatcher] Error consultando outbox_events: ${fetchError.message}`);
  }

  if (!events || events.length === 0) {
    return result;
  }

  // 2. Procesar lote de eventos de forma secuencial y atómica
  for (const event of events) {
    result.processedCount++;
    const currentAttempts = (event.attempts || 0) + 1;
    const maxAttempts = event.max_attempts || 5;

    try {
      // Marcar evento como en proceso
      await supabase
        .from('outbox_events')
        .update({
          status: 'processing',
          attempts: currentAttempts,
        })
        .eq('id', event.id);

      // Manejar payload
      await handleEventPayload(event);

      // Marcar como publicado / entregado
      await supabase
        .from('outbox_events')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', event.id);

      result.succeededCount++;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      result.failedCount++;
      result.errors.push({ eventId: event.id, message: errorMessage });

      const finalStatus: OutboxEventStatus = currentAttempts >= maxAttempts ? 'failed' : 'pending';

      // Registrar error en PostgreSQL para auditoría y reintentos
      await supabase
        .from('outbox_events')
        .update({
          status: finalStatus,
          last_error: errorMessage,
          attempts: currentAttempts,
        })
        .eq('id', event.id);
    }
  }

  return result;
}
