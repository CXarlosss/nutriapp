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
} from '@tabler/icons-react';
import { Card, MetricCard, Badge, Button, Input } from '@/components/ui/nutri-ui';
import { createCheckoutSessionAction } from '@/app/actions/stripeCheckout';

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
  { id: 'c1', name: 'Marta Morales Sánchez', plan: 'Plan Definición 8S', status: 'Activo', nextAppointment: '20 oct, 09:00', hasDiet: true },
  { id: 'c2', name: 'Carlos Gómez Pardo', plan: 'Recomposición', status: 'Activo', nextAppointment: '13 oct, 11:30', hasDiet: true },
  { id: 'c3', name: 'Lucía Fernández Díaz', plan: 'Pérdida de Grasa', status: 'Activo', nextAppointment: '13 oct, 16:00', hasDiet: true },
  { id: 'c4', name: 'Javier Navarro Soler', plan: 'Salud Intestinal', status: 'Pendiente', nextAppointment: '13 oct, 18:15', hasDiet: false },
  { id: 'c5', name: 'Elena Ramos Vidal', plan: 'Rendimiento Running', status: 'Activo', nextAppointment: '22 oct, 10:00', hasDiet: true },
  { id: 'c6', name: 'David Torres Marín', plan: 'Recomposición', status: 'Activo', nextAppointment: '24 oct, 17:00', hasDiet: true },
  { id: 'c7', name: 'Patricia Ortiz Cano', plan: 'Plan Definición 8S', status: 'Activo', nextAppointment: '27 oct, 09:30', hasDiet: true },
  { id: 'c8', name: 'Andrés Gil Velasco', plan: 'Pérdida de Grasa', status: 'Inactivo', nextAppointment: 'Sin agendar', hasDiet: false },
  { id: 'c9', name: 'Sofía Romero Cruz', plan: 'Vegetariana Flexible', status: 'Activo', nextAppointment: '28 oct, 12:00', hasDiet: true },
  { id: 'c10', name: 'Marcos Alonso Castro', plan: 'Recomposición', status: 'Pendiente', nextAppointment: 'Sin agendar', hasDiet: false },
  { id: 'c11', name: 'Clara Domínguez Vega', plan: 'Pérdida de Grasa', status: 'Activo', nextAppointment: '30 oct, 11:00', hasDiet: true },
  { id: 'c12', name: 'Raúl Medina Peñalver', plan: 'Salud Intestinal', status: 'Activo', nextAppointment: '02 nov, 16:30', hasDiet: true },
];

export function DashboardView() {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [freshnessMinutes, setFreshnessMinutes] = useState(2);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (client: ClientRow) => {
    setCheckoutLoading(client.id);
    try {
      const res = await createCheckoutSessionAction({
        clientId: client.id,
        priceId: 'price_plan_mensual_79eur',
        clientEmail: `${client.id}@paciente.nutriapp.es`,
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Error iniciando checkout:', err);
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
    let list = ALL_CLIENTS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.plan.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'es');
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [search, sortAsc]);

  const totalClientsCount = 38; // Conteo global representativo
  const totalPages = Math.ceil(filteredClients.length / pageSize);
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
          2. FILA DE TRES MÉTRICAS (Grid de 3 columnas iguales, gap 12px)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
        <MetricCard label="Citas hoy" value={INITIAL_APPOINTMENTS.length} />
        <MetricCard label="Clientes activos" value={totalClientsCount} />
        <MetricCard
          label="Revisiones pendientes"
          value={INITIAL_REVIEWS.length}
          isWarning={true}
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

          {INITIAL_APPOINTMENTS.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <IconCalendarOff size={24} className="text-[var(--text-muted)] mb-2" stroke={1.5} />
              <div className="text-[14px] font-[500] text-[var(--text)]">Hoy no tienes citas</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1">
                Disfruta del día o revisa la agenda de la semana.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {INITIAL_APPOINTMENTS.map((appt) => {
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

          {INITIAL_REVIEWS.length === 0 ? (
            <div className="py-6 text-[13px] text-[var(--text-secondary)]">
              Todo al día
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {INITIAL_REVIEWS.map((rev) => (
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
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:text-[var(--brand-solid)] hover:underline"
                        >
                          {client.name}
                        </Link>
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
                              onClick={() => handleCheckout(client)}
                              disabled={checkoutLoading === client.id}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Iniciar sesión de cobro con Stripe"
                            >
                              <IconCreditCard size={11} />
                              <span>{checkoutLoading === client.id ? '...' : 'Cobrar'}</span>
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
            Mostrando 1-{Math.min(filteredClients.length, pageSize)} de {totalClientsCount}
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
    </div>
  );
}
