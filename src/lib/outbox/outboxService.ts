import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type OutboxEventStatus = 'pending' | 'processing' | 'published' | 'failed';

export interface OutboxEventRecord {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  status: OutboxEventStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

export interface EnqueueOutboxInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  maxAttempts?: number;
}

export interface EnqueueOutboxResult {
  success: boolean;
  eventId: string;
  eventType: string;
  status: OutboxEventStatus;
  source: 'database_rpc' | 'database_direct' | 'memory_fallback';
  createdAt: string;
  error?: string;
}

// Registro en memoria para desacoplamiento instantáneo y entornos de test/desarrollo
const memoryOutboxStore = new Map<string, OutboxEventRecord>();

// Cliente de administración Supabase con privilegios service_role (bypasea RLS para colas asíncronas)
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes('mock') || key.includes('mock') || url.includes('example') || key.includes('example')) {
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

function getSupabaseClient() {
  const admin = getSupabaseAdminClient();
  if (admin) return admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes('mock') || anonKey.includes('mock') || url.includes('example') || anonKey.includes('example')) {
    return null;
  }
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Inserción atómica en la tabla Outbox sin depender de peticiones HTTP externas.
 * Garantiza que la acción del usuario retorne de inmediato sin latencias de red.
 */
export async function enqueueOutboxEvent(
  input: EnqueueOutboxInput
): Promise<EnqueueOutboxResult> {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const maxAttempts = input.maxAttempts || 5;

  const eventRecord: OutboxEventRecord = {
    id: eventId,
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    status: 'pending',
    attempts: 0,
    maxAttempts,
    createdAt: now,
  };

  // 1. Guardar en registro en memoria para disponibilidad inmediata
  memoryOutboxStore.set(eventId, eventRecord);

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: true,
      eventId,
      eventType: input.eventType,
      status: 'pending',
      source: 'memory_fallback',
      createdAt: now,
    };
  }

  // 2. Intentar inserción atómica vía RPC 'enqueue_outbox_event' (SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('enqueue_outbox_event', {
      p_event_type: input.eventType,
      p_aggregate_type: input.aggregateType,
      p_aggregate_id: input.aggregateId,
      p_payload: input.payload,
      p_max_attempts: maxAttempts,
    });

    if (!rpcError && rpcData?.success) {
      const dbEventId = rpcData.event_id || eventId;
      eventRecord.id = dbEventId;
      memoryOutboxStore.set(dbEventId, eventRecord);

      return {
        success: true,
        eventId: dbEventId,
        eventType: input.eventType,
        status: 'pending',
        source: 'database_rpc',
        createdAt: rpcData.created_at || now,
      };
    }
  } catch (err: any) {
    // Si el RPC falla o no está en caché remota, continuar con inserción directa
  }

  // 3. Fallback a inserción directa en tabla outbox_events
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('outbox_events')
      .insert({
        event_type: input.eventType,
        aggregate_type: input.aggregateType,
        aggregate_id: input.aggregateId,
        payload: input.payload,
        status: 'pending',
        attempts: 0,
        max_attempts: maxAttempts,
      })
      .select('id, created_at')
      .maybeSingle();

    if (!insertError && insertData) {
      const dbEventId = insertData.id;
      eventRecord.id = dbEventId;
      memoryOutboxStore.set(dbEventId, eventRecord);

      return {
        success: true,
        eventId: dbEventId,
        eventType: input.eventType,
        status: 'pending',
        source: 'database_direct',
        createdAt: insertData.created_at || now,
      };
    }
  } catch (err: any) {
    // Si la conexión a base de datos falla, la capa de memoria absorbe el evento
  }

  return {
    success: true,
    eventId,
    eventType: input.eventType,
    status: 'pending',
    source: 'memory_fallback',
    createdAt: now,
  };
}

/**
 * Worker / Relayer de Outbox:
 * Procesa los eventos pendientes y los despacha asíncronamente a n8n sin bloquear la interfaz.
 */
export async function dispatchPendingOutboxEvents(batchSize: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ eventId: string; status: OutboxEventStatus; error?: string }>;
}> {
  const n8nWebhookUrl =
    process.env.N8N_WEBHOOK_PAYMENT_URL ||
    process.env.N8N_WEBHOOK_URL ||
    'http://localhost:3000/api/webhooks/n8n-mock';

  // Obtener eventos pendientes (de memoria y base de datos con service_role)
  const pendingEvents: OutboxEventRecord[] = [];
  for (const event of memoryOutboxStore.values()) {
    if (event.status === 'pending' || event.status === 'processing') {
      pendingEvents.push(event);
      if (pendingEvents.length >= batchSize) break;
    }
  }

  // Consultar base de datos real con privilegios de administrador service_role (bypasea RLS)
  const adminClient = getSupabaseAdminClient();
  if (adminClient && pendingEvents.length < batchSize) {
    try {
      const remainingSlots = batchSize - pendingEvents.length;
      const { data: dbEvents } = await adminClient
        .from('outbox_events')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true })
        .limit(remainingSlots);

      if (dbEvents && dbEvents.length > 0) {
        for (const row of dbEvents) {
          if (!pendingEvents.some((e) => e.id === row.id)) {
            pendingEvents.push({
              id: row.id,
              eventType: row.event_type,
              aggregateType: row.aggregate_type,
              aggregateId: row.aggregate_id,
              payload: row.payload,
              status: row.status,
              attempts: row.attempts,
              maxAttempts: row.max_attempts,
              createdAt: row.created_at,
            });
          }
        }
      }
    } catch {
      // Fallback transparente a cola en memoria
    }
  }

  const results: Array<{ eventId: string; status: OutboxEventStatus; error?: string }> = [];
  let succeeded = 0;
  let failed = 0;

  for (const event of pendingEvents) {
    event.status = 'processing';
    event.attempts += 1;

    try {
      // Envío asíncrono hacia n8n con timeout controlado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Outbox-Event-Id': event.id,
          'X-Outbox-Event-Type': event.eventType,
        },
        body: JSON.stringify({
          eventId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        event.status = 'published';
        event.publishedAt = new Date().toISOString();
        succeeded++;
        results.push({ eventId: event.id, status: 'published' });

        // Actualizar en base de datos con service_role
        if (adminClient) {
          try {
            await adminClient.rpc('mark_outbox_event_published', { p_event_id: event.id });
          } catch {
            await adminClient
              .from('outbox_events')
              .update({ status: 'published', published_at: new Date().toISOString() })
              .eq('id', event.id);
          }
        }
      } else {
        const errorText = `HTTP ${response.status}: ${response.statusText}`;
        event.lastError = errorText;
        if (event.attempts >= event.maxAttempts) {
          event.status = 'failed';
        } else {
          event.status = 'pending';
        }
        failed++;
        results.push({ eventId: event.id, status: event.status, error: errorText });
      }
    } catch (err: any) {
      const errorText = err.message || 'Error de conexión con n8n';
      event.lastError = errorText;
      if (event.attempts >= event.maxAttempts) {
        event.status = 'failed';
      } else {
        event.status = 'pending';
      }
      failed++;
      results.push({ eventId: event.id, status: event.status, error: errorText });
    }
  }

  return {
    processed: pendingEvents.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Consulta la lista de eventos en el Outbox para el visor operativo
 */
export function getOutboxStoreRecords(): OutboxEventRecord[] {
  return Array.from(memoryOutboxStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
