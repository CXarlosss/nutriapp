'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconLeaf,
  IconFileDownload,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { Card, Button, Badge } from '@/components/ui/nutri-ui';

const MEALS = [
  { slot: 'Desayuno', items: ['Avena en copos suaves · 50 g', 'Yogur griego 0% grasa natural · 150 g', 'Arándanos frescos · 40 g'] },
  { slot: 'Media mañana', items: ['Manzana con piel · 1 unidad', 'Nueces crudas · 20 g'] },
  { slot: 'Comida', items: ['Pechuga de pollo a la plancha · 160 g', 'Arroz blanco basmati · 70 g', 'Aceite de oliva virgen extra · 10 ml'] },
  { slot: 'Merienda', items: ['Queso fresco batido 0% · 200 g', 'Plátano maduro · 1 unidad'] },
  { slot: 'Cena', items: ['Salmón fresco al horno · 150 g', 'Brócoli al vapor · 200 g', 'Patata cocida · 150 g'] },
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function MiPlanPage() {
  const [openDay, setOpenDay] = useState<string>('Lunes');

  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-10 font-sans text-[var(--text)]">
      <div className="max-w-[760px] mx-auto space-y-5">
        {/* Logotipo y Saludo */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <IconLeaf size={20} className="text-[var(--brand-solid)]" stroke={1.5} />
            <span className="text-[15px] font-[500] text-[var(--text)]">NutriApp</span>
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">Portal del paciente</span>
        </div>

        <div>
          <h1 className="text-[22px] font-[500] text-[var(--text)]">Hola, Carlos</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Aquí tienes tu pauta nutricional activa y tu calendario de revisiones.
          </p>
        </div>

        {/* Tarjeta Plan Activo con Barra de Progreso */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--text-secondary)]">Plan activo</div>
              <div className="text-[16px] font-[500] text-[var(--text)]">Recomposición Corporal</div>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)] mb-1">
              <span>Progreso quincenal</span>
              <span className="font-[500] text-[var(--text)]">Día 9 de 15</span>
            </div>
            <div className="w-full h-[6px] rounded-full bg-[#F1EFE8] overflow-hidden">
              <div className="h-full bg-[var(--brand-solid)]" style={{ width: `${(9 / 15) * 100}%` }} />
            </div>
          </div>
        </Card>

        {/* Tarjeta Próxima Cita */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[var(--brand-bg)] text-[var(--brand-text)] flex items-center justify-center shrink-0">
              <IconCalendar size={18} stroke={1.5} />
            </div>
            <div>
              <div className="text-[13px] font-[500] text-[var(--text)]">
                Próxima revisión quincenal
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">
                Martes, 20 de octubre a las 11:30 (Online)
              </div>
            </div>
          </div>

          <Button variant="secondary" className="h-[32px] text-[12px] self-start sm:self-auto">
            Reprogramar
          </Button>
        </Card>

        {/* Sección Mi Dieta */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-[500] text-[var(--text)]">Mi dieta</h2>
            <Button variant="secondary" className="h-[32px] text-[12px]">
              <IconFileDownload size={14} stroke={1.5} />
              <span>Descargar PDF</span>
            </Button>
          </div>

          {/* Acordeón móvil / Cuadrícula escritorio */}
          <div className="space-y-2">
            {DAYS.map((day) => {
              const isOpen = openDay === day;
              return (
                <div
                  key={day}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenDay(isOpen ? '' : day)}
                    className="w-full p-[12px_16px] flex items-center justify-between text-left cursor-pointer hover:bg-[var(--card-subtle)]"
                  >
                    <span className="text-[14px] font-[500] text-[var(--text)]">{day}</span>
                    <span className="text-[var(--text-secondary)]">
                      {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-[12px_16px] pt-0 divide-y divide-[var(--border)]">
                      {MEALS.map((meal) => (
                        <div key={meal.slot} className="py-2.5 text-[13px]">
                          <div className="text-[12px] font-[500] text-[var(--text-secondary)] mb-1">
                            {meal.slot}
                          </div>
                          <ul className="space-y-1">
                            {meal.items.map((item, idx) => (
                              <li key={idx} className="text-[var(--text)] font-[400]">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
