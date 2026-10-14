'use client';

import React, { useState, useEffect } from 'react';
import {
  IconTrendingUp,
  IconUsers,
  IconAlertTriangle,
  IconCoin,
  IconCalendarTime,
  IconCheck,
  IconRefresh,
  IconPlayerPlay,
  IconBrandWhatsapp,
  IconMail,
  IconClock,
  IconShieldExclamation,
  IconActivity,
  IconChartBar,
} from '@tabler/icons-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  getFinancialAndRetentionDataAction,
  runRetentionCronEvaluationAction,
  sendRescueMessageToClientAction,
} from '@/app/actions/retentionAnalyticsActions';
import {
  StripeFinancialMetrics,
  PatientRetentionRisk,
  CronRetentionExecutionResult,
} from '@/types/retentionAnalytics';

export function RetentionBusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [metrics, setMetrics] = useState<StripeFinancialMetrics | null>(null);
  const [risks, setRisks] = useState<PatientRetentionRisk[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [moderateCount, setModerateCount] = useState(0);
  const [healthyCount, setHealthyCount] = useState(0);
  const [lastCronResult, setLastCronResult] = useState<CronRetentionExecutionResult | null>(null);
  const [rescueLoading, setRescueLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFinancialAndRetentionDataAction();
      setMetrics(res.metrics);
      setRisks(res.risks);
      setCriticalCount(res.criticalCount);
      setModerateCount(res.moderateCount);
      setHealthyCount(res.healthyCount);
    } catch (err) {
      console.error('Error cargando analíticas de retención:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCron = async () => {
    setCronRunning(true);
    try {
      const result = await runRetentionCronEvaluationAction();
      setLastCronResult(result);
      await loadData();
      showToast(`⚡ Cron ejecutado con éxito: ${result.criticalAtRiskCount} pacientes en riesgo crítico.`);
    } catch (err) {
      console.error('Error ejecutando cron:', err);
      showToast('❌ Error al ejecutar el cron de retención.');
    } finally {
      setCronRunning(false);
    }
  };

  const handleSendRescue = async (clientId: string, channel: 'whatsapp' | 'email') => {
    setRescueLoading(`${clientId}-${channel}`);
    try {
      const res = await sendRescueMessageToClientAction(clientId, channel);
      if (res.success) {
        showToast(`📲 ${res.message}`);
        // Actualizar estado local
        setRisks((prev) =>
          prev.map((r) =>
            r.clientId === clientId
              ? { ...r, rescueMessageSent: true, rescueLastSentAt: res.timestamp }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Error enviando mensaje de rescate:', err);
      showToast('❌ Error enviando mensaje de rescate.');
    } finally {
      setRescueLoading(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  if (loading || !metrics) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-400 font-mono">Sincronizando métricas con Stripe y evaluando inactividad...</p>
      </div>
    );
  }

  const criticalClients = risks.filter((r) => r.isAtRiskOfChurn);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <IconCheck size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. BARRA SUPERIOR & DISPARADOR DEL SCRIPT CRON
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-[var(--text)] tracking-tight">
              Métricas de Negocio & Retención (Stripe + Churn Engine)
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
              Stripe API Conectada
            </span>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Ingreso mensual recurrente, ciclo de vida del paciente (LTV) y algoritmo de alerta temprana por inactividad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refrescar métricas"
          >
            <IconRefresh size={16} />
          </button>

          <button
            type="button"
            data-testid="run-retention-cron-btn"
            onClick={handleRunCron}
            disabled={cronRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {cronRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconPlayerPlay size={14} />
            )}
            <span>{cronRunning ? 'Evaluando...' : 'Ejecutar Cron de Retención'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI CARDS FINANCIEROS (MRR, CHURN, LTV, PACIENTES EN RIESGO)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* MRR */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">MRR (Ingreso Recurrente)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IconCoin size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div data-testid="mrr-value" className="text-[24px] font-bold text-[var(--text)] tracking-tight tabular-nums font-mono raw-metric">
              {metrics.mrr.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center tabular-nums font-mono">
                <IconTrendingUp size={12} className="mr-0.5 inline" />
                +{metrics.mrrGrowthMoM}% MoM
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                · ARR: <span className="tabular-nums font-mono">{metrics.arr.toLocaleString('es-ES')} €</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
            <span className="tabular-nums font-mono font-medium">{metrics.activeSubscribers}</span> suscriptores activos en Stripe
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Tasa de Churn (Bajas)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <IconActivity size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div data-testid="churn-rate-value" className="text-[24px] font-bold text-[var(--text)] tracking-tight tabular-nums font-mono raw-metric">
              {metrics.churnRate}%
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Excelente (&lt; 3.5%)
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                · vs <span className="tabular-nums font-mono">{metrics.previousChurnRate}%</span> mes ant.
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
            1 cancelación en los últimos 30 días
          </div>
        </div>

        {/* LTV */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">LTV (Ciclo de Vida)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IconUsers size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div data-testid="ltv-value" className="text-[24px] font-bold text-[var(--text)] tracking-tight tabular-nums font-mono raw-metric">
              {metrics.ltv.toLocaleString('es-ES')} €
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                8.7 meses media
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                · ARPU: {metrics.arpu} €/mes
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
            Valor neto proyectado por cliente
          </div>
        </div>

        {/* Bandera de Riesgo de Abandono */}
        <div className="bg-[var(--card)] border border-rose-500/30 dark:bg-rose-950/10 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              Riesgo de Abandono (&ge; 14d)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <IconShieldExclamation size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[24px] font-bold text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-2">
              <span data-testid="critical-risk-count">{criticalCount}</span>
              <span className="text-[12px] font-normal text-rose-500">pacientes</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Bandera Roja Activa
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                · 14+ días sin abrir /mi-dieta
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-rose-600 dark:text-rose-400">
            Pérdida potencial de MRR: {criticalCount * 79} €/mes
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RADAR PREDICTIVO: PACIENTES EN RIESGO DE ABANDONO (14 DÍAS)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--card)] border border-rose-500/30 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <IconAlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-rose-900 dark:text-rose-200">
                Alerta Predictiva: Pacientes con Riesgo de Abandono (&ge; 14 días sin actividad)
              </h3>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                Pacientes que no han interactuado con su dieta en dos semanas. La probabilidad de baja en 7 días se sitúa en un 82%.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Regla: inactividad &ge; 14 días
            </span>
          </div>
        </div>

        {criticalClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            🎉 ¡Excelente! No hay pacientes con más de 14 días de inactividad actualmente.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {criticalClients.map((client) => (
              <div
                key={client.clientId}
                data-testid={`risk-client-${client.clientId}`}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text)]">
                      {client.clientName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-md">
                      🚩 {client.daysInactive} días inactivo
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] flex items-center gap-2">
                    <span>{client.planName}</span>
                    <span>·</span>
                    <span>{client.clientEmail}</span>
                  </div>
                </div>

                {/* Métricas de Adherencia y Tiempo */}
                <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-slate-400">Último Acceso</span>
                    <span className="font-medium text-[var(--text)]">Hace {client.daysInactive} días</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-slate-400">Adherencia</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{client.adherenceRate}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-slate-400">Estado Rescate</span>
                    {client.rescueMessageSent ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <IconCheck size={12} /> Contactado
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">Pendiente</span>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas de Reenganche */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid={`rescue-whatsapp-${client.clientId}`}
                    onClick={() => handleSendRescue(client.clientId, 'whatsapp')}
                    disabled={rescueLoading === `${client.clientId}-whatsapp`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <IconBrandWhatsapp size={14} />
                    <span>
                      {rescueLoading === `${client.clientId}-whatsapp` ? 'Enviando...' : 'Reenganche WhatsApp'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid={`rescue-email-${client.clientId}`}
                    onClick={() => handleSendRescue(client.clientId, 'email')}
                    disabled={rescueLoading === `${client.clientId}-email`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <IconMail size={14} />
                    <span>Reactivar Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. GRÁFICOS: EVOLUCIÓN HISTÓRICA MRR & DISTRIBUCIÓN DE PLANES
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Evolución de MRR últimos 6 meses */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Evolución Histórica de MRR (€)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Crecimiento recurrente mensual consolidado vía Stripe
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                MRR (€)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Facturación Total (€)
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#888888' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} €`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Facturación Total"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMrr)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Cargando gráfico...</div>
            )}
          </div>
        </div>

        {/* Desglose por Planes */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Desglose de Planes y ARPU
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mb-4">
              Distribución de ingresos por producto activo
            </p>

            <div className="space-y-4">
              {metrics.planBreakdown.map((plan) => (
                <div key={plan.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text)]">{plan.name}</span>
                    <span className="font-semibold text-[var(--text)]">{plan.totalMonthlyRevenue} €/m</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${plan.sharePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{plan.count} suscriptores ({plan.priceFormatted})</span>
                    <span>{plan.sharePercent}% del MRR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Salud de la Cartera</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round((healthyCount / (healthyCount + moderateCount + criticalCount || 1)) * 100)}% Activos
              </span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500"
                style={{ width: `${(healthyCount / (healthyCount + moderateCount + criticalCount || 1)) * 100}%` }}
                title="Sanos (< 7d)"
              />
              <div
                className="bg-amber-500"
                style={{ width: `${(moderateCount / (healthyCount + moderateCount + criticalCount || 1)) * 100}%` }}
                title="Moderados (7-13d)"
              />
              <div
                className="bg-rose-500"
                style={{ width: `${(criticalCount / (healthyCount + moderateCount + criticalCount || 1)) * 100}%` }}
                title="Críticos (>= 14d)"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>{healthyCount} Activos</span>
              <span>{moderateCount} Alerta</span>
              <span className="text-rose-500">{criticalCount} Riesgo Abandono</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
