'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  IconRefresh,
  IconBell,
  IconCalendarOff,
  IconArrowsSort,
  IconFileDownload,
  IconSearch,
  IconCreditCard,
  IconSend,
  IconCopy,
  IconCheck,
  IconMail,
  IconX,
  IconStethoscope,
  IconChartLine,
} from '@tabler/icons-react';
import { Card, MetricCard, Badge, Button, Input } from '@/components/ui/nutri-ui';
import { requestPaymentForClientAction } from '@/app/actions/billingOutboxActions';
import { RetentionBusinessDashboard } from './RetentionBusinessDashboard';
import { useModeStore } from '@/lib/stores/useModeStore';

interface AppointmentItem {
  id: string;
  clientId: string;
  time: string;
  clientName: string;
  type: 'Completada' | 'Online' | 'Presencial';
}

interface ReviewPendingItem {
  clientId: string;
  clientName: string;
  daysPassed: number;
}

interface ClientRow {
  id: string;
  name: string;
  plan: string;
  status: 'Activo' | 'Pendiente' | 'Inactivo';
  nextAppointment: string;
  hasDiet: boolean;
  daysInactive?: number;
}

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  { id: '1', clientId: 'c1', time: '09:00', clientName: 'Marta Morales Sánchez', type: 'Completada' },
  { id: '2', clientId: 'c2', time: '11:30', clientName: 'Carlos Gómez Pardo', type: 'Online' },
  { id: '3', clientId: 'c3', time: '16:00', clientName: 'Lucía Fernández Díaz', type: 'Presencial' },
  { id: '4', clientId: 'c4', time: '18:15', clientName: 'Javier Navarro Soler', type: 'Online' },
];

const INITIAL_REVIEWS: ReviewPendingItem[] = [
  { clientId: 'c2', clientName: 'Carlos Gómez Pardo', daysPassed: 17 },
  { clientId: 'c5', clientName: 'Elena Ramos Vidal', daysPassed: 16 },
  { clientId: 'c6', clientName: 'David Torres Marín', daysPassed: 15 },
];

const ALL_CLIENTS: ClientRow[] = [
  { id: 'c1', name: 'Marta Morales Sánchez', plan: 'Plan Definición 8S', status: 'Activo', nextAppointment: '20 oct, 09:00', hasDiet: true, daysInactive: 1 },
  { id: 'c2', name: 'Carlos Gómez Pardo', plan: 'Recomposición', status: 'Activo', nextAppointment: '13 oct, 11:30', hasDiet: true, daysInactive: 17 },
  { id: 'c3', name: 'Lucía Fernández Díaz', plan: 'Pérdida de Grasa', status: 'Activo', nextAppointment: '13 oct, 16:00', hasDiet: true, daysInactive: 2 },
  { id: 'c4', name: 'Javier Navarro Soler', plan: 'Salud Intestinal', status: 'Pendiente', nextAppointment: '13 oct, 18:15', hasDiet: false, daysInactive: 9 },
  { id: 'c5', name: 'Elena Ramos Vidal', plan: 'Rendimiento Running', status: 'Activo', nextAppointment: '22 oct, 10:00', hasDiet: true, daysInactive: 16 },
  { id: 'c6', name: 'David Torres Marín', plan: 'Recomposición', status: 'Activo', nextAppointment: '24 oct, 17:00', hasDiet: true, daysInactive: 15 },
  { id: 'c7', name: 'Patricia Ortiz Cano', plan: 'Plan Definición 8S', status: 'Activo', nextAppointment: '27 oct, 09:30', hasDiet: true, daysInactive: 3 },
  { id: 'c8', name: 'Andrés Gil Velasco', plan: 'Pérdida de Grasa', status: 'Inactivo', nextAppointment: 'Sin agendar', hasDiet: false, daysInactive: 35 },
  { id: 'c9', name: 'Sofía Romero Cruz', plan: 'Vegetariana Flexible', status: 'Activo', nextAppointment: '28 oct, 12:00', hasDiet: true, daysInactive: 4 },
  { id: 'c10', name: 'Marcos Alonso Castro', plan: 'Recomposición', status: 'Pendiente', nextAppointment: 'Sin agendar', hasDiet: false, daysInactive: 20 },
  { id: 'c11', name: 'Clara Domínguez Vega', plan: 'Pérdida de Grasa', status: 'Activo', nextAppointment: '30 oct, 11:00', hasDiet: true, daysInactive: 5 },
  { id: 'c12', name: 'Raúl Medina Peñalver', plan: 'Salud Intestinal', status: 'Activo', nextAppointment: '02 nov, 16:30', hasDiet: true, daysInactive: 6 },
];

export function DashboardView() {
  const { mode, realClients } = useModeStore();
  const [activeTab, setActiveTab] = useState<'clinical' | 'analytics'>('clinical');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [freshnessMinutes, setFreshnessMinutes] = useState(2);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outboxModal, setOutboxModal] = useState<{
    isOpen: boolean;
    clientName: string;
    checkoutUrl: string;
    eventId: string;
  } | null>(null);

  const activeClientsData: ClientRow[] = useMemo(() => {
    if (mode === 'demo') return ALL_CLIENTS;
    return realClients.map((c) => ({
      id: c.id,
      name: c.name,
      plan: c.plan,
      status: (c.status === 'Activo' ? 'Activo' : c.status === 'Inactivo' ? 'Inactivo' : 'Pendiente') as 'Activo' | 'Pendiente' | 'Inactivo',
      nextAppointment: c.nextAppointment,
      hasDiet: c.hasDiet,
      daysInactive: 0,
    }));
  }, [mode, realClients]);

  const activeAppointments = mode === 'demo' ? INITIAL_APPOINTMENTS : [];
  const activeReviews = mode === 'demo' ? INITIAL_REVIEWS : [];
  const activeClientsCount = mode === 'demo' ? 38 : realClients.filter((c) => c.status === 'Activo').length;

  const handleRequestPayment = async (client: ClientRow) => {
    setCheckoutLoading(client.id);
    try {
      const res = await requestPaymentForClientAction({
        clientId: client.id,
        clientName: client.name,
        clientEmail: `${client.id}@paciente.nutriapp.es`,
        priceId: 'price_plan_mensual_79eur',
      });
      if (res.success && res.checkoutUrl) {
        setOutboxModal({
          isOpen: true,
          clientName: client.name,
          checkoutUrl: res.checkoutUrl,
          eventId: res.eventId || 'evt_outbox',
        });
      }
    } catch (err) {
      console.error('Error solicitando pago:', err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Saludo dinámico y fecha calculados en useEffect para hidratación limpia
  const [greeting, setGreeting] = useState('Buenos días, Laura');
  const [formattedDate, setFormattedDate] = useState('martes, 13 de octubre');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 13) setGreeting('Buenos días, Laura');
    else if (hour < 20) setGreeting('Buenas tardes, Laura');
    else setGreeting('Buenas noches, Laura');

    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const parts = formatter.format(new Date());
    setFormattedDate(parts.charAt(0).toLowerCase() + parts.slice(1));
  }, []);

  // Filtrado y ordenación de clientes
  const filteredClients = useMemo(() => {
    let list = activeClientsData.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.plan.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'es');
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [activeClientsData, search, sortAsc]);

  const totalPages = Math.ceil(Math.max(1, filteredClients.length) / pageSize);
  const pagedClients = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  const handleRefresh = () => {
    setFreshnessMinutes(0);
  };

  return (
    <div className="space-y-[16px] animate-fadeIn">
      {/* ─────────────────────────────────────────────────────────────
          1. CABECERA
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-[18px] font-[500] text-[var(--text)] tracking-tight leading-tight">
            {greeting}
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] font-[400] mt-0.5 capitalize">
            {formattedDate}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 h-[32px] px-2 rounded-[8px] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer select-none"
            title="Revalidar datos"
          >
            <IconRefresh size={14} stroke={1.5} className="shrink-0" />
            <span>Datos de hace {freshnessMinutes} min</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SELECTOR DE PESTAÑAS: GESTIÓN CLÍNICA vs ANALÍTICA DE NEGOCIO
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 pt-1">
        <button
          type="button"
          data-testid="tab-clinical"
          onClick={() => setActiveTab('clinical')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'clinical'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)]'
          }`}
        >
          <IconStethoscope size={15} />
          <span>Gestión Clínica & Agenda</span>
        </button>

        <button
          type="button"
          data-testid="tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)]'
          }`}
        >
          <IconChartLine size={15} />
          <span>Analítica de Negocio & Retención (Stripe)</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
            3 en Riesgo
          </span>
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <RetentionBusinessDashboard />
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              2. FILA DE TRES MÉTRICAS (Grid de 3 columnas iguales, gap 12px)
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
            <MetricCard label="Citas hoy" value={activeAppointments.length} />
            <MetricCard label="Clientes activos" value={activeClientsCount} />
            <MetricCard
              label="Revisiones pendientes"
              value={activeReviews.length}
              isWarning={activeReviews.length > 0}
            />
          </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FILA DE DOS TARJETAS (Grid 1.3fr / 1fr con gap 12px)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-[12px]">
        {/* Citas de hoy (izquierda) */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-1">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Citas de hoy</h2>
            <Link
              href="/appointments"
              className="text-[12px] text-[var(--brand-solid)] hover:underline font-[400]"
            >
              Ver agenda
            </Link>
          </div>

          {activeAppointments.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <IconCalendarOff size={24} className="text-[var(--text-muted)] mb-2" stroke={1.5} />
              <div className="text-[14px] font-[500] text-[var(--text)]">Hoy no tienes citas</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">
                Disfruta del día o revisa la agenda de la semana.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activeAppointments.map((appt) => {
                let badgeVariant: 'success' | 'info' | 'neutral' = 'neutral';
                if (appt.type === 'Completada') badgeVariant = 'success';
                if (appt.type === 'Online') badgeVariant = 'info';

                return (
                  <Link
                    key={appt.id}
                    href={`/clients/${appt.clientId}`}
                    className="py-[8px] flex items-center gap-3 hover:bg-[var(--card-subtle)] px-2 -mx-2 rounded-[8px] transition-colors group cursor-pointer"
                  >
                    <span className="w-[48px] shrink-0 text-[13px] text-[var(--text-secondary)] font-[400]">
                      {appt.time}
                    </span>
                    <span className="flex-1 text-[13px] text-[var(--text)] font-[400] group-hover:text-[var(--brand-solid)] truncate">
                      {appt.clientName}
                    </span>
                    <Badge variant={badgeVariant}>{appt.type}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Toca revisión (derecha) */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-1.5 pb-2 mb-1">
            <IconBell size={15} className="text-[var(--warning-text)] shrink-0" stroke={1.5} />
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Toca revisión</h2>
          </div>

          {activeReviews.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <IconCheck size={24} className="text-emerald-500 mb-2" stroke={1.5} />
              <div className="text-[14px] font-[500] text-[var(--text)]">Todo al día</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">
                No hay pacientes con revisiones pendientes.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activeReviews.map((rev) => (
                <Link
                  key={rev.clientId}
                  href={`/clients/${rev.clientId}`}
                  className="py-[8px] flex items-center justify-between gap-3 hover:bg-[var(--card-subtle)] px-2 -mx-2 rounded-[8px] transition-colors group cursor-pointer"
                >
                  <span className="text-[13px] text-[var(--text)] font-[400] group-hover:text-[var(--brand-solid)] truncate">
                    {rev.clientName}
                  </span>
                  <span className="text-[12px] font-[500] text-[var(--warning-text)] shrink-0">
                    {rev.daysPassed} días
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TARJETA CLIENTES ACTIVOS (Ancho completo, tabla integrada)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] overflow-hidden">
        {/* Barra superior */}
        <div className="p-[10px_12px] border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-[14px] font-[500] text-[var(--text)]">Clientes activos</h2>
          <div className="w-full sm:w-[200px]">
            <Input
              icon={<IconSearch size={14} stroke={1.5} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar cliente"
            />
          </div>
        </div>

        {/* Tabla con table-layout: fixed (26% / 20% / 18% / 20% / 16%) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[640px]">
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--card-subtle)] border-b border-[var(--border)] text-[12px] text-[var(--text-secondary)] font-[400]">
                <th className="p-[8px_12px]">
                  <button
                    type="button"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="inline-flex items-center gap-1 font-[400] hover:text-[var(--text)] cursor-pointer select-none"
                  >
                    <span>Cliente</span>
                    <IconArrowsSort size={13} stroke={1.5} />
                  </button>
                </th>
                <th className="p-[8px_12px]">Plan</th>
                <th className="p-[8px_12px]">Estado</th>
                <th className="p-[8px_12px]">Próxima cita</th>
                <th className="p-[8px_12px] text-right">Dieta</th>
              </tr>
            </thead>
            <tbody>
              {pagedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[13px] text-[var(--text-muted)]">
                    No se han encontrado clientes con ese criterio.
                  </td>
                </tr>
              ) : (
                pagedClients.map((client) => {
                  let statusVariant: 'success' | 'warning' | 'neutral' = 'neutral';
                  if (client.status === 'Activo') statusVariant = 'success';
                  if (client.status === 'Pendiente') statusVariant = 'warning';

                  const isUnscheduled = client.nextAppointment === 'Sin agendar';

                  return (
                    <tr
                      key={client.id}
                      className="text-[13px] border-t border-[var(--border)] hover:bg-[var(--card-subtle)] transition-colors"
                    >
                      <td className="p-[8px_12px] text-[var(--text)] font-[400] truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:text-[var(--brand-solid)] hover:underline"
                          >
                            {client.name}
                          </Link>
                          {client.daysInactive && client.daysInactive >= 14 && (
                            <span
                              className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded shrink-0 inline-flex items-center gap-0.5"
                              title="Bandera roja: Lleva más de 14 días sin abrir /mi-dieta"
                            >
                              🚩 Inactivo {client.daysInactive}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-[8px_12px] text-[var(--text-secondary)] truncate">
                        {client.plan}
                      </td>
                      <td className="p-[8px_12px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={statusVariant}>{client.status}</Badge>
                          {client.status !== 'Activo' && (
                            <button
                              type="button"
                              onClick={() => handleRequestPayment(client)}
                              disabled={checkoutLoading === client.id}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Generar enlace de pago seguro y registrar en Outbox para n8n"
                            >
                              <IconSend size={11} />
                              <span>{checkoutLoading === client.id ? 'Generando...' : 'Solicitar Pago'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td
                        className={`p-[8px_12px] truncate ${
                          isUnscheduled ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'
                        }`}
                      >
                        {client.nextAppointment}
                      </td>
                      <td className="p-[8px_12px] text-right">
                        {client.hasDiet ? (
                          <button
                            type="button"
                            className="p-1 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--brand-solid)] hover:bg-[var(--card-subtle)] transition-colors inline-flex items-center justify-center cursor-pointer"
                            aria-label="Descargar PDF"
                            title="Descargar PDF"
                          >
                            <IconFileDownload size={16} stroke={1.5} />
                          </button>
                        ) : (
                          <span className="text-[12px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación inferior */}
        <div className="p-[8px_12px] border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
          <div>
            Mostrando {filteredClients.length === 0 ? 0 : 1}-{Math.min(filteredClients.length, pageSize)} de {activeClientsCount}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className="h-[28px] px-2.5 text-[12px]"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              className="h-[28px] px-2.5 text-[12px]"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Modal Informativo del Patrón Outbox & Copia de Enlace Seguro */}
      {outboxModal && outboxModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <IconMail size={16} />
                </div>
                <span className="font-semibold text-sm">Pago Solicitado con Éxito</span>
              </div>
              <button
                type="button"
                onClick={() => setOutboxModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Se ha generado la sesión en <strong>Stripe Checkout</strong> para <strong className="text-slate-800">{outboxModal.clientName}</strong>.
              </p>
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patrón Outbox:</span>
                  <span className="font-semibold text-emerald-700">Persistido en PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Evento:</span>
                  <span>billing.payment_requested</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Orquestador:</span>
                  <span>n8n Webhook Trigger</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Enlace seguro para el paciente
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={outboxModal.checkoutUrl}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 text-slate-700 truncate select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(outboxModal.checkoutUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-medium inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <IconCheck size={14} className="text-emerald-400" /> : <IconCopy size={14} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                className="text-xs h-8"
                onClick={() => setOutboxModal(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
