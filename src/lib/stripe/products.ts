export interface StripeProductConfig {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amountCents: number; // en céntimos (ej. 5000 = 50,00 €)
  currency: 'eur';
  mode: 'payment' | 'subscription';
  interval?: 'month' | 'year';
  badge: string;
  features: string[];
}

export const STRIPE_PRODUCTS: Record<string, StripeProductConfig> = {
  consulta_unica: {
    id: 'prod_consulta_unica',
    name: 'Consulta Única Nutricional',
    description: 'Valoración clínica completa, pauta de macronutrientes y diseño de menú personalizado.',
    priceId: process.env.STRIPE_PRICE_CONSULTA_UNICA || 'price_consulta_unica_50eur',
    amountCents: 5000, // 50,00 €
    currency: 'eur',
    mode: 'payment',
    badge: 'Pago Único',
    features: [
      'Entrevista clínica y valoración de objetivos',
      'Pauta personalizada de macronutrientes y calorías',
      'Acceso al portal del paciente durante 30 días',
      'Exportación en PDF de alta fidelidad clínica',
    ],
  },
  plan_mensual: {
    id: 'prod_plan_mensual',
    name: 'Plan Mensual con Seguimiento Continuo',
    description: 'Acompañamiento clínico integral, revisiones quincenales y ciclado nutricional.',
    priceId: process.env.STRIPE_PRICE_PLAN_MENSUAL || 'price_plan_mensual_79eur',
    amountCents: 7900, // 79,00 € / mes
    currency: 'eur',
    mode: 'subscription',
    interval: 'month',
    badge: 'Suscripción Mensual',
    features: [
      'Todo lo incluido en la consulta inicial',
      'Revisiones quincenales y ajustes del plan',
      'Soporte prioritario y resolución de dudas',
      'Generación ilimitada de variantes con IA',
      'Ciclado estratégico de carbohidratos según entrenamiento',
    ],
  },
};

export function getProductByPriceId(priceId: string): StripeProductConfig | undefined {
  return Object.values(STRIPE_PRODUCTS).find(
    (p) => p.priceId === priceId || p.id === priceId
  );
}
