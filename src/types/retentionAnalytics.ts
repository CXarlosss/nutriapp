export type ChurnRiskLevel = 'HEALTHY' | 'MODERATE' | 'CRITICAL';

export interface MonthlyFinancialRecord {
  month: string;
  mrr: number;
  revenue: number;
  newClients: number;
  churnedClients: number;
  activeSubscribers: number;
}

export interface PlanBreakdownItem {
  id: string;
  name: string;
  priceFormatted: string;
  count: number;
  totalMonthlyRevenue: number;
  sharePercent: number;
}

export interface StripeFinancialMetrics {
  mrr: number; // Monthly Recurring Revenue en euros
  previousMrr: number;
  mrrGrowthMoM: number; // % variación mes sobre mes
  arr: number; // Annual Run Rate (MRR * 12)
  activeSubscribers: number;
  churnRate: number; // Tasa de cancelación mensual en %
  previousChurnRate: number;
  ltv: number; // Customer Lifetime Value en euros
  arpu: number; // Average Revenue Per User en euros
  netVolume30d: number; // Facturación total de los últimos 30 días
  planBreakdown: PlanBreakdownItem[];
  monthlyHistory: MonthlyFinancialRecord[];
  lastSyncedAt: string;
}

export interface PatientRetentionRisk {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  planName: string;
  lastPortalAccessAt: string; // ISO date
  daysInactive: number;
  riskStatus: ChurnRiskLevel;
  isAtRiskOfChurn: boolean; // true si daysInactive >= 14
  adherenceRate: number; // % adherencia reportada
  rescueMessageSent: boolean;
  rescueLastSentAt?: string;
}

export interface RetentionSummary {
  totalMonitored: number;
  criticalAtRiskCount: number; // Inactivos >= 14 días
  moderateRiskCount: number; // Inactivos 7-13 días
  healthyCount: number; // Activos < 7 días
  retentionRate30d: number; // % retención
  lastCronRunAt: string;
  automatedAlertsDispatched: number;
}

export interface CronRetentionExecutionResult {
  success: boolean;
  timestamp: string;
  evaluatedClientsCount: number;
  criticalAtRiskCount: number;
  moderateRiskCount: number;
  alertsDispatched: number;
  criticalClients: PatientRetentionRisk[];
  message: string;
}
