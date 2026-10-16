'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDietStore } from '@/lib/stores/useDietStore';
import { MealSlotType, DietItem, DayDemandType } from '@/types/diet';
import { FoodFuzzySearch } from './FoodFuzzySearch';
import { SaveAsRecipeModal } from './SaveAsRecipeModal';
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
  IconNote,
  IconCheck,
  IconX,
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
    updateItemNotes,
    addItemToSlot,
    unpackRecipeToSlot,
    moveItemToSlot,
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
  const [editingPrepNoteItemId, setEditingPrepNoteItemId] = useState<string | null>(null);
  const [prepNoteInput, setPrepNoteInput] = useState<string>('');

  // Estados de Drag & Drop Magnético y Snap Cinético (Framer Motion)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dayIndex: number; mealSlot: MealSlotType } | null>(null);
  const [recipeSlotToSave, setRecipeSlotToSave] = useState<{ dayIndex: number; mealSlot: MealSlotType; items: DietItem[] } | null>(null);
  const [activeMobileDay, setActiveMobileDay] = useState<number>(1);
  const [unpackedSlotKey, setUnpackedSlotKey] = useState<string | null>(null);

  const scrollToDay = (dayIndex: number) => {
    setActiveMobileDay(dayIndex);
    if (gridContainerRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const dayColWidth = isMobile ? 270 : 168;
      const targetScroll = (dayIndex - 1) * dayColWidth;
      gridContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    const dayColWidth = 270;
    const currentDay = Math.min(7, Math.max(1, Math.round(scrollLeft / dayColWidth) + 1));
    if (currentDay !== activeMobileDay) {
      setActiveMobileDay(currentDay);
    }
  };

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

  // Listener para animación de desempaquetado disparada desde el panel lateral de recetas
  useEffect(() => {
    const handleUnpackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ dayIndex: number; mealSlot: MealSlotType }>;
      if (customEvent.detail) {
        setUnpackedSlotKey(`${customEvent.detail.dayIndex}-${customEvent.detail.mealSlot}`);
        setTimeout(() => setUnpackedSlotKey(null), 1800);
      }
    };

    window.addEventListener('nutriapp:recipe-unpacked', handleUnpackEvent);
    return () => window.removeEventListener('nutriapp:recipe-unpacked', handleUnpackEvent);
  }, []);

  return (
    <div className="w-full space-y-3 pb-8">
      {/* ─────────────────────────────────────────────────────────────
          SELECTOR RÁPIDO DE DÍA EN MÓVIL (Píldoras con indicador de ciclado)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden items-center justify-between gap-1 p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-[12px] shadow-xs select-none">
        {DAYS.map((day) => {
          const isActive = activeMobileDay === day.index;
          const config = getDayCyclingConfig(day.index);
          const icon = config.icon || (config.demandType === 'entrenamiento_pesado' ? '🏋️' : config.demandType === 'descanso' ? '🛌' : '⚡');
          return (
            <button
              key={day.index}
              type="button"
              onClick={() => scrollToDay(day.index)}
              className={`flex-1 py-1.5 px-0.5 rounded-[8px] text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--brand-solid)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)]'
              }`}
            >
              <div className="text-[11px] leading-tight">{day.name.slice(0, 3)}</div>
              <div className="text-[9px] mt-0.5 opacity-90">{icon}</div>
            </button>
          );
        })}
      </div>

      {/* Contenedor con scroll horizontal cinético y snap-x para swipe a 60 FPS */}
      <div
        ref={gridContainerRef}
        onScroll={handleContainerScroll}
        className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x bg-[var(--card)] border border-[var(--border)] rounded-[12px] scrollbar-thin"
      >
        <div className="min-w-[1990px] md:min-w-[1296px] select-none">
          {/* ─────────────────────────────────────────────────────────────
              CABECERA DEL GRID (Columna fija sticky 100/120px + 7 Días)
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-[100px_repeat(7,minmax(270px,1fr))] md:grid-cols-[120px_repeat(7,minmax(168px,1fr))] border-b border-[var(--border)] bg-white">
            <div className="sticky left-0 z-20 bg-white p-[8px_10px] md:p-[8px_12px] border-r border-[var(--border)] text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
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
                  className="snap-start scroll-ml-[100px] md:scroll-ml-0 p-[8px_10px] border-r border-[var(--border)] last:border-r-0 flex flex-col justify-between gap-1.5 relative"
                >
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {day.name}
                    </span>
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
              className="grid grid-cols-[100px_repeat(7,minmax(270px,1fr))] md:grid-cols-[120px_repeat(7,minmax(168px,1fr))] border-b border-[var(--border)] min-h-[72px]"
            >
              {/* Columna fija sticky 100px / 120px limpia y simple */}
              <div className="sticky left-0 z-20 bg-white p-[8px_10px] md:p-[8px_12px] border-r border-[var(--border)] flex flex-col justify-center">
                <div className="text-sm font-semibold text-slate-700 bg-white pb-2 flex items-center gap-1.5">
                  <span className="text-slate-500 shrink-0">{slot.icon}</span>
                  <span className="truncate">{slot.label}</span>
                </div>
              </div>

              {/* 7 Celdas de días */}
              {DAYS.map((day) => {
                const isAiLoading = aiGeneratingDay === day.index;
                const items = getItemsForSlot(day.index, slot.key);
                const isFocused =
                  focusedCell?.dayIndex === day.index && focusedCell?.mealSlot === slot.key;
                const isEditing = isFocused && isEditingCell;

                const isDragTarget = Boolean(
                  draggingItemId &&
                  dragOverCell?.dayIndex === day.index &&
                  dragOverCell?.mealSlot === slot.key
                );

                return (
                  <div
                    key={`${day.index}-${slot.key}`}
                    data-testid={`slot-cell-${day.index}-${slot.key}`}
                    onClick={() => {
                      if (isAiLoading) return;
                      setFocusedCell({
                        dayIndex: day.index,
                        mealSlot: slot.key,
                        itemIndex: 0,
                        field: 'name',
                      });
                      startEditing();
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCell?.dayIndex !== day.index || dragOverCell?.mealSlot !== slot.key) {
                        setDragOverCell({ dayIndex: day.index, mealSlot: slot.key });
                      }
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      if (dragOverCell?.dayIndex === day.index && dragOverCell?.mealSlot === slot.key) {
                        setDragOverCell(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();

                      // 1. Detectar si viene un payload JSON de Receta o Alimento del Banco
                      const jsonStr = e.dataTransfer.getData('application/json');
                      if (jsonStr) {
                        try {
                          const payload = JSON.parse(jsonStr);
                          if (payload.type === 'RECIPE') {
                            // Desempaquetado Mágico de Receta a Alimentos Atómicos
                            unpackRecipeToSlot(day.index, slot.key, payload);
                            setUnpackedSlotKey(`${day.index}-${slot.key}`);
                            setTimeout(() => setUnpackedSlotKey(null), 1800);
                            setDraggingItemId(null);
                            setDragOverCell(null);
                            return;
                          } else if (payload.type === 'FOOD' && payload.food) {
                            // Alimento atómico arrastrado individualmente
                            addItemToSlot(day.index, slot.key, payload.food, payload.quantity || 100);
                            setDraggingItemId(null);
                            setDragOverCell(null);
                            return;
                          }
                        } catch (err) {
                          console.error('Error procesando drop de receta/alimento:', err);
                        }
                      }

                      // 2. Movimiento interno de alimento existente en la cuadrícula
                      const droppedId = e.dataTransfer.getData('text/plain') || draggingItemId;
                      if (droppedId) {
                        moveItemToSlot(droppedId, day.index, slot.key);
                      }
                      setDraggingItemId(null);
                      setDragOverCell(null);
                    }}
                    className={`snap-start scroll-ml-[100px] md:scroll-ml-0 border-r border-[var(--border)] last:border-r-0 p-[6px_8px] relative transition-all cursor-pointer min-h-[72px] flex flex-col justify-between ${
                      isAiLoading
                        ? 'bg-violet-950/20'
                        : isDragTarget
                        ? 'ring-2 ring-[var(--brand-solid)] ring-offset-2 ring-offset-[var(--card)] bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01] shadow-lg z-20'
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
                      /* Lista de Alimentos con Desempaquetado Cinético y Cascada a 60 FPS (Framer Motion) */
                      <motion.ul
                        layout
                        className="space-y-1.5 list-none p-0 m-0"
                        transition={{ layout: { type: 'spring', stiffness: 380, damping: 28 } }}
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          {isDragTarget && (
                            <motion.li
                              key="drag-indicator"
                              layout
                              initial={{ opacity: 0, scale: 0.95, height: 0 }}
                              animate={{ opacity: 1, scale: 1, height: 'auto' }}
                              exit={{ opacity: 0, scale: 0.95, height: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                              className="border-2 border-dashed border-emerald-500 rounded-[6px] py-1 px-1.5 text-center text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 mb-1.5 shadow-xs list-none"
                            >
                              🧲 Soltar alimento (Snap Magnético)
                            </motion.li>
                          )}

                          {unpackedSlotKey === `${day.index}-${slot.key}` && (
                            <motion.li
                              key="unpacked-banner"
                              layout
                              initial={{ opacity: 0, y: -10, scale: 0.92 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.9, height: 0, marginBottom: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.25 }}
                              className="list-none text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700/60 rounded px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-xs"
                            >
                              <span className="flex items-center gap-1">
                                <span className="text-[11px]">✨</span>
                                <span>Receta desempaquetada</span>
                              </span>
                              <span className="text-[9px] opacity-70">60 FPS</span>
                            </motion.li>
                          )}

                          {items.map((item, idx) => {
                            const isModified = Boolean(item.isModified);
                            const isAdded = !item.foodId;
                            const hasNotes = Boolean(item.notes || item.mealPrepNotes);
                            const isEditingNote = editingPrepNoteItemId === item.id;
                            const isBeingDragged = draggingItemId === item.id;

                            return (
                              <motion.li
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.8,
                                  height: 0,
                                  marginTop: 0,
                                  marginBottom: 0,
                                  overflow: 'hidden',
                                  transition: { duration: 0.2, ease: 'easeOut' },
                                }}
                                transition={{
                                  layout: { type: 'spring', stiffness: 400, damping: 25 },
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 25,
                                  delay: (idx % 8) * 0.045, // Cascada matemática: cada ingrediente cae con un ligero rebote
                                }}
                                draggable={!isAiLoading}
                                onDragStart={(e: any) => {
                                  e.dataTransfer.setData('text/plain', item.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggingItemId(item.id);
                                }}
                                onDragEnd={() => {
                                  setDraggingItemId(null);
                                  setDragOverCell(null);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative bg-white border border-slate-200 rounded-md p-2 shadow-sm cursor-grab active:cursor-grabbing select-none list-none transition-colors hover:border-slate-300 ${
                                  isBeingDragged ? 'opacity-35 scale-95 shadow-none' : ''
                                } ${
                                  isModified
                                    ? 'border-amber-300 bg-amber-50/30'
                                    : isAdded
                                    ? 'border-emerald-300 bg-emerald-50/30'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span
                                    className="truncate flex-1 text-[12px] font-medium text-slate-800 dark:text-slate-100 leading-snug"
                                    title={`${item.foodName} (${item.quantity} ${item.unit || 'g'})`}
                                  >
                                    <span className="clinical-reading font-medium">{item.foodName}</span> ·{' '}
                                    <span className="tabular-nums font-mono font-semibold text-slate-500 dark:text-slate-400">
                                      {item.quantity} {item.unit || 'g'}
                                    </span>
                                  </span>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Botón de Nota de Preparación (Meal Prep) */}
                                    <motion.button
                                      whileHover={{ scale: 1.15 }}
                                      whileTap={{ scale: 0.88 }}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isEditingNote) {
                                          setEditingPrepNoteItemId(null);
                                        } else {
                                          setEditingPrepNoteItemId(item.id);
                                          setPrepNoteInput(item.mealPrepNotes || item.notes || '');
                                        }
                                      }}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                                        hasNotes
                                          ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                                          : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }`}
                                      title={hasNotes ? `Meal Prep: ${item.mealPrepNotes || item.notes}` : 'Añadir nota de preparación (Meal Prep)'}
                                    >
                                      <IconNote size={13} stroke={hasNotes ? 2 : 1.5} />
                                    </motion.button>

                                    {/* Botón Eliminar */}
                                    <motion.button
                                      whileHover={{ scale: 1.15 }}
                                      whileTap={{ scale: 0.88 }}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(item.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-md transition-all cursor-pointer"
                                      title="Eliminar alimento"
                                    >
                                      <IconTrash size={12} />
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Badge visible de Meal Prep en la celda */}
                                {hasNotes && !isEditingNote && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPrepNoteItemId(item.id);
                                      setPrepNoteInput(item.mealPrepNotes || item.notes || '');
                                    }}
                                    className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/50 rounded-lg px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                                    title="Clic para editar instrucción de Meal Prep"
                                  >
                                    <span className="shrink-0 text-[11px]">🥣</span>
                                    <span className="truncate">{item.mealPrepNotes || item.notes}</span>
                                  </div>
                                )}

                                {/* Editor interactivo de Nota de Meal Prep */}
                                {isEditingNote && (
                                  <div
                                    className="mt-1.5 p-1.5 rounded-[6px] bg-[var(--card)] border border-amber-400 shadow-md space-y-1 text-[11px] animate-fadeIn"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-[500] text-amber-600 dark:text-amber-400">
                                      <span>Instrucción Meal Prep:</span>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPrepNoteItemId(null)}
                                        className="text-[var(--text-muted)] hover:text-[var(--text)]"
                                      >
                                        <IconX size={12} />
                                      </button>
                                    </div>

                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder="ej. Dejar en remojo la noche anterior..."
                                      value={prepNoteInput}
                                      onChange={(e) => setPrepNoteInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          updateItemNotes(item.id, prepNoteInput);
                                          setEditingPrepNoteItemId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingPrepNoteItemId(null);
                                        }
                                      }}
                                      className="w-full px-1.5 py-1 text-[11px] rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] focus:border-amber-500"
                                    />

                                    {/* Sugerencias clínicas rápidas */}
                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                      {[
                                        'Dejar en remojo 8h',
                                        'Cocinar y enfriar 24h',
                                        'Consumir al instante',
                                      ].map((sug) => (
                                        <button
                                          key={sug}
                                          type="button"
                                          onClick={() => {
                                            setPrepNoteInput(sug);
                                            updateItemNotes(item.id, sug);
                                            setEditingPrepNoteItemId(null);
                                          }}
                                          className="text-[9px] px-1 py-0.2 bg-[var(--card-subtle)] hover:bg-amber-100/50 dark:hover:bg-amber-950/60 rounded border border-[var(--border)] text-[var(--text-secondary)]"
                                        >
                                          +{sug}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex justify-end gap-1 pt-1 border-t border-[var(--border)]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateItemNotes(item.id, prepNoteInput);
                                          setEditingPrepNoteItemId(null);
                                        }}
                                        className="px-2 py-0.5 text-[10px] font-[500] bg-amber-500 hover:bg-amber-600 text-slate-950 rounded flex items-center gap-0.5"
                                      >
                                        <IconCheck size={11} stroke={2} /> Guardar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </motion.li>
                            );
                          })}

                          {items.length >= 2 && (
                            <motion.li
                              key="save-recipe-action"
                              layout
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pt-0.5 flex items-center justify-end list-none"
                            >
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRecipeSlotToSave({ dayIndex: day.index, mealSlot: slot.key, items });
                                }}
                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer font-medium px-1.5 py-0.5 rounded bg-purple-50/50 dark:bg-purple-950/30 border border-purple-500/20 hover:border-purple-500/40"
                                title="Guardar estos alimentos como una nueva receta reutilizable"
                              >
                                <span className="text-[11px]">🥣</span>
                                <span>Guardar como receta</span>
                              </motion.button>
                            </motion.li>
                          )}
                        </AnimatePresence>
                      </motion.ul>
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
          <div className="grid grid-cols-[100px_repeat(7,minmax(270px,1fr))] md:grid-cols-[120px_repeat(7,minmax(168px,1fr))] bg-white border-t border-[var(--border)]">
            <div className="sticky left-0 z-20 bg-white p-[8px_10px] md:p-[8px_12px] border-r border-[var(--border)] text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              Total día
            </div>

            {DAYS.map((day) => {
              const totals = getDayTotals(day.index);
              const compliance = getDayCompliance(day.index);
              const dayConfig = getDayCyclingConfig(day.index);

              return (
                <div
                  key={day.index}
                  className="snap-start scroll-ml-[100px] md:scroll-ml-0 p-[8px_10px] border-r border-[var(--border)] last:border-r-0 text-[12px]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-[600] font-mono tabular-nums raw-metric leading-none ${
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
                      className={`text-[9px] font-mono tabular-nums px-1 py-0.2 rounded border ${
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
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono tabular-nums">
                    P:{Math.round(totals.protein)} · C:{Math.round(totals.carbs)} · G:{Math.round(totals.fat)}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] font-mono tabular-nums truncate mt-0.5">
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

      {/* Modal: Guardar Alimentos de la Celda como Nueva Receta */}
      {recipeSlotToSave && (
        <SaveAsRecipeModal
          isOpen={Boolean(recipeSlotToSave)}
          onClose={() => setRecipeSlotToSave(null)}
          defaultCategory={recipeSlotToSave.mealSlot}
          initialItems={recipeSlotToSave.items}
        />
      )}
    </div>
  );
};
