'use client';

import React, { useState } from 'react';
import {
  IconCalendar,
  IconCheck,
  IconX,
  IconClock,
  IconUser,
  IconVideo,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Input } from '@/components/ui/nutri-ui';

interface CalendarEvent {
  id: string;
  clientName: string;
  dayIndex: number; // 1 (Lunes) a 5 (Viernes)
  startHour: number; // Ej: 9, 11.5
  durationHours: number;
  type: 'online' | 'presencial' | 'completada' | 'google';
  notes?: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: '1', clientName: 'Marta Morales Sánchez', dayIndex: 1, startHour: 9, durationHours: 0.75, type: 'completada' },
  { id: '2', clientName: 'Carlos Gómez Pardo', dayIndex: 2, startHour: 11.5, durationHours: 0.75, type: 'online', notes: 'Revisión quincenal de adherencia' },
  { id: '3', clientName: 'Lucía Fernández Díaz', dayIndex: 2, startHour: 16, durationHours: 0.75, type: 'presencial' },
  { id: '4', clientName: 'Ocupado', dayIndex: 3, startHour: 10, durationHours: 1.5, type: 'google' },
  { id: '5', clientName: 'Javier Navarro Soler', dayIndex: 4, startHour: 18, durationHours: 0.75, type: 'online' },
  { id: '6', clientName: 'Elena Ramos Vidal', dayIndex: 5, startHour: 10, durationHours: 0.75, type: 'presencial' },
];

const DAYS_HEADER = [
  { index: 1, name: 'Lunes', date: '12 oct' },
  { index: 2, name: 'Martes', date: '13 oct' },
  { index: 3, name: 'Miércoles', date: '14 oct' },
  { index: 4, name: 'Jueves', date: '15 oct' },
  { index: 5, name: 'Viernes', date: '16 oct' },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreatingSidepanel, setIsCreatingSidepanel] = useState(false);
  const [slotToCreate, setSlotToCreate] = useState<{ day: number; hour: number } | null>(null);

  const handleEmptySlotClick = (dayIndex: number, hour: number) => {
    setSelectedEvent(null);
    setSlotToCreate({ day: dayIndex, hour });
    setIsCreatingSidepanel(true);
  };

  const handleEventClick = (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (evt.type === 'google') return;
    setIsCreatingSidepanel(false);
    setSelectedEvent(evt);
  };

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn relative">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
              Citas
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Agenda clínica y control de disponibilidad con prevención de colisiones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Alternador Día / Semana / Mes */}
            <div className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--card)] p-0.5">
              {(['Día', 'Semana', 'Mes'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-[28px] px-3 rounded-[6px] text-[12px] font-[500] transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'bg-[var(--card-subtle)] text-[var(--text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Google Calendar status */}
            {calendarConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--success-bg)] text-[var(--success-text)] text-[12px] font-[500]">
                <IconCheck size={14} stroke={2} />
                <span>Calendario sincronizado</span>
              </span>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setCalendarConnected(true)}
                className="h-[32px] text-[12px]"
              >
                Conectar Google Calendar
              </Button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CUADRÍCULA HORARIA SEMANAL (08:00 a 20:00)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Cabecera de días */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)] bg-[var(--card-subtle)]">
              <div className="p-2 border-r border-[var(--border)] text-[11px] text-[var(--text-muted)] text-center">
                Hora
              </div>
              {DAYS_HEADER.map((d) => (
                <div key={d.index} className="p-2 text-center border-r border-[var(--border)] last:border-r-0">
                  <div className="text-[12px] font-[500] text-[var(--text)]">{d.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-[400]">{d.date}</div>
                </div>
              ))}
            </div>

            {/* Filas horarias */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)] h-[56px]"
                >
                  {/* Columna de hora */}
                  <div className="border-r border-[var(--border)] text-[11px] text-[var(--text-muted)] p-1 text-right pr-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* 5 columnas de días */}
                  {[1, 2, 3, 4, 5].map((dayIndex) => {
                    // Buscar evento en este slot
                    const event = SAMPLE_EVENTS.find(
                      (e) => e.dayIndex === dayIndex && Math.floor(e.startHour) === hour
                    );

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => handleEmptySlotClick(dayIndex, hour)}
                        className="border-r border-[var(--border)] last:border-r-0 p-1 relative hover:bg-[var(--card-subtle)] transition-colors cursor-pointer group"
                      >
                        {event && (
                          <div
                            onClick={(e) => handleEventClick(event, e)}
                            className={`w-full h-full rounded-[6px] p-1.5 text-[12px] font-[500] flex flex-col justify-between transition-all select-none ${
                              event.type === 'online'
                                ? 'bg-[var(--info-bg)] text-[var(--info-text)] border-l-[3px] border-l-[#185FA5]'
                                : event.type === 'presencial'
                                ? 'bg-[var(--neutral-bg)] text-[var(--neutral-text)] border-l-[3px] border-l-[#5F5E5A]'
                                : event.type === 'completada'
                                ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-l-[3px] border-l-[#3B6D11]'
                                : 'bg-[repeating-linear-gradient(45deg,#F1EFE8,#F1EFE8_6px,#EAE8E0_6px,#EAE8E0_12px)] text-[var(--text-muted)] border-l-[3px] border-l-[#888780]'
                            }`}
                          >
                            <span className="truncate leading-tight">{event.clientName}</span>
                            <span className="text-[11px] opacity-80 leading-none">
                              {event.type === 'google' ? 'Google Calendar' : `${hour}:00`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Indicador de hora actual (Línea fina verde con punto a las 11:45) */}
              <div
                className="absolute left-[60px] right-0 h-[1px] bg-[var(--brand-solid)] pointer-events-none z-10 flex items-center"
                style={{ top: '210px' }}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--brand-solid)] -ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PANEL LATERAL (360px): Detalle de cita o Crear cita
            ───────────────────────────────────────────────────────────── */}
        {(selectedEvent || isCreatingSidepanel) && (
          <aside className="fixed top-0 right-0 bottom-0 w-[360px] bg-[var(--card)] border-l border-[var(--border)] p-6 z-50 flex flex-col justify-between shadow-2xl animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                <h3 className="text-[14px] font-[500] text-[var(--text)]">
                  {selectedEvent ? 'Detalle de la cita' : 'Nueva cita médica'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    setIsCreatingSidepanel(false);
                  }}
                  className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  <IconX size={18} />
                </button>
              </div>

              {selectedEvent && (
                <div className="space-y-4 text-[13px]">
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Paciente</span>
                    <span className="font-[500] text-[var(--text)] text-[14px]">{selectedEvent.clientName}</span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Modalidad</span>
                    <Badge variant={selectedEvent.type === 'online' ? 'info' : 'neutral'}>
                      {selectedEvent.type === 'online' ? 'Online (Google Meet)' : 'Presencial en consulta'}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Horario</span>
                    <span className="text-[var(--text)]">Martes, 13 oct · 11:30 - 12:15</span>
                  </div>

                  {selectedEvent.notes && (
                    <div>
                      <span className="text-[12px] text-[var(--text-secondary)] block">Notas clínicas</span>
                      <p className="text-[var(--text)] font-[400] mt-0.5">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {isCreatingSidepanel && (
                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Nombre del cliente</label>
                    <Input placeholder="Buscar o escribir nombre" defaultValue="Marta Morales Sánchez" />
                  </div>
                  <div>
                    <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Modalidad</label>
                    <select className="h-[36px] w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-3 text-[13px]">
                      <option>Online (Google Meet)</option>
                      <option>Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Horario reservado</label>
                    <div className="p-2 rounded-[8px] bg-[var(--card-subtle)] text-[12px] text-[var(--text)]">
                      {slotToCreate?.hour}:00 - {Number(slotToCreate?.hour) + 1}:00 (45 min consulta + 15 min buffer)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción del panel */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-2">
              {selectedEvent ? (
                <>
                  <Button variant="primary">Marcar como completada</Button>
                  <Button variant="secondary">Reprogramar cita</Button>
                  <Button variant="ghost" className="text-[var(--danger-text)]">
                    Cancelar cita
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setIsCreatingSidepanel(false)}>
                  Guardar y agendar cita
                </Button>
              )}
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
