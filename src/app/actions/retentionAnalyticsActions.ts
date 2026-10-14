'use server';

import {
  getStripeFinancialMetrics,
  getPatientRetentionRisks,
  evaluatePatientRetentionCron,
  sendRescueMessage,
  recordPortalAccess,
} from '@/lib/services/retentionAnalyticsService';
import {
  StripeFinancialMetrics,
  PatientRetentionRisk,
  CronRetentionExecutionResult,
} from '@/types/retentionAnalytics';

export interface RetentionActionData {
  metrics: StripeFinancialMetrics;
  risks: PatientRetentionRisk[];
  criticalCount: number;
  moderateCount: number;
  healthyCount: number;
}

/**
 * Server Action: Carga las métricas financieras de Stripe y el estado de retención de pacientes
 */
export async function getFinancialAndRetentionDataAction(): Promise<RetentionActionData> {
  const [metrics, risks] = await Promise.all([
    getStripeFinancialMetrics(),
    getPatientRetentionRisks(),
  ]);

  const criticalCount = risks.filter((r) => r.isAtRiskOfChurn).length;
  const moderateCount = risks.filter((r) => r.riskStatus === 'MODERATE').length;
  const healthyCount = risks.filter((r) => r.riskStatus === 'HEALTHY').length;

  return {
    metrics,
    risks,
    criticalCount,
    moderateCount,
    healthyCount,
  };
}

/**
 * Server Action: Ejecuta la evaluación cron de inactividad de pacientes (14 días sin abrir /mi-dieta)
 */
export async function runRetentionCronEvaluationAction(): Promise<CronRetentionExecutionResult> {
  return await evaluatePatientRetentionCron(false);
}

/**
 * Server Action: Envía mensaje preventivo de reenganche (WhatsApp / Email) a paciente en riesgo
 */
export async function sendRescueMessageToClientAction(
  clientId: string,
  channel: 'whatsapp' | 'email'
): Promise<{ success: boolean; message: string; timestamp: string }> {
  return await sendRescueMessage(clientId, channel);
}

/**
 * Server Action: Registra acceso al portal /mi-dieta
 */
export async function recordClientPortalAccessAction(clientId: string): Promise<void> {
  await recordPortalAccess(clientId);
}
