'use client';

import React, { useEffect, useRef } from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import { MealSlotType, DietItem } from '@/types/diet';
import { FoodFuzzySearch } from './FoodFuzzySearch';
import { Plus, Trash2, Edit3, Flame, Clock } from 'lucide-react';

const DAYS = [
  { index: 1, name: 'Lunes' },
  { index: 2, name: 'Martes' },
  { index: 3, name: 'Miércoles' },
  { index: 4, name: 'Jueves' },
  { index: 5, name: 'Viernes' },
  { index: 6, name: 'Sábado' },
  { index: 7, name: 'Domingo' },
];

const MEAL_SLOTS: { key: MealSlotType; label: string; time: string }[] = [
  { key: 'desayuno', label: 'Desayuno', time: '08:30' },
  { key: 'media_manana', label: 'Media Mañana', time: '11:30' },
  { key: 'comida', label: 'Comida', time: '14:30' },
  { key: 'merienda', label: 'Merienda', time: '18:00' },
  { key: 'cena', label: 'Cena', time: '21:30' },
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
    updateItemQuantity,
    replaceItemFood,
    addItemToSlot,
    removeItem,
  } = useDietStore();

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // MANEJO DE NAVEGACIÓN ESPACIAL ESTRICTA POR TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si estamos en un input activo editando dentro del popup de búsqueda, dejamos que el input maneje el evento
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
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus('down');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isEditingCell) {
          startEditing();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingCell, moveFocus, startEditing, stopEditing]);

  return (
    <div
      ref={gridContainerRef}
      className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-md"
      role="grid"
      aria-label="Cuadrícula del Creador de Dietas"
    >
      <div className="min-w-[1100px]">
        {/* Cabecera de Días (Columnas) */}
        <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 border-b border-slate-800 pb-3 text-center">
          <div className="flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-500">
            Ingesta / Día
          </div>
          {DAYS.map((d) => (
            <div
              key={d.index}
              className={`rounded-lg py-2 px-3 text-sm font-semibold transition-colors ${
                focusedCell?.dayIndex === d.index
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800/80'
              }`}
            >
              {d.name}
            </div>
          ))}
        </div>

        {/* Filas de Ingestas */}
        <div className="divide-y divide-slate-800/80 pt-2 space-y-3">
          {MEAL_SLOTS.map((slot) => (
            <div key={slot.key} className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 pt-2 items-stretch">
              {/* Etiqueta de la comida */}
              <div className="flex flex-col justify-center rounded-xl bg-slate-900/50 p-2.5 border border-slate-800/60">
                <span className="font-semibold text-xs text-slate-200">{slot.label}</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                  <Clock className="h-2.5 w-2.5" /> {slot.time}
                </span>
              </div>

              {/* Celdas para cada uno de los 7 días */}
              {DAYS.map((day) => {
                const items = getItemsForSlot(day.index, slot.key);
                const totals = getSlotTotals(day.index, slot.key);
                const isFocused =
                  focusedCell?.dayIndex === day.index && focusedCell?.mealSlot === slot.key;
                const isEditing = isFocused && isEditingCell;

                return (
                  <div
                    key={`${day.index}-${slot.key}`}
                    role="gridcell"
                    tabIndex={0}
                    onClick={() => {
                      setFocusedCell({
                        dayIndex: day.index,
                        mealSlot: slot.key,
                        itemIndex: 0,
                        field: 'name',
                      });
                    }}
                    onDoubleClick={() => {
                      setFocusedCell({
                        dayIndex: day.index,
                        mealSlot: slot.key,
                        itemIndex: 0,
                        field: 'name',
                      });
                      startEditing();
                    }}
                    className={`relative min-h-[115px] flex flex-col justify-between rounded-xl p-2.5 transition-all outline-none ${
                      isFocused
                        ? 'bg-slate-900/90 ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/50 border border-emerald-500/60'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/70'
                    }`}
                  >
                    {/* Lista de alimentos en este slot */}
                    <div className="space-y-1.5 overflow-hidden">
                      {items.length === 0 ? (
                        <div className="flex h-12 items-center justify-center text-[11px] text-slate-600 italic">
                          Vacío (Enter para añadir)
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="group relative flex items-center justify-between rounded-md bg-slate-800/60 px-2 py-1 text-xs border border-white/5 hover:border-slate-700"
                          >
                            <div className="flex flex-col truncate pr-1">
                              <span className="truncate font-medium text-slate-200 text-[11px]" title={item.foodName}>
                                {item.foodName}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {item.kcal} kcal · P:{item.proteinG}g
                              </span>
                            </div>

                            {/* Control de gramos/cantidad instantáneo */}
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                value={item.quantity}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    updateItemQuantity(item.id, val);
                                  }
                                }}
                                className="w-12 rounded bg-slate-950 px-1 py-0.5 text-right font-mono text-[11px] text-white border border-slate-700 outline-none focus:border-emerald-500"
                              />
                              <span className="text-[10px] text-slate-400">{item.unit}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(item.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity ml-0.5"
                                title="Eliminar alimento"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Popover de búsqueda cuando está en modo edición */}
                    {isEditing && (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <FoodFuzzySearch
                          onSelectFood={(food) => {
                            addItemToSlot(day.index, slot.key, food, 100);
                            stopEditing();
                          }}
                          onCancel={() => stopEditing()}
                        />
                      </div>
                    )}

                    {/* Barra inferior de la celda con subtotales */}
                    <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5 font-mono text-amber-400/90">
                        <Flame className="h-2.5 w-2.5" /> {totals.kcal} kcal
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedCell({
                            dayIndex: day.index,
                            mealSlot: slot.key,
                            itemIndex: items.length,
                            field: 'name',
                          });
                          startEditing();
                        }}
                        className="rounded p-0.5 text-slate-500 hover:bg-emerald-950/80 hover:text-emerald-400 transition-colors"
                        title="Añadir alimento (Enter)"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
