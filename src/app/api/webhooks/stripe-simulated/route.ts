import { updateClientBillingStatus } from '@/lib/services/billingService';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientId = body.clientId || 'a0000000-0000-0000-0000-000000000001';
    const status = body.status || 'active';
    const sessionId = body.sessionId || `cs_sim_${Date.now()}`;

    const result = await updateClientBillingStatus({
      clientId,
      status,
      stripeCustomerId: `cus_sim_${Date.now()}`,
      stripeSubscriptionId: `sub_sim_${Date.now()}`,
      eventType: 'checkout.session.completed',
    });

    console.log(`✅ [Stripe Simulated] Estado del cliente ${clientId} actualizado a: ${status} (sesión: ${sessionId})`);

    try {
      revalidatePath('/dashboard');
      revalidatePath('/mi-plan');
      revalidatePath('/mi-dieta');
    } catch {}

    return Response.json({ success: true, result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
