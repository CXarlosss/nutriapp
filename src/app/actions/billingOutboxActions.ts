'use server';

import { revalidatePath } from 'next/cache';
import { createCheckoutSessionAction } from '@/app/actions/stripeCheckout';
import { enqueueOutboxEvent } from '@/lib/outbox/outboxService';
import { processPendingOutboxEvents } from '@/lib/outbox/outboxDispatcher';
import { STRIPE_PRODUCTS, getProductByPriceId } from '@/lib/stripe/products';
import { resolveCurrentClinicId } from '@/lib/services/tenantResolver';

export interface RequestPaymentInput {
  clientId: string;
  priceId?: string;
  clientName?: string;
  clientEmail?: string;
}

export interface RequestPaymentResult {
  success: boolean;
  eventId?: string;
  checkoutUrl?: string;
  sessionId?: string;
  message?: string;
  error?: string;
}

/**
 * Server Action: Solicitar Pago a Paciente mediante Patrón Transactional Outbox
 * 
 * 1. Inicializa la sesión segura en Stripe Checkout para obtener el link oficial.
 * 2. Inserta atómicamente el evento 'billing.payment_requested' en la tabla 'outbox_events'.
 * 3. NO BLOQUEA el hilo principal esperando el envío del email (evita cuellos de botella HTTP).
 * 4. El relayer CDC / worker lee la tabla Outbox y despacha el payload estructurado a n8n.
 */
export async function requestPaymentForClientAction(
  input: RequestPaymentInput
): Promise<RequestPaymentResult> {
  const { clientId, priceId = 'price_plan_mensual_79eur', clientName, clientEmail } = input;

  if (!clientId) {
    return {
      success: false,
      error: 'Parámetro obligatorio ausente: clientId es requerido.',
    };
  }

  const product = getProductByPriceId(priceId) || STRIPE_PRODUCTS.plan_mensual;

  try {
    // 1. Obtener la sesión de Stripe Checkout (generación de URL segura)
    const checkoutResult = await createCheckoutSessionAction({
      clientId,
      priceId,
      clientEmail,
    });

    if (!checkoutResult.success || !checkoutResult.url) {
      return {
        success: false,
        error: checkoutResult.error || 'No se pudo generar el enlace de Stripe Checkout.',
      };
    }

    const checkoutUrl = checkoutResult.url;
    const sessionId = checkoutResult.sessionId || `cs_outbox_${Date.now()}`;
    const targetEmail = clientEmail || `${clientId}@paciente.nutriapp.es`;
    const targetName = clientName || 'Paciente';

    const clinicId = await resolveCurrentClinicId();

    // 2. Inserción atómica en la tabla 'outbox_events' (Patrón Transactional Outbox)
    // Se persiste el evento con el payload exacto para la automatización en n8n
    const outboxResult = await enqueueOutboxEvent({
      eventType: 'billing.payment_requested',
      aggregateType: 'client',
      aggregateId: clientId,
      payload: {
        clinic_id: clinicId,
        client_id: clientId,
        client_name: targetName,
        email: targetEmail,
        checkout_url: checkoutUrl,
        session_id: sessionId,
        price_id: priceId,
        amount_cents: product.amountCents,
        amount_eur: (product.amountCents / 100).toFixed(2),
        currency: 'EUR',
        plan_name: product.name,
        requested_at: new Date().toISOString(),
        email_subject: `Activa tu plan en NutriApp - Pago seguro disponible`,
        email_body: `Hola ${targetName}, tienes un cobro pendiente para activar tu plan nutricional. Paga de forma segura aquí: ${checkoutUrl}`,
      },
      maxAttempts: 5,
    });

    // 3. Despacho no bloqueante al canal de notificación asíncrona
    // Invocación directa in-process que evita fallos por fetch circular en serverless
    processPendingOutboxEvents(5).catch((err) => {
      console.warn('[BillingOutbox] Aviso en despacho asíncrono de evento:', err);
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      eventId: outboxResult.eventId,
      checkoutUrl,
      sessionId,
      message: `Enlace de pago generado con éxito. Evento ${outboxResult.eventType} (${outboxResult.eventId}) registrado en Outbox para entrega automática vía n8n.`,
    };
  } catch (err: any) {
    console.error('❌ [requestPaymentForClientAction] Error:', err.message);
    return {
      success: false,
      error: `Error procesando la solicitud de pago: ${err.message}`,
    };
  }
}

/**
 * Server Action: Despacha manualmente o bajo demanda los eventos pendientes en el Outbox
 * Ejecuta el relayer de forma directa sin requerir un bucle HTTP loopback.
 */
export async function dispatchBillingOutboxAction() {
  try {
    const result = await processPendingOutboxEvents(25);
    return {
      success: true,
      processed: result.processedCount,
      succeeded: result.succeededCount,
      failed: result.failedCount,
      errors: result.errors,
    };
  } catch (error: any) {
    console.error('[dispatchBillingOutboxAction] Error procesando outbox:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al despachar la bandeja de salida de facturación',
    };
  }
}
