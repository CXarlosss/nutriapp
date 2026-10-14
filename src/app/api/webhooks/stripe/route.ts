import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/stripe';
import { updateClientBillingStatus } from '@/lib/services/billingService';

/**
 * Webhook de Stripe para NutriApp
 * 
 * Escucha eventos asíncronos del ciclo de vida de pagos y suscripciones:
 * - checkout.session.completed: Pagos únicos y activación de suscripciones
 * - invoice.payment_succeeded: Renovaciones periódicas de suscripciones
 * - customer.subscription.deleted: Cancelación de planes
 * 
 * SEGURIDAD OBLIGATORIA:
 * Valida criptográficamente la cabecera 'Stripe-Signature' mediante HMAC-SHA256
 * usando STRIPE_WEBHOOK_SECRET. Si la firma es inválida o no existe, rechaza
 * la petición con HTTP 400 (Bad Request).
 */
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');

  // 1. Verificación estricta de presencia de cabecera de firma
  if (!signature) {
    console.warn('⚠️ [Stripe Webhook] Petición rechazada: Cabecera Stripe-Signature ausente.');
    return new Response(
      JSON.stringify({ error: 'Firma ausente: la cabecera Stripe-Signature es obligatoria.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Extracción del raw body para verificación criptográfica
  const rawBody = await req.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_nutriapp_super_secure_key_12345';

  let event: Stripe.Event;

  // 3. Validación criptográfica de la firma del payload
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ [Stripe Webhook] Error de validación criptográfica: ${err.message}`);
    return new Response(
      JSON.stringify({ error: `Firma del webhook inválida: ${err.message}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log(`🔔 [Stripe Webhook] Evento recibido verificado: ${event.type} (ID: ${event.id})`);

  // 4. Enrutamiento y procesamiento de eventos según su tipo
  try {
    switch (event.type) {
      // Caso 1: Sesión de Checkout Completada (Pago único o setup de suscripción)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientId = session.metadata?.client_id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (clientId) {
          await updateClientBillingStatus({
            clientId,
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            eventType: event.type,
          });

          console.log(`✅ [Stripe Webhook] Evento procesado exitosamente: checkout.session.completed para cliente: ${clientId}`);
        } else {
          console.warn('⚠️ [Stripe Webhook] checkout.session.completed recibido sin metadata.client_id');
        }
        break;
      }

      // Caso 2: Pago de Factura Exitoso (Renovación de suscripción mensual)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const clientId =
          (invoice as any).subscription_details?.metadata?.client_id ||
          invoice.lines?.data?.[0]?.metadata?.client_id ||
          (invoice as any).metadata?.client_id;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const subscriptionId = typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;

        if (clientId) {
          await updateClientBillingStatus({
            clientId,
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            eventType: event.type,
          });

          console.log(`✅ [Stripe Webhook] Evento procesado exitosamente: invoice.payment_succeeded para cliente: ${clientId}`);
        }
        break;
      }

      // Caso 3: Suscripción Cancelada / Eliminada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const clientId = subscription.metadata?.client_id;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

        if (clientId) {
          await updateClientBillingStatus({
            clientId,
            status: 'inactive',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            eventType: event.type,
          });

          console.log(`✅ [Stripe Webhook] Evento procesado exitosamente: customer.subscription.deleted para cliente: ${clientId}`);
        } else {
          console.warn('⚠️ [Stripe Webhook] customer.subscription.deleted recibido sin metadata.client_id');
        }
        break;
      }

      default:
        console.log(`ℹ️ [Stripe Webhook] Evento no gestionado directamente: ${event.type}`);
        break;
    }

    // Invalidar caché de vistas clave para reflejar el nuevo estado del paciente
    try {
      revalidatePath('/dashboard');
      revalidatePath('/mi-plan');
      revalidatePath('/mi-dieta');
    } catch {
      // Revalidación silenciosa
    }

    return Response.json({
      received: true,
      eventId: event.id,
      type: event.type,
    });
  } catch (handlerErr: any) {
    console.error(`❌ [Stripe Webhook] Error interno procesando evento: ${handlerErr.message}`);
    return Response.json(
      { error: `Error procesando evento: ${handlerErr.message}` },
      { status: 500 }
    );
  }
}
