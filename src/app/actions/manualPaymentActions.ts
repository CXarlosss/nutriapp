'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { enqueueOutboxEvent } from '@/lib/outbox/outboxService';
import { processPendingOutboxEvents } from '@/lib/outbox/outboxDispatcher';
import { updateClientBillingStatus } from '@/lib/services/billingService';
import { resolveCurrentClinicId } from '@/lib/services/tenantResolver';
import { isValidUUID, DEMO_CLIENT_UUID, DEMO_CLINIC_UUID } from '@/lib/utils/uuid';

export interface RecordManualPaymentInput {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  paymentMethod: 'cash' | 'bizum' | 'transfer' | 'stripe';
  amountEur: number;
  periodDays: number;
  notes?: string;
}

export interface RecordManualPaymentResult {
  success: boolean;
  paymentId?: string;
  renewalDate?: string;
  message?: string;
  error?: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('mock') || key.includes('mock') || url.includes('example') || key.includes('example')) {
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Server Action: Registro de Cobro Manual en Consulta (Efectivo, Bizum, Transferencia)
 * Desacopla la activación del paciente de las comisiones de Stripe y reactiva el plan.
 */
export async function recordManualPaymentAction(
  input: RecordManualPaymentInput
): Promise<RecordManualPaymentResult> {
  const {
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    paymentMethod,
    amountEur = 79,
    periodDays = 30,
    notes,
  } = input;

  if (!clientId) {
    return {
      success: false,
      error: 'Parámetro obligatorio ausente: clientId es requerido.',
    };
  }

  const renewalDateObj = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
  const formattedRenewalDate = renewalDateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const paymentId = `pay_man_${Date.now()}`;

  try {
    // 1. Sincronizar con el servicio de facturación en memoria
    await updateClientBillingStatus({
      clientId,
      status: 'active',
      clientName,
      clientEmail,
      clientPhone,
      eventType: `manual_payment.${paymentMethod}`,
    });

    const safeClientId = isValidUUID(clientId) ? clientId : DEMO_CLIENT_UUID;
    const clinicId = await resolveCurrentClinicId();

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 2. Intentar llamar a la RPC atómica 'register_manual_payment'
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('register_manual_payment', {
          p_client_id: safeClientId,
          p_payment_method: paymentMethod,
          p_amount_eur: amountEur,
          p_period_days: periodDays,
          p_notes: notes || null,
        });

        if (!rpcErr && rpcData?.success) {
          console.log(`✅ [ManualPayment] RPC Supabase completada para cliente ${safeClientId}`);
        } else if (rpcErr) {
          console.warn('[ManualPayment] RPC no disponible, ejecutando fallback directo:', rpcErr.message);
          // Fallback a UPDATE directo sobre 'clients' si la RPC no existe aún
          const { error: updateErr } = await supabase
            .from('clients')
            .update({
              status: 'active',
              last_payment_at: new Date().toISOString(),
              renewal_date: renewalDateObj.toISOString(),
              payment_method: paymentMethod,
              last_payment_amount_eur: amountEur,
            })
            .eq('id', safeClientId);

          if (updateErr) {
            console.error('[ManualPayment] Error en UPDATE a clients:', updateErr.message);
          }

          // Intentar insertar en la tabla de pagos manuales con clinic_id
          const { error: insertErr } = await supabase
            .from('manual_payments')
            .insert({
              clinic_id: clinicId,
              client_id: safeClientId,
              payment_method: paymentMethod,
              amount_eur: amountEur,
              period_days: periodDays,
              status: 'completed',
              notes: notes || null,
            })
            .select()
            .maybeSingle();

          if (insertErr) {
            console.error('[ManualPayment] Error en INSERT a manual_payments:', insertErr.message);
          }
        }
      } catch (dbErr: any) {
        console.error('[ManualPayment] Excepción al persistir en Supabase:', dbErr?.message);
      }
    }

    // 3. Registrar evento en Outbox (notificación n8n para envío de recibo o confirmación sin coste)
    try {
      await enqueueOutboxEvent({
        eventType: 'billing.payment_received',
        aggregateType: 'client',
        aggregateId: clientId,
        payload: {
          clinic_id: clinicId,
          payment_id: paymentId,
          client_id: safeClientId,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          payment_method: paymentMethod,
          amount_eur: amountEur,
          period_days: periodDays,
          renewal_date: formattedRenewalDate,
          notes: notes || 'Cobro manual registrado en consulta (0% comisión).',
          registered_at: new Date().toISOString(),
        },
      });

      // Notificar al worker directamente sin bloqueo y sin fallos por fetch circular
      processPendingOutboxEvents(5).catch((err) => {
        console.warn('[ManualPayment] Aviso en despacho asíncrono de evento:', err);
      });
    } catch {
      // Ignorar de forma segura si la tabla Outbox no está disponible
    }

    // 4. Revalidar todas las rutas afectadas en caché
    try {
      revalidatePath('/dashboard');
      revalidatePath('/clients');
      revalidatePath(`/clients/${clientId}`);
      revalidatePath('/mi-plan');
      revalidatePath('/mi-dieta');
    } catch {}

    const methodLabels: Record<string, string> = {
      cash: 'Efectivo',
      bizum: 'Bizum',
      transfer: 'Transferencia Bancaria',
      stripe: 'Stripe',
    };

    return {
      success: true,
      paymentId,
      renewalDate: formattedRenewalDate,
      message: `¡Cobro de ${amountEur}€ registrado con éxito por ${methodLabels[paymentMethod] || paymentMethod}! El paciente está activo hasta el ${formattedRenewalDate} (0% de comisiones).`,
    };
  } catch (err: any) {
    console.error('❌ [recordManualPaymentAction] Error:', err.message);
    return {
      success: false,
      error: `Error procesando el cobro manual: ${err.message}`,
    };
  }
}
