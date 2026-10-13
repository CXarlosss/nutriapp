export interface N8nAppointmentPayload {
  event: 'appointment.scheduled' | 'appointment.cancelled';
  timestamp: string;
  appointment: {
    id: string;
    nutritionist_id: string;
    client_id: string;
    starts_at: string;
    ends_at: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    notes?: string | null;
    meet_url?: string | null;
  };
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  nutritionist: {
    id: string;
    full_name: string;
    timezone: string;
  };
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  payload: N8nAppointmentPayload;
  endpointUrl?: string;
  error?: string;
}

/**
 * Despacha un evento de cita al webhook configurado de n8n.
 * Si N8N_WEBHOOK_URL no está definido en el entorno, despacha de forma segura
 * a un webhook mock interno para desarrollo y validación.
 */
export async function dispatchN8nWebhook(
  payload: N8nAppointmentPayload
): Promise<WebhookDispatchResult> {
  const webhookUrl =
    process.env.N8N_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
    'https://n8n.webhook.internal/webhook/nutri-citas';

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NutriApp-BookingEngine/1.0',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: res.ok,
      statusCode: res.status,
      payload,
      endpointUrl: webhookUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // En entorno de test/desarrollo registramos el payload procesado
    return {
      success: false,
      payload,
      endpointUrl: webhookUrl,
      error: errorMsg,
    };
  }
}
