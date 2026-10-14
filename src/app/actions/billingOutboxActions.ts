'use server';

import { revalidatePath } from 'next/cache';
import { createCheckoutSessionAction } from '@/app/actions/stripeCheckout';
import { enqueueOutboxEvent } from '@/lib/outbox/outboxService';
import { STRIPE_PRODUCTS, getProductByPriceId } from '@/lib/stripe/products';

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

    // 2. Inserción atómica en la tabla 'outbox_events' (Patrón Transactional Outbox)
    // Se persiste el evento con el payload exacto para la automatización en n8n
    const outboxResult = await enqueueOutboxEvent({
      eventType: 'billing.payment_requested',
      aggregateType: 'client',
      aggregateId: clientId,
      payload: {
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
    // Se ejecuta en segundo plano sin ralentizar la respuesta de la interfaz de usuario
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outbox/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Ignorar de forma segura: el worker programado lo procesará en el siguiente ciclo
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
