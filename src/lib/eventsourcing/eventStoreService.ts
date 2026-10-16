import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DietEvent, DietEventType } from './dietEventTypes.ts';
import { projectDietState, type ProjectedDietState } from './dietProjector.ts';

export interface AppendEventParams {
  streamId: string;
  expectedVersion?: number;
  eventType: DietEventType;
  payload: Record<string, any>;
  metadata?: {
    author?: string;
    role?: 'nutricionista' | 'paciente' | 'ia';
    reason?: string;
    timestamp?: string;
  };
}

export interface AppendEventResult {
  success: boolean;
  eventId?: string;
  streamId: string;
  version: number;
  eventType: DietEventType;
  createdAt: string;
  error?: string;
}

// Almacén en memoria indexado por streamId para velocidad instantánea (<1ms) y resiliencia offline
const memoryEventStore = new Map<string, DietEvent[]>();

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('mock') || key.includes('mock') || url.includes('example') || key.includes('example')) {
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

// Inicializar un stream base de prueba con historial de demostración
const INITIAL_DEMO_STREAM = 'diet-demo-1';
const initialDemoEvents: DietEvent[] = [
  {
    id: 'evt-init-1',
    streamId: INITIAL_DEMO_STREAM,
    version: 1,
    eventType: 'DietAssigned',
    payload: {
      dietId: INITIAL_DEMO_STREAM,
      dietName: 'Pauta Recomposición Deportiva 2.200 kcal',
      clientId: 'a0000000-0000-0000-0000-000000000001',
      clientName: 'Carlos Gómez Pardo',
      targetKcal: 2200,
      items: [
        {
          id: 'item-1',
          dietId: INITIAL_DEMO_STREAM,
          dayIndex: 1,
          mealSlot: 'desayuno',
          position: 0,
          foodId: 'f-9',
          foodName: 'Avena en copos suaves',
          quantity: 60,
          unit: 'g',
          kcal: 227,
          proteinG: 8.1,
          carbsG: 40.8,
          fatG: 3.9,
        },
        {
          id: 'item-2',
          dietId: INITIAL_DEMO_STREAM,
          dayIndex: 1,
          mealSlot: 'comida',
          position: 0,
          foodId: 'f-1',
          foodName: 'Pechuga de pollo a la plancha',
          quantity: 150,
          unit: 'g',
          kcal: 248,
          proteinG: 46.5,
          carbsG: 0,
          fatG: 5.4,
        },
      ],
    },
    metadata: {
      author: 'Dra. Elena P. (Nutricionista)',
      role: 'nutricionista',
      reason: 'Asignación inicial tras primera consulta antropométrica',
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'evt-init-2',
    streamId: INITIAL_DEMO_STREAM,
    version: 2,
    eventType: 'FoodSwapped',
    payload: {
      itemId: 'item-2',
      dayIndex: 1,
      mealSlot: 'comida',
      oldFood: {
        id: 'f-1',
        name: 'Pechuga de pollo a la plancha',
        quantity: 150,
        unit: 'g',
        kcal: 248,
      },
      newFood: {
        id: 'f-4',
        name: 'Salmón fresco al horno',
        quantity: 160,
        unit: 'g',
        kcal: 333,
        proteinG: 32.0,
        carbsG: 0,
        fatG: 20.8,
      },
      reason: 'Preferencia del paciente para incrementar ingesta de ácidos grasos Omega-3',
    },
    metadata: {
      author: 'Dra. Elena P. (Nutricionista)',
      role: 'nutricionista',
      reason: 'Ajuste clínico por marcadores lipídicos',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

memoryEventStore.set(INITIAL_DEMO_STREAM, initialDemoEvents);

/**
 * Inserta un evento de forma inmutable (Append-Only) con control de concurrencia optimista
 */
export async function appendDietEvent(params: AppendEventParams): Promise<AppendEventResult> {
  const { streamId, expectedVersion, eventType, payload, metadata } = params;
  const now = new Date().toISOString();

  // Obtener stream existente en memoria
  const currentStream = memoryEventStore.get(streamId) || [];
  const currentVersion = currentStream.length > 0 ? currentStream[currentStream.length - 1].version : 0;

  // Verificación de concurrencia optimista (OCC)
  if (expectedVersion !== undefined && expectedVersion >= 0 && currentVersion !== expectedVersion) {
    return {
      success: false,
      streamId,
      version: currentVersion,
      eventType,
      createdAt: now,
      error: `ConcurrencyConflict: Se esperaba versión ${expectedVersion}, pero la versión actual es ${currentVersion}.`,
    };
  }

  const newVersion = currentVersion + 1;
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newEvent: DietEvent = {
    id: eventId,
    streamId,
    version: newVersion,
    eventType,
    payload,
    metadata: {
      author: metadata?.author || 'Dra. Elena P.',
      role: metadata?.role || 'nutricionista',
      reason: metadata?.reason || 'Actualización clínica en Diet Builder',
      timestamp: now,
    },
    createdAt: now,
  } as DietEvent;

  // 1. Guardar en memoria
  currentStream.push(newEvent);
  memoryEventStore.set(streamId, currentStream);

  // 2. Intentar inserción en PostgreSQL (RPC append_diet_event con SECURITY DEFINER)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('append_diet_event', {
        p_stream_id: streamId,
        p_expected_version: expectedVersion ?? -1,
        p_event_type: eventType,
        p_payload: payload,
        p_metadata: newEvent.metadata,
      });

      if (!rpcError && rpcData?.success) {
        return {
          success: true,
          eventId: rpcData.event_id || eventId,
          streamId,
          version: rpcData.version || newVersion,
          eventType,
          createdAt: rpcData.created_at || now,
        };
      }
    } catch {
      // Si la base de datos remota está en mantenimiento, la capa en memoria absorbe el cambio
    }
  }

  return {
    success: true,
    eventId,
    streamId,
    version: newVersion,
    eventType,
    createdAt: now,
  };
}

/**
 * Recupera el stream completo de eventos para un agregado
 */
export async function getDietEventStream(
  streamId: string,
  targetVersion?: number
): Promise<DietEvent[]> {
  const localStream = memoryEventStore.get(streamId) || [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase
        .from('diet_events')
        .select('*')
        .eq('stream_id', streamId)
        .order('version', { ascending: true });

      if (targetVersion !== undefined) {
        query = query.lte('version', targetVersion);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          streamId: d.stream_id,
          version: d.version,
          eventType: d.event_type as DietEventType,
          payload: d.payload,
          metadata: d.metadata,
          createdAt: d.created_at,
        })) as DietEvent[];
      }
    } catch {
      // Fallback a memoria
    }
  }

  if (targetVersion !== undefined) {
    return localStream.filter((e) => e.version <= targetVersion);
  }

  return localStream;
}

/**
 * Reconstruye la proyección actual (o histórica con Time Travel) de la dieta
 */
export async function getProjectedDiet(
  streamId: string,
  targetVersion?: number
): Promise<ProjectedDietState> {
  const events = await getDietEventStream(streamId, targetVersion);
  return projectDietState(events, targetVersion);
}
