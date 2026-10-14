import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_nutriapp_development_key';

/**
 * Instancia singleton de la API de Stripe para el entorno de servidor (Node.js/Next.js)
 */
export const stripe = new Stripe(apiKey, {
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
  appInfo: {
    name: 'NutriApp Clinical Platform',
    version: '1.0.0',
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
