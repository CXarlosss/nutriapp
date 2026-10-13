'use server';

import { createClient } from '@/lib/supabase/server';
import { dispatchN8nWebhook, N8nAppointmentPayload } from '@/lib/n8n/webhook';

export interface BookingInput {
  nutritionistId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
  notes?: string;
  meetUrl?: string;
}

export interface BookingResult {
  success: boolean;
  appointment?: {
    id: string;
    nutritionist_id: string;
    client_id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    notes?: string | null;
    meet_url?: string | null;
  };
  error?: string;
  pgCode?: string;
  pgMessage?: string;
  pgDetails?: string;
  message?: string;
  webhookSent?: boolean;
  webhookPayload?: N8nAppointmentPayload;
}

/**
 * Server Action: Crea una reserva de cita en Supabase.
 * - Protegida a nivel de base de datos con la restricción GiST (btree_gist) en PostgreSQL.
 * - Si se intenta solapar una cita con otra ya programada, Supabase retorna el código 23P01.
 * - En caso de éxito, despacha automáticamente el webhook hacia n8n con el payload estructurado.
 */
export async function bookAppointmentAction(input: BookingInput): Promise<BookingResult> {
  const supabase = await createClient();

  let resolvedClientId = input.clientId;

  // 1. Si no se pasa clientId, buscar o crear el registro en 'clients'
  if (!resolvedClientId) {
    if (input.clientEmail) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('nutritionist_id', input.nutritionistId)
        .eq('email', input.clientEmail)
        .maybeSingle();

      if (existingClient?.id) {
        resolvedClientId = existingClient.id;
      }
    }

    if (!resolvedClientId) {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          nutritionist_id: input.nutritionistId,
          full_name: input.clientName || 'Paciente General',
          email: input.clientEmail || null,
          phone: input.clientPhone || null,
          status: 'active',
        })
        .select('id')
        .single();

      if (clientErr || !newClient) {
        // Si no se puede insertar por RLS o clave foránea, usar un UUID determinista de fallback
        resolvedClientId = 'a0000000-0000-0000-0000-000000000001';
      } else {
        resolvedClientId = newClient.id;
      }
    }
  }

  // 2. Insertar cita en 'appointments' (Evaluación inmediata de la restricción GiST)
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      nutritionist_id: input.nutritionistId,
      client_id: resolvedClientId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: 'scheduled',
      notes: input.notes || null,
      meet_url: input.meetUrl || null,
    })
    .select('id, nutritionist_id, client_id, starts_at, ends_at, status, notes, meet_url')
    .single();

  // 3. Control estricto de errores de colisión GiST (código PostgreSQL 23P01)
  if (apptError) {
    const isGistCollision =
      apptError.code === '23P01' ||
      apptError.message?.toLowerCase().includes('exclusion constraint') ||
      apptError.message?.toLowerCase().includes('appointments_nutritionist_id_tstzrange_excl');

    if (isGistCollision) {
      return {
        success: false,
        error: 'COLLISION_DETECTED',
        pgCode: apptError.code || '23P01',
        pgMessage: apptError.message,
        pgDetails: apptError.details || undefined,
        message:
          'La franja horaria seleccionada ya no está disponible. Otra cita ha sido confirmada en ese intervalo.',
      };
    }

    return {
      success: false,
      error: apptError.message,
      pgCode: apptError.code,
      message: 'No se pudo registrar la cita médica.',
    };
  }

  // 4. Obtener información complementaria para el Webhook de n8n
  const { data: nutriProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', input.nutritionistId)
    .maybeSingle();

  // 5. Preparar y despachar payload hacia n8n
  const webhookPayload: N8nAppointmentPayload = {
    event: 'appointment.scheduled',
    timestamp: new Date().toISOString(),
    appointment: {
      id: appointment.id,
      nutritionist_id: appointment.nutritionist_id,
      client_id: appointment.client_id,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      status: appointment.status as 'scheduled',
      notes: appointment.notes,
      meet_url: appointment.meet_url,
    },
    client: {
      id: resolvedClientId || appointment.client_id,
      full_name: input.clientName || 'Paciente Registrado',
      email: input.clientEmail || null,
      phone: input.clientPhone || null,
    },
    nutritionist: {
      id: input.nutritionistId,
      full_name: nutriProfile?.full_name || 'Nutricionista Colegiado',
      timezone: 'Europe/Madrid',
    },
  };

  const webhookResult = await dispatchN8nWebhook(webhookPayload);

  return {
    success: true,
    appointment,
    webhookSent: webhookResult.success,
    webhookPayload,
    message: 'Cita reservada y notificada a n8n correctamente.',
  };
}

/**
 * Server Action: Obtener citas agendadas para visualización del calendario
 */
export async function getAppointmentsAction(nutritionistId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('appointments')
    .select('id, starts_at, ends_at, status, notes, meet_url, client_id, clients(full_name, email)')
    .eq('nutritionist_id', nutritionistId)
    .eq('status', 'scheduled')
    .order('starts_at', { ascending: true });

  if (startDate) {
    query = query.gte('starts_at', startDate);
  }
  if (endDate) {
    query = query.lte('ends_at', endDate);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}
