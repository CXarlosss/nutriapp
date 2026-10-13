'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import { MealSlotType, DietItem, DayDemandType } from '@/types/diet';
import { FoodFuzzySearch } from './FoodFuzzySearch';
import {
  IconSun,
  IconCoffee,
  IconToolsKitchen2,
  IconApple,
  IconMoon,
  IconCopy,
  IconTrash,
  IconInfoCircle,
  IconSparkles,
  IconLoader2,
} from '@tabler/icons-react';

const DAYS = [
  { index: 1, name: 'Lunes' },
  { index: 2, name: 'Martes' },
  { index: 3, name: 'Miércoles' },
  { index: 4, name: 'Jueves' },
  { index: 5, name: 'Viernes' },
  { index: 6, name: 'Sábado' },
  { index: 7, name: 'Domingo' },
];

const MEAL_SLOTS: { key: MealSlotType; label: string; icon: React.ReactNode }[] = [
  { key: 'desayuno', label: 'Desayuno', icon: <IconSun size={15} stroke={1.5} /> },
  { key: 'media_manana', label: 'Media mañana', icon: <IconCoffee size={15} stroke={1.5} /> },
  { key: 'comida', label: 'Comida', icon: <IconToolsKitchen2 size={15} stroke={1.5} /> },
  { key: 'merienda', label: 'Merienda', icon: <IconApple size={15} stroke={1.5} /> },
  { key: 'cena', label: 'Cena', icon: <IconMoon size={15} stroke={1.5} /> },
];

export const DietGrid: React.FC = () => {
  const {
    focusedCell,
    isEditingCell,
    setFocusedCell,
    startEditing,
    stopEditing,
    moveFocus,
    getItemsForSlot,
    getSlotTotals,
    getDayTotals,
    targetKcal,
    updateItemQuantity,
    addItemToSlot,
    removeItem,
    copyDayToAllDays,
    getDayCyclingConfig,
    setDayDemandType,
    getDayCompliance,
    aiGeneratingDay,
    generateAIVariantForDay,
  } = useDietStore();

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [dayMenuOpen, setDayMenuOpen] = useState<number | null>(null);
  const [demandMenuOpen, setDemandMenuOpen] = useState<number | null>(null);

  // Manejo de atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (isEditingCell && target.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          stopEditing();
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        moveFocus(e.shiftKey ? 'shift-tab' : 'tab');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveFocus('right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveFocus('left');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus('up');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isEditingCell) {
          startEditing();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingCell, moveFocus, startEditing, stopEditing]);

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Contenedor con scroll horizontal interno */}
      <div
        ref={gridContainerRef}
        className="w-full overflow-x-auto bg-[var(--card)] border border-[var(--border)] rounded-[12px]"
      >
        <div className="min-w-[1296px] select-none">
          {/* ─────────────────────────────────────────────────────────────
              CABECERA DEL GRID (Columna fija 120px + 7 Días min 168px)
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-[120px_repeat(7,minmax(168px,1fr))] border-b border-[var(--border)] bg-[var(--card-subtle)]">
            <div className="p-[8px_12px] border-r border-[var(--border)] text-[12px] font-[500] text-[var(--text-secondary)] flex items-center">
              Comida
            </div>

            {DAYS.map((day) => {
              const dayConfig = getDayCyclingConfig(day.index);
              const isHeavy = dayConfig.demandType === 'entrenamiento_pesado';
              const isRest = dayConfig.demandType === 'descanso';
              const isRefeed = dayConfig.demandType === 'refeed';

              return (
                <div
                  key={day.index}
                  className="p-[8px_10px] border-r border-[var(--border)] last:border-r-0 flex flex-col justify-between gap-1.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-[600] text-[var(--text)]">{day.name}</span>
                    <button
                      type="button"
                      onClick={() => setDayMenuOpen(dayMenuOpen === day.index ? null : day.index)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                      title="Acciones del día"
                    >
                      <IconCopy size={13} stroke={1.5} />
                    </button>
                  </div>

                  {/* Badge de Demanda de Ciclado interactivo */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDemandMenuOpen(demandMenuOpen === day.index ? null : day.index)}
                      className={`w-full flex items-center justify-between px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-medium border transition-colors ${
                        isHeavy
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                          : isRest
                          ? 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:border-slate-600'
                          : isRefeed
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-teal-950/40 text-teal-300 border-teal-500/30 hover:border-teal-500/50'
                      }`}
                      title="Cambiar tipo de demanda para este día"
                    >
                      <span className="flex items-center gap-1 truncate">
                        <span>{dayConfig.icon || (isHeavy ? '🏋️' : isRest ? '🛌' : '⚡')}</span>
                        <span className="truncate">{dayConfig.targetKcal} kcal</span>
                      </span>
                      <span className="text-[9px] opacity-70 ml-1">▼</span>
                    </button>

                    {/* Menú de selección de demanda */}
                    {demandMenuOpen === day.index && (
                      <div className="absolute left-0 top-6 z-50 w-44 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 text-[11px] shadow-xl space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDayDemandType(day.index, 'entrenamiento_pesado');
                            setDemandMenuOpen(null);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--text)] flex items-center gap-1.5"
                        >
                          <span>🏋️‍♂️</span>
                          <span>Fuerza (2.250 kcal)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDayDemandType(day.index, 'entrenamiento_moderado');
                            setDemandMenuOpen(null);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--text)] flex items-center gap-1.5"
                        >
                          <span>⚡</span>
                          <span>Moderado (1.900 kcal)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDayDemandType(day.index, 'descanso');
                            setDemandMenuOpen(null);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--text)] flex items-center gap-1.5"
                        >
                          <span>🛌</span>
                          <span>Descanso (1.700 kcal)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDayDemandType(day.index, 'refeed');
                            setDemandMenuOpen(null);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--text)] flex items-center gap-1.5"
                        >
                          <span>🔄</span>
                          <span>Refeed (2.450 kcal)</span>
                        </button>
                        <div className="pt-1 mt-1 border-t border-[var(--border)]">
                          <button
                            type="button"
                            disabled={aiGeneratingDay !== null}
                            onClick={async () => {
                              setDemandMenuOpen(null);
                              await generateAIVariantForDay(day.index);
                            }}
                            className="w-full text-left px-2 py-1 rounded bg-violet-950/60 hover:bg-violet-900/80 text-violet-300 border border-violet-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer text-[11px]"
                          >
                            <IconSparkles size={12} className="text-violet-400" />
                            <span>Generar Variante (IA)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menú de acciones del día */}
                  {dayMenuOpen === day.index && (
                    <div className="absolute right-2 top-8 z-40 bg-[var(--card)] border border-[var(--border)] rounded-[8px] p-1.5 text-[12px] space-y-1 shadow-xl w-48">
                      {/* Botón Mágico Generar Variante (IA) */}
                      <button
                        type="button"
                        disabled={aiGeneratingDay !== null}
                        onClick={async () => {
                          setDayMenuOpen(null);
                          await generateAIVariantForDay(day.index);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-[6px] bg-violet-950/70 hover:bg-violet-900/90 text-violet-200 border border-violet-500/40 flex items-center gap-2 font-medium transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <IconSparkles size={14} className="text-violet-400 shrink-0" />
                        <span>Generar Variante (IA)</span>
                      </button>

                      <div className="border-t border-[var(--border)] my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          copyDayToAllDays(day.index);
                          setDayMenuOpen(null);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--text)]"
                      >
                        Copiar a toda la semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayMenuOpen(null)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-[var(--card-subtle)] text-[var(--danger-text)]"
                      >
                        Vaciar día
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              FILAS DE COMIDAS (5 Filas x 7 Días)
              ───────────────────────────────────────────────────────────── */}
          {MEAL_SLOTS.map((slot) => (
            <div
              key={slot.key}
              className="grid grid-cols-[120px_repeat(7,minmax(168px,1fr))] border-b border-[var(--border)] min-h-[72px]"
            >
              {/* Columna fija 120px */}
              <div className="p-[8px_12px] border-r border-[var(--border)] bg-[var(--card-subtle)] flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-[12px] font-[500] text-[var(--text)]">
                  <span className="text-[var(--text-secondary)]">{slot.icon}</span>
                  <span>{slot.label}</span>
                </div>
              </div>

              {/* 7 Celdas de días */}
              {DAYS.map((day) => {
                const isAiLoading = aiGeneratingDay === day.index;
                const items = getItemsForSlot(day.index, slot.key);
                const isFocused =
                  focusedCell?.dayIndex === day.index && focusedCell?.mealSlot === slot.key;
                const isEditing = isFocused && isEditingCell;

                return (
                  <div
                    key={`${day.index}-${slot.key}`}
                    onClick={() => {
                      if (isAiLoading) return;
                      setFocusedCell({
                        dayIndex: day.index,
                        mealSlot: slot.key,
                        itemIndex: 0,
                        field: 'name',
                      });
                    }}
                    onDoubleClick={() => {
                      if (isAiLoading) return;
                      setFocusedCell({
                        dayIndex: day.index,
                        mealSlot: slot.key,
                        itemIndex: 0,
                        field: 'name',
                      });
                      startEditing();
                    }}
                    className={`border-r border-[var(--border)] last:border-r-0 p-[6px_8px] relative transition-colors cursor-pointer min-h-[72px] flex flex-col justify-between ${
                      isAiLoading
                        ? 'bg-violet-950/20'
                        : isFocused
                        ? 'border-[2px] border-[var(--brand-solid)] bg-white z-10'
                        : 'hover:bg-[var(--card-subtle)] bg-[var(--card)]'
                    }`}
                  >
                    {isAiLoading ? (
                      /* Estado Skeleton durante la generación IA (1.5s) */
                      <div className="space-y-2 py-1.5 animate-pulse select-none">
                        <div className="h-4 bg-violet-900/30 rounded-[6px] border border-violet-500/30 flex items-center px-1.5 gap-1.5">
                          <IconLoader2 size={11} className="text-violet-400 animate-spin" />
                          <span className="text-[10px] text-violet-300 font-mono">Generando IA...</span>
                        </div>
                        <div className="h-3 bg-slate-800/60 rounded-[4px] w-3/4" />
                        <div className="h-2.5 bg-slate-800/40 rounded-[4px] w-1/2" />
                      </div>
                    ) : (
                      /* Chips apilados (radio 6px, 12px) */
                      <div className="space-y-1">
                        {items.map((item, idx) => {
                          const isModified = Boolean(item.isModified);
                          const isAdded = !item.foodId;

                          let chipStyle = 'bg-white border border-[var(--border)] text-[var(--text)]';
                          if (isModified || isAdded) {
                            chipStyle = 'bg-[var(--brand-bg)] text-[var(--brand-text)] border border-[var(--brand-border)]';
                          }

                          return (
                            <div
                            key={item.id || idx}
                            className={`group px-2 py-0.5 rounded-[6px] text-[12px] font-[400] flex items-center justify-between gap-1 transition-all ${chipStyle}`}
                          >
                            <span className="truncate">
                              {item.foodName} · {item.quantity} {item.unit || 'g'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--danger-text)] transition-opacity"
                              title="Eliminar alimento"
                            >
                              <IconTrash size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                    {/* Popover de edición rápida (ancho 280px) */}
                    {isEditing && (
                      <div
                        className="absolute top-1 left-1 z-50 w-[280px] bg-[var(--card)] border border-[var(--brand-solid)] rounded-[8px] p-2.5 shadow-2xl space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[11px] font-[500] text-[var(--text-secondary)]">
                          Añadir alimento a {slot.label}
                        </div>
                        <FoodFuzzySearch
                          onSelectFood={(food) => {
                            addItemToSlot(day.index, slot.key, food, 100);
                            stopEditing();
                          }}
                          onCancel={() => stopEditing()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* ─────────────────────────────────────────────────────────────
              FILA FINAL DE RESUMEN (Kcal y Macros P / C / G)
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-[120px_repeat(7,minmax(168px,1fr))] bg-[var(--card-subtle)] border-t border-[var(--border)]">
            <div className="p-[8px_12px] border-r border-[var(--border)] text-[12px] font-[500] text-[var(--text-secondary)] flex items-center">
              Total día
            </div>

            {DAYS.map((day) => {
              const totals = getDayTotals(day.index);
              const compliance = getDayCompliance(day.index);
              const dayConfig = getDayCyclingConfig(day.index);

              return (
                <div
                  key={day.index}
                  className="p-[8px_10px] border-r border-[var(--border)] last:border-r-0 text-[12px]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-[600] font-mono leading-none ${
                        compliance.status === 'optimal'
                          ? 'text-emerald-400'
                          : compliance.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {Math.round(totals.kcal)} kcal
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                        compliance.status === 'optimal'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                          : compliance.status === 'warning'
                          ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                          : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                      }`}
                      title={compliance.message}
                    >
                      {compliance.status === 'optimal'
                        ? 'En target'
                        : `${compliance.kcalDiff > 0 ? `+${compliance.kcalDiff}` : compliance.kcalDiff}k`}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                    P:{Math.round(totals.protein)} · C:{Math.round(totals.carbs)} · G:{Math.round(totals.fat)}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                    Obj: {dayConfig.targetCarbsG}g carb
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LEYENDA Y ATAJOS INFERIORES
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-[var(--text-secondary)] px-1">
        {/* Leyenda de 3 cuadraditos de 10px */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-[10px] h-[10px] rounded-[2px] bg-white border border-[var(--border)]" />
            <span>Original</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[var(--warning-bg)] border border-[var(--warning-text)]/30" />
            <span>Modificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[var(--brand-bg)] border border-[var(--brand-border)]" />
            <span>Añadido</span>
          </div>
        </div>

        {/* Atajos de teclado */}
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <IconInfoCircle size={14} />
          <span>Tab / Flechas para navegar · Enter para editar · Ctrl+C / Ctrl+V · Ctrl+Z deshacer</span>
        </div>
      </div>
    </div>
  );
};
