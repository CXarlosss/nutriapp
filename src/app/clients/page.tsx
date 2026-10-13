'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconDots,
  IconFileDownload,
  IconX,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Input } from '@/components/ui/nutri-ui';

interface ClientItem {
  id: string;
  name: string;
  plan: string;
  status: 'Activo' | 'Pendiente de revisión' | 'Inactivo';
  lastAppointment: string;
  nextAppointment: string;
  hasDiet: boolean;
}

const CLIENTS_DATA: ClientItem[] = [
  { id: 'c1', name: 'Marta Morales Sánchez', plan: 'Plan Definición 8S', status: 'Activo', lastAppointment: '06 oct, 09:00', nextAppointment: '20 oct, 09:00', hasDiet: true },
  { id: 'c2', name: 'Carlos Gómez Pardo', plan: 'Recomposición', status: 'Activo', lastAppointment: '29 sep, 11:30', nextAppointment: '13 oct, 11:30', hasDiet: true },
  { id: 'c3', name: 'Lucía Fernández Díaz', plan: 'Pérdida de Grasa', status: 'Activo', lastAppointment: '15 sep, 16:00', nextAppointment: '13 oct, 16:00', hasDiet: true },
  { id: 'c4', name: 'Javier Navarro Soler', plan: 'Salud Intestinal', status: 'Pendiente de revisión', lastAppointment: 'Sin citas', nextAppointment: '13 oct, 18:15', hasDiet: false },
  { id: 'c5', name: 'Elena Ramos Vidal', plan: 'Rendimiento Running', status: 'Activo', lastAppointment: '01 oct, 10:00', nextAppointment: '22 oct, 10:00', hasDiet: true },
  { id: 'c6', name: 'David Torres Marín', plan: 'Recomposición', status: 'Activo', lastAppointment: '24 sep, 17:00', nextAppointment: '24 oct, 17:00', hasDiet: true },
  { id: 'c7', name: 'Patricia Ortiz Cano', plan: 'Plan Definición 8S', status: 'Activo', lastAppointment: '10 oct, 09:30', nextAppointment: '27 oct, 09:30', hasDiet: true },
  { id: 'c8', name: 'Andrés Gil Velasco', plan: 'Pérdida de Grasa', status: 'Inactivo', lastAppointment: '12 ago, 12:00', nextAppointment: 'Sin agendar', hasDiet: false },
];

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [planFilter, setPlanFilter] = useState('Todos');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredClients = useMemo(() => {
    return CLIENTS_DATA.filter((client) => {
      const matchSearch = client.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || client.status === statusFilter;
      const matchPlan = planFilter === 'Todos' || client.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    }).sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'es');
      return sortAsc ? cmp : -cmp;
    });
  }, [search, statusFilter, planFilter, sortAsc]);

  const hasActiveFilters = search !== '' || statusFilter !== 'Todos' || planFilter !== 'Todos';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('Todos');
    setPlanFilter('Todos');
  };

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Cabecera de la vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
            Clientes
          </h1>
          <Button variant="primary">
            <IconPlus size={16} stroke={1.5} />
            <span>Nuevo cliente</span>
          </Button>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-[8px]">
          <div className="w-full sm:w-[240px]">
            <Input
              icon={<IconSearch size={14} stroke={1.5} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[36px] px-3 rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[14px] text-[var(--text)] font-[400] cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Pendiente de revisión">Pendiente de revisión</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-[36px] px-3 rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[14px] text-[var(--text)] font-[400] cursor-pointer"
          >
            <option value="Todos">Todos los planes</option>
            <option value="Plan Definición 8S">Plan Definición 8S</option>
            <option value="Recomposición">Recomposición</option>
            <option value="Pérdida de Grasa">Pérdida de Grasa</option>
            <option value="Salud Intestinal">Salud Intestinal</option>
            <option value="Rendimiento Running">Rendimiento Running</option>
          </select>
        </div>

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilter !== 'Todos' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-bg)] text-[12px] font-[500] text-[var(--brand-text)]">
                <span>Estado: {statusFilter}</span>
                <button type="button" onClick={() => setStatusFilter('Todos')}>
                  <IconX size={12} />
                </button>
              </span>
            )}
            {planFilter !== 'Todos' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-bg)] text-[12px] font-[500] text-[var(--brand-text)]">
                <span>Plan: {planFilter}</span>
                <button type="button" onClick={() => setPlanFilter('Todos')}>
                  <IconX size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:underline ml-1 cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Tabla completa de clientes */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr className="bg-[var(--card-subtle)] border-b border-[var(--border)] text-[12px] text-[var(--text-secondary)] font-[400]">
                  <th className="p-[8px_12px]">
                    <button
                      type="button"
                      onClick={() => setSortAsc(!sortAsc)}
                      className="inline-flex items-center gap-1 font-[400] hover:text-[var(--text)] cursor-pointer"
                    >
                      <span>Cliente</span>
                      <IconArrowsSort size={13} stroke={1.5} />
                    </button>
                  </th>
                  <th className="p-[8px_12px]">Plan</th>
                  <th className="p-[8px_12px]">Estado</th>
                  <th className="p-[8px_12px]">Última cita</th>
                  <th className="p-[8px_12px]">Próxima cita</th>
                  <th className="p-[8px_12px]">Dieta</th>
                  <th className="p-[8px_12px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  let statusVariant: 'success' | 'warning' | 'neutral' = 'neutral';
                  if (client.status === 'Activo') statusVariant = 'success';
                  if (client.status === 'Pendiente de revisión') statusVariant = 'warning';

                  return (
                    <tr
                      key={client.id}
                      className="text-[13px] border-t border-[var(--border)] hover:bg-[var(--card-subtle)] transition-colors"
                    >
                      <td className="p-[8px_12px] text-[var(--text)] font-[400]">
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:text-[var(--brand-solid)] hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="p-[8px_12px] text-[var(--text-secondary)]">{client.plan}</td>
                      <td className="p-[8px_12px]">
                        <Badge variant={statusVariant}>{client.status}</Badge>
                      </td>
                      <td className="p-[8px_12px] text-[var(--text-muted)]">{client.lastAppointment}</td>
                      <td className="p-[8px_12px] text-[var(--text)]">{client.nextAppointment}</td>
                      <td className="p-[8px_12px]">
                        {client.hasDiet ? (
                          <button
                            type="button"
                            className="p-1 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--brand-solid)] hover:bg-[var(--card-subtle)]"
                            aria-label="Descargar PDF"
                          >
                            <IconFileDownload size={16} stroke={1.5} />
                          </button>
                        ) : (
                          <span className="text-[12px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="p-[8px_12px] text-right">
                        <button
                          type="button"
                          className="p-1 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)]"
                          aria-label="Acciones de cliente"
                        >
                          <IconDots size={16} stroke={1.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
