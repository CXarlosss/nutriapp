'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import {
  IconFileDownload,
  IconEdit,
  IconCalendarEvent,
  IconClock,
  IconArrowLeft,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Avatar } from '@/components/ui/nutri-ui';

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[var(--text-secondary)]">Cargando ficha...</div>}>
      <ClientDetailContent />
    </Suspense>
  );
}

function ClientDetailContent() {
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Dietas' | 'Citas' | 'Notas' | 'Pagos'>('Resumen');

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Volver */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          <span>Volver a clientes</span>
        </Link>

        {/* ─────────────────────────────────────────────────────────────
            CABECERA EN TARJETA
            ───────────────────────────────────────────────────────────── */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials="CM" size={56} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[18px] font-[500] text-[var(--text)]">
                  Carlos Gómez Pardo
                </h1>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] font-[400] flex flex-wrap gap-x-3 gap-y-1">
                <span>carlos.paciente@example.com</span>
                <span>•</span>
                <span>+34 600 11 22 33</span>
                <span>•</span>
                <span>Plan Recomposición</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/appointments">
              <Button variant="secondary">Agendar cita</Button>
            </Link>
            <Link href="/dietas/creador">
              <Button variant="primary">Asignar dieta</Button>
            </Link>
          </div>
        </Card>

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑAS (Subrayado 2px en verde sobre la activa)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[var(--border)] gap-6">
          {(['Resumen', 'Dietas', 'Citas', 'Notas', 'Pagos'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-[14px] font-[500] transition-colors relative cursor-pointer ${
                  isActive ? 'text-[var(--brand-solid)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-solid)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CONTENIDO DE LA PESTAÑA SELECCIONADA
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Resumen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            {/* Izquierda: Datos personales */}
            <Card className="space-y-3">
              <h2 className="text-[14px] font-[500] text-[var(--text)] mb-2">Datos personales</h2>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-[12px] text-[var(--text-secondary)] block">Edad</span>
                  <span className="font-[400] text-[var(--text)]">34 años</span>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--text-secondary)] block">Altura</span>
                  <span className="font-[400] text-[var(--text)]">178 cm</span>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--text-secondary)] block">Peso actual</span>
                  <span className="font-[400] text-[var(--text)]">76.4 kg</span>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--text-secondary)] block">Objetivo</span>
                  <span className="font-[400] text-[var(--text)]">Recomposición corporal</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-[12px] text-[var(--text-secondary)] block mb-1.5">Alergias e intolerancias</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="danger">Gluten</Badge>
                  <Badge variant="danger">Lactosa</Badge>
                </div>
              </div>
            </Card>

            {/* Derecha: Suscripción con barra de progreso */}
            <Card className="space-y-4">
              <h2 className="text-[14px] font-[500] text-[var(--text)]">Suscripción activa</h2>

              <div>
                <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)] mb-1.5">
                  <span>Días consumidos</span>
                  <span className="font-[500] text-[var(--text)]">Día 9 de 15</span>
                </div>
                {/* Barra de progreso de 6px */}
                <div className="w-full h-[6px] rounded-full bg-[#F1EFE8] overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand-solid)] transition-all"
                    style={{ width: `${(9 / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Próxima revisión clínica</span>
                <span className="font-[500] text-[var(--warning-text)]">En 6 días (19 oct)</span>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Dietas' && (
          <Card noPadding className="overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {[
                { name: 'Dieta Recomposición V2', origin: 'Plantilla 2.200 kcal', range: '01 oct - 31 oct', status: 'Publicada' as const },
                { name: 'Ajuste Déficit Calórico', origin: 'Plantilla Personalizada', range: 'Borrador activo', status: 'Borrador' as const },
              ].map((d, i) => (
                <div key={i} className="p-[12px_16px] flex items-center justify-between gap-4 text-[13px]">
                  <div>
                    <div className="font-[500] text-[var(--text)]">{d.name}</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">{d.origin} • {d.range}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === 'Publicada' ? 'success' : 'warning'}>{d.status}</Badge>
                    <Link href="/dietas/creador">
                      <Button variant="ghost" className="h-[30px] px-2 text-[12px]">
                        <IconEdit size={14} />
                        <span>Editar</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" className="h-[30px] px-2 text-[12px]">
                      <IconFileDownload size={14} />
                      <span>Descargar PDF</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Citas' && (
          <Card className="space-y-4">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de citas</h2>
            {/* Línea temporal vertical con punto de 8px */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border)]">
              {[
                { date: '13 oct, 11:30', type: 'Online (Google Meet)', notes: 'Revisión quincenal de adherencia y macros.' },
                { date: '29 sep, 11:30', type: 'Presencial', notes: 'Medición de pliegues antropométricos.' },
                { date: '15 sep, 10:00', type: 'Presencial', notes: 'Entrevista inicial y establecimiento de objetivos.' },
              ].map((c, i) => (
                <div key={i} className="relative text-[13px]">
                  <span className="absolute -left-[20px] top-1.5 w-[8px] h-[8px] rounded-full bg-[var(--brand-solid)]" />
                  <div className="font-[500] text-[var(--text)]">{c.date}</div>
                  <div className="text-[12px] text-[var(--text-secondary)] mb-1">{c.type}</div>
                  <div className="text-[13px] text-[var(--text)] font-[400]">{c.notes}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Notas' && (
          <Card className="space-y-3">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Notas de consulta</h2>
            <p className="text-[13px] text-[var(--text)] font-[400] leading-relaxed">
              El paciente refiere muy buena digestión tras eliminar ultraprocesados. Reporta mayor energía en sus entrenamientos de fuerza. Seguir manteniendo el aporte hídrico de 2.5 litros diarios.
            </p>
          </Card>
        )}

        {activeTab === 'Pagos' && (
          <Card className="space-y-3">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de pagos</h2>
            <div className="text-[13px] text-[var(--text-secondary)]">
              Suscripción gestionada vía Stripe. Último cobro realizado el 01/10/2026.
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
