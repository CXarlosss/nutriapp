'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconLeaf,
  IconCircleCheck,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconBrandGoogleFilled,
} from '@tabler/icons-react';
import { Card, Button, Badge } from '@/components/ui/nutri-ui';

interface DayOption {
  dayName: string;
  dayNumber: number;
  fullDate: string;
}

const DAYS: DayOption[] = [
  { dayName: 'Lun', dayNumber: 19, fullDate: '2026-10-19' },
  { dayName: 'Mar', dayNumber: 20, fullDate: '2026-10-20' },
  { dayName: 'Mié', dayNumber: 21, fullDate: '2026-10-21' },
  { dayName: 'Jue', dayNumber: 22, fullDate: '2026-10-22' },
  { dayName: 'Vie', dayNumber: 23, fullDate: '2026-10-23' },
  { dayName: 'Lun', dayNumber: 26, fullDate: '2026-10-26' },
];

const TIME_SLOTS = ['09:30', '10:30', '11:30', '12:30', '16:00', '17:00', '18:00', '19:00'];

export default function ReservaPublicaPage() {
  const [selectedDay, setSelectedDay] = useState(DAYS[1]); // Martes 20
  const [selectedSlot, setSelectedSlot] = useState('11:30');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isCollisionError, setIsCollisionError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const handleConfirm = () => {
    // Si se intenta reservar 10:30 simulamos colisión con aviso en ámbar
    if (selectedSlot === '10:30') {
      setIsCollisionError(true);
      return;
    }
    setIsCollisionError(false);
    setIsConfirmed(true);
  };

  if (isExpired) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-6 text-center space-y-3">
          <IconAlertCircle size={36} className="mx-auto text-[var(--warning-text)]" stroke={1.5} />
          <h1 className="text-[18px] font-[500] text-[var(--text)]">El enlace ha caducado</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Por favor, ponte en contacto con tu nutricionista para recibir una nueva invitación: <span className="text-[var(--text)] font-[500]">elenap.nutricionista@gmail.com</span>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-[24px_20px] sm:p-[28px_24px] space-y-6">
        {/* Cabecera */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center gap-1.5 mb-2">
            <IconLeaf size={22} className="text-[var(--brand-solid)]" stroke={1.5} />
            <span className="text-[15px] font-[500] text-[var(--text)]">NutriApp</span>
          </div>
          <h1 className="text-[18px] font-[500] text-[var(--text)]">
            Hola, Marta. Reserva tu revisión
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Sesión online de 45 minutos para ajustar tu pauta y resolver dudas.
          </p>
        </div>

        {/* Pantalla de Éxito o Selector */}
        {isConfirmed ? (
          <div className="text-center space-y-4 pt-2 animate-fadeIn">
            <IconCircleCheck size={40} className="mx-auto text-[var(--brand-solid)]" stroke={1.5} />
            <div>
              <h2 className="text-[16px] font-[500] text-[var(--text)]">Cita confirmada con éxito</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                {selectedDay.dayName}, {selectedDay.dayNumber} de octubre a las {selectedSlot}
              </p>
            </div>

            <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] text-[12px] text-left space-y-1">
              <div className="text-[var(--text-secondary)]">Enlace de videollamada:</div>
              <a
                href="https://meet.google.com/nutri-meet-123"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--brand-solid)] font-[500] hover:underline block truncate"
              >
                https://meet.google.com/nutri-meet-123
              </a>
            </div>

            <Button variant="secondary" className="w-full">
              <IconCalendar size={16} stroke={1.5} />
              <span>Añadir a mi calendario</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Aviso en ámbar en caso de colisión */}
            {isCollisionError && (
              <div className="p-3 rounded-[8px] bg-[var(--warning-bg)] text-[var(--warning-text)] text-[12px] flex items-center gap-2">
                <IconAlertCircle size={16} className="shrink-0" />
                <span>Ese hueco acaba de ocuparse. Elige otro.</span>
              </div>
            )}

            {/* Selector de día en tira horizontal con scroll (píldoras de 56px) */}
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-[400] block mb-2">
                Selecciona día
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {DAYS.map((d) => {
                  const isSelected = selectedDay.fullDate === d.fullDate;
                  return (
                    <button
                      key={d.fullDate}
                      type="button"
                      onClick={() => {
                        setSelectedDay(d);
                        setIsCollisionError(false);
                      }}
                      className={`w-[56px] h-[56px] shrink-0 rounded-[8px] flex flex-col items-center justify-center text-[12px] transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[var(--brand-solid)] text-white font-[500]'
                          : 'bg-[var(--card-subtle)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--brand-border)]'
                      }`}
                    >
                      <span className="text-[11px] opacity-80">{d.dayName}</span>
                      <span className="text-[15px] font-[500] leading-none mt-0.5">{d.dayNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rejilla de huecos horarios (3 columnas, botones de 36px) */}
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-[400] block mb-2">
                Horas disponibles
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((time) => {
                  const isSelected = selectedSlot === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(time);
                        setIsCollisionError(false);
                      }}
                      className={`h-[36px] rounded-[8px] text-[13px] font-[500] transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[var(--brand-solid)] text-white'
                          : 'bg-transparent border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--card-subtle)]'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pie con zona horaria y botón primario */}
            <div className="pt-2 border-t border-[var(--border)] space-y-3">
              <div className="text-[12px] text-[var(--text-secondary)] text-center">
                Zona horaria detectada: Europe/Madrid (UTC+2)
              </div>

              <Button variant="primary" className="w-full" onClick={handleConfirm}>
                Confirmar cita
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
