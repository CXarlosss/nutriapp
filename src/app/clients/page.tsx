'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconDots,
  IconFileDownload,
  IconEye,
  IconX,
  IconUserPlus,
  IconUsers,
  IconBrandWhatsapp,
  IconMail,
  IconCoins,
  IconCheck,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Input } from '@/components/ui/nutri-ui';
import { useModeStore, DEMO_CLIENTS, RealClient } from '@/lib/stores/useModeStore';
import { ManualPaymentModal } from '@/components/clients/ManualPaymentModal';
import { generateWhatsAppLink, generateMailtoLink, contactTemplates, getSmartClientContact } from '@/lib/utils/contactLinks';

export default function ClientsPage() {
  const { mode, realClients, addRealClient } = useModeStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [planFilter, setPlanFilter] = useState('Todos');
  const [sortAsc, setSortAsc] = useState(true);

  // Estado del modal para nuevo cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('Plan Nutricional Estándar');
  const [clientForPayment, setClientForPayment] = useState<RealClient | null>(null);
  const [paymentToast, setPaymentToast] = useState<string | null>(null);

  const activeClients = mode === 'demo' ? DEMO_CLIENTS : realClients;

  const filteredClients = useMemo(() => {
    return activeClients.filter((client) => {
      const matchSearch = client.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || client.status === statusFilter;
      const matchPlan = planFilter === 'Todos' || client.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    }).sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'es');
      return sortAsc ? cmp : -cmp;
    });
  }, [activeClients, search, statusFilter, planFilter, sortAsc]);

  const hasActiveFilters = search !== '' || statusFilter !== 'Todos' || planFilter !== 'Todos';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('Todos');
    setPlanFilter('Todos');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    addRealClient({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim(),
      plan: newClientPlan,
      status: 'Activo',
    });

    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setIsModalOpen(false);
  };

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Cabecera de la vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
              Clientes {mode === 'real' ? '(Mi Consulta)' : '(Modo Demo)'}
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              {mode === 'real'
                ? 'Expedientes clínicos y pacientes activos de tu consulta privada.'
                : 'Mostrando pacientes ficticios para demostración técnica y exploración.'}
            </p>
          </div>

          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
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
            <option value="Plan Nutricional Estándar">Plan Nutricional Estándar</option>
          </select>

          <Button variant="secondary" onClick={() => setSortAsc(!sortAsc)} title="Ordenar alfabéticamente">
            <IconArrowsSort size={16} stroke={1.5} />
            <span className="hidden sm:inline">{sortAsc ? 'A-Z' : 'Z-A'}</span>
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              <IconX size={16} stroke={1.5} />
              <span>Limpiar</span>
            </Button>
          )}
        </div>

        {/* Tabla de clientes o Empty State */}
        {mode === 'real' && activeClients.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--card)] rounded-xl border border-[var(--border)] animate-fadeIn">
            <div className="mx-auto w-12 h-12 rounded-full bg-[var(--card-subtle)] flex items-center justify-center text-[var(--text-secondary)] mb-3">
              <IconUsers size={24} />
            </div>
            <h3 className="text-base font-medium text-[var(--text)]">No tienes pacientes registrados todavía</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-5">
              Tu consulta real está completamente limpia. Pulsa en el botón para registrar a tu primer paciente.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <IconUserPlus size={16} stroke={1.5} />
              <span>Añadir mi primer paciente</span>
            </Button>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-[12px] overflow-hidden bg-[var(--card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text-secondary)] font-[500] text-[12px]">
                    <th className="p-[10px_16px]">Nombre</th>
                    <th className="p-[10px_12px]">Plan</th>
                    <th className="p-[10px_12px]">Estado</th>
                    <th className="p-[10px_12px]">Última cita</th>
                    <th className="p-[10px_12px]">Próxima cita</th>
                    <th className="p-[10px_12px]">Dieta</th>
                    <th className="p-[10px_12px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                        No se encontraron clientes con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      let statusVariant: 'success' | 'warning' | 'neutral' = 'neutral';
                      if (client.status === 'Activo') statusVariant = 'success';
                      if (client.status === 'Pendiente de revisión') statusVariant = 'warning';

                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-[var(--card-subtle)] transition-colors group cursor-pointer"
                        >
                          <td className="p-[8px_16px]">
                            <Link href={`/clients/${client.id}`} className="font-[500] text-[var(--text)] group-hover:text-[var(--brand-solid)]">
                              {client.name}
                            </Link>
                          </td>
                          <td className="p-[8px_12px] text-[var(--text-secondary)]">{client.plan}</td>
                          <td className="p-[8px_12px]">
                            <Badge variant={statusVariant}>{client.status}</Badge>
                          </td>
                          <td className="p-[8px_12px] text-[var(--text-muted)] tabular-nums font-mono text-[12px]">{client.lastAppointment}</td>
                          <td className="p-[8px_12px] text-[var(--text)] tabular-nums font-mono text-[12px] font-medium">{client.nextAppointment}</td>
                          <td className="p-[8px_12px]">
                            {client.hasDiet ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`/mi-dieta?clientName=${encodeURIComponent(client.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-[6px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex items-center"
                                  title={`Ver dieta enviada a ${client.name} (portal del paciente)`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconEye size={16} stroke={1.5} />
                                </a>
                                <a
                                  href={`/api/export-pdf?client=${encodeURIComponent(client.name)}&diet=${encodeURIComponent('Pauta ' + client.plan)}&autoprint=true`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--brand-solid)] hover:bg-[var(--card-subtle)] transition-colors inline-flex items-center"
                                  title={`Descargar PDF oficial de la dieta de ${client.name}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconFileDownload size={16} stroke={1.5} />
                                </a>
                              </div>
                            ) : (
                              <Link
                                href={`/dietas/creador?client=${client.id}`}
                                className="text-[11px] text-[var(--brand-solid)] hover:underline inline-flex items-center gap-0.5"
                                title="Crear pauta en Diet Builder"
                                onClick={(e) => e.stopPropagation()}
                              >
                                + Crear
                              </Link>
                            )}
                          </td>
                          <td className="p-[8px_12px] text-right">
                            {(() => {
                              const contact = getSmartClientContact(client);
                              return (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setClientForPayment(client);
                                    }}
                                    className="p-1.5 rounded-[6px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                    title={`Registrar cobro manual para ${client.name} (Bizum / Efectivo / Banco)`}
                                  >
                                    <IconCoins size={16} stroke={1.75} />
                                  </button>
                                  {client.phone && (
                                    <a
                                      href={generateWhatsAppLink(client.phone, contact.whatsapp)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-[6px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                      title={`${contact.tooltip} a ${client.name} (${client.phone})`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconBrandWhatsapp size={16} stroke={1.75} />
                                    </a>
                                  )}
                                  {client.email && (
                                    <a
                                      href={generateMailtoLink(client.email, contact.emailSubject, contact.emailBody)}
                                      className="p-1.5 rounded-[6px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                      title={`${contact.tooltip} a ${client.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconMail size={16} stroke={1.75} />
                                    </a>
                                  )}
                                  <Link
                                    href={`/clients/${client.id}`}
                                    className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors inline-flex"
                                    title={`Ver ficha médica de ${client.name}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconDots size={16} stroke={1.5} />
                                  </Link>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Crear Nuevo Cliente */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-[var(--text)]">Añadir Nuevo Paciente</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--card-subtle)]"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Nombre y Apellidos *</label>
                  <Input
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej. María López Sánchez"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Email del paciente</label>
                  <Input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="maria.lopez@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Teléfono</label>
                  <Input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1">Plan / Objetivo inicial</label>
                  <select
                    value={newClientPlan}
                    onChange={(e) => setNewClientPlan(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[14px] text-[var(--text)] font-[400] cursor-pointer"
                  >
                    <option value="Plan Nutricional Estándar">Plan Nutricional Estándar</option>
                    <option value="Plan Definición 8S">Plan Definición 8S</option>
                    <option value="Recomposición">Recomposición</option>
                    <option value="Pérdida de Grasa">Pérdida de Grasa</option>
                    <option value="Salud Intestinal">Salud Intestinal</option>
                    <option value="Rendimiento Running">Rendimiento Running</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit">
                    Guardar paciente
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Cobro Manual en Consulta (Bizum / Efectivo / Banco) */}
        {clientForPayment && (
          <ManualPaymentModal
            isOpen={!!clientForPayment}
            onClose={() => setClientForPayment(null)}
            client={clientForPayment}
            onSuccess={(msg) => {
              setPaymentToast(msg);
              setTimeout(() => setPaymentToast(null), 5000);
            }}
          />
        )}

        {/* Toast de Éxito de Cobro */}
        {paymentToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <IconCheck size={18} />
            </div>
            <div>
              <span className="font-semibold text-[13px] block">Cobro Registrado</span>
              <span className="text-[12px] text-emerald-200">{paymentToast}</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
