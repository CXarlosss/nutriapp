'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Apple, Calendar, ArrowLeftRight, Check, ArrowLeft, RotateCcw, ShoppingCart, Printer } from 'lucide-react';
import { FoodSwapModal } from './FoodSwapModal';
import { ShoppingListView } from './ShoppingListView';
import { ConcentricMacroRings, MacroTargets } from './ConcentricMacroRings';
import { calculateFoodSwaps } from '@/lib/clinical/foodSwapEngine';
import { FoodSwapResult, FoodSwapAlternative } from '@/types/diet';

const DAYS = [
  { index: 1, label: 'L', name: 'Lunes' },
  { index: 2, label: 'M', name: 'Martes' },
  { index: 3, label: 'X', name: 'Miércoles' },
  { index: 4, label: 'J', name: 'Jueves' },
  { index: 5, label: 'V', name: 'Viernes' },
  { index: 6, label: 'S', name: 'Sábado' },
  { index: 7, label: 'D', name: 'Domingo' },
];

export interface PatientDietItem {
  id: string;
  day_index: number;
  meal_slot: string;
  free_text: string;
  quantity: number;
  unit: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  originalFoodName?: string;
  originalQuantity?: number;
  isSwapped?: boolean;
  notes?: string;
  mealPrepNotes?: string;
}

interface PatientDietViewProps {
  initialItems: PatientDietItem[];
  dietData: {
    id: string;
    name: string;
    client_name: string;
    valid_to?: string;
  };
  initialDayIndex: number;
}

const MEAL_CONFIG: Record<string, { label: string; time: string; icon: string }> = {
  desayuno: { label: 'Desayuno', time: '08:30', icon: '🌅' },
  media_manana: { label: 'Media Mañana', time: '11:30', icon: '☕' },
  comida: { label: 'Comida', time: '14:30', icon: '🍽️' },
  merienda: { label: 'Merienda', time: '18:00', icon: '🍎' },
  cena: { label: 'Cena', time: '21:30', icon: '🌙' },
};

export function PatientDietView({
  initialItems,
  dietData,
  initialDayIndex,
}: PatientDietViewProps) {
  const [items, setItems] = useState<PatientDietItem[]>(initialItems);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(initialDayIndex);
  const [viewMode, setViewMode] = useState<'menu' | 'shopping'>('menu');
  
  // Estado del Modal de Intercambio
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForSwap, setSelectedItemForSwap] = useState<PatientDietItem | null>(null);
  const [currentSwapData, setCurrentSwapData] = useState<FoodSwapResult | null>(null);

  // Filtrar ítems del día seleccionado
  const dayItems = items.filter((it) => it.day_index === activeDayIndex);

  // Calcular totales nutricionales del día actual
  const dayTotals = dayItems.reduce(
    (acc, it) => ({
      kcal: acc.kcal + (it.kcal || 0),
      protein: acc.protein + (it.protein_g || 0),
      carbs: acc.carbs + (it.carbs_g || 0),
      fat: acc.fat + (it.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const isTrainingDay = [1, 2, 4, 5].includes(activeDayIndex);
  const dayTarget: MacroTargets = isTrainingDay
    ? { kcal: 1900, protein: 140, carbs: 210, fat: 55 }
    : { kcal: 1700, protein: 140, carbs: 125, fat: 60 };

  // Agrupar por franja de comida
  const groupedMeals: Record<string, PatientDietItem[]> = {
    desayuno: [],
    media_manana: [],
    comida: [],
    merienda: [],
    cena: [],
  };

  dayItems.forEach((it) => {
    if (groupedMeals[it.meal_slot]) {
      groupedMeals[it.meal_slot].push(it);
    }
  });

  // Manejar apertura de modal de intercambio
  const handleOpenSwap = (item: PatientDietItem) => {
    const swapResult = calculateFoodSwaps(item.free_text, item.quantity);
    if (!swapResult) {
      alert(`No se han encontrado equivalencias directas para "${item.free_text}".`);
      return;
    }
    setSelectedItemForSwap(item);
    setCurrentSwapData(swapResult);
    setIsModalOpen(true);
  };

  // Aplicar intercambio en la dieta del paciente
  const handleApplySwap = (alt: FoodSwapAlternative) => {
    if (!selectedItemForSwap) return;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === selectedItemForSwap.id) {
          return {
            ...it,
            free_text: alt.foodName,
            quantity: alt.calculatedGrams,
            unit: alt.unit,
            kcal: alt.kcal,
            protein_g: alt.proteinG,
            carbs_g: alt.carbsG,
            fat_g: alt.fatG,
            originalFoodName: it.originalFoodName || selectedItemForSwap.free_text,
            originalQuantity: it.originalQuantity || selectedItemForSwap.quantity,
            isSwapped: true,
          };
        }
        return it;
      })
    );

    setIsModalOpen(false);
    setSelectedItemForSwap(null);
  };

  // Revertir alimento original si fue intercambiado
  const handleRevertSwap = (itemId: string) => {
    const originalItem = initialItems.find((orig) => orig.id === itemId);
    if (!originalItem) return;

    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...originalItem, isSwapped: false } : it))
    );
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Cabecera superior compacta */}
      <header className="flex items-center justify-between border-b border-slate-900 pb-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Inicio
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export-pdf?client=${encodeURIComponent(dietData.client_name)}&diet=${encodeURIComponent(dietData.name)}&autoprint=true`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="export-hospital-pdf-btn"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-emerald-300 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            title="Descargar Informe Médico Hospitalario Oficial (PDF)"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Informe PDF</span>
          </a>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plan Activo
          </div>
        </div>
      </header>

      {/* Selector de Modo: Menú Diario vs Lista de la Compra Semanal */}
      <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-semibold">
        <button
          type="button"
          data-testid="mode-menu-btn"
          onClick={() => setViewMode('menu')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'menu'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Menú Diario</span>
        </button>
        <button
          type="button"
          data-testid="mode-shopping-btn"
          onClick={() => setViewMode('shopping')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'shopping'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Lista de la Compra</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 font-mono">
            Semanal
          </span>
        </button>
      </div>

      {viewMode === 'shopping' ? (
        <ShoppingListView
          items={items}
          dietName={dietData.name}
          clientName={dietData.client_name}
          onBackToMenu={() => setViewMode('menu')}
        />
      ) : (
        <>
          {/* Tarjeta del Plan del Cliente */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Apple className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-white truncate">{dietData.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-slate-500" /> Válido hasta: {dietData.valid_to || 'Próxima revisión'}
            </p>
          </div>
        </div>

        {/* Anillos SVG Concéntricos de Macronutrientes (Apple Watch Activity Rings) */}
        <ConcentricMacroRings
          current={dayTotals}
          target={dayTarget}
          dayName={DAYS.find((d) => d.index === activeDayIndex)?.name}
          isTrainingDay={isTrainingDay}
        />
      </div>

      {/* Selector de Días: 7 botones compactos */}
      <nav aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => {
          const isSelected = d.index === activeDayIndex;
          const isTraining = [1, 2, 4, 5].includes(d.index);

          return (
            <button
              key={d.index}
              onClick={() => setActiveDayIndex(d.index)}
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50 scale-[1.03]'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800/60'
              }`}
            >
              <span className="text-[11px] leading-none">{d.label}</span>
              <span className="text-[9px] mt-0.5 leading-none">
                {isTraining ? '🏋️' : '🛌'}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Listado de Ingestas del Día con soporte para intercambios */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-300">
              Menú de {DAYS.find((d) => d.index === activeDayIndex)?.name}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                [1, 2, 4, 5].includes(activeDayIndex)
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {[1, 2, 4, 5].includes(activeDayIndex)
                ? '🏋️ Entrenamiento Pesado'
                : '🛌 Descanso y Recuperación'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3 text-emerald-400" /> Intercambios
          </span>
        </div>

        {Object.entries(MEAL_CONFIG).map(([slotKey, config]) => {
          const itemsInSlot = groupedMeals[slotKey] || [];
          const mealKcal = itemsInSlot.reduce((acc, it) => acc + (it.kcal || 0), 0);

          return (
            <section
              key={slotKey}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-3.5 shadow-sm space-y-2.5 transition-all"
            >
              {/* Cabecera de la comida */}
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <div>
                    <h2 className="text-xs font-bold text-slate-200">{config.label}</h2>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {config.time}
                    </span>
                  </div>
                </div>
                {mealKcal > 0 && (
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {Math.round(mealKcal)} kcal
                  </span>
                )}
              </div>

              {/* Lista de alimentos */}
              {itemsInSlot.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic py-1">Sin alimentos asignados para esta ingesta.</p>
              ) : (
                <ul className="space-y-2">
                  {itemsInSlot.map((it) => (
                    <li
                      key={it.id}
                      className={`rounded-xl p-2.5 text-xs border transition-all ${
                        it.isSwapped
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200 block truncate text-[11px]">
                              {it.free_text}
                            </span>
                            {it.isSwapped && (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-500/30">
                                Intercambiado
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {it.kcal ? `${Math.round(it.kcal)} kcal` : ''}
                            {it.protein_g ? ` · P: ${it.protein_g}g` : ''}
                            {it.carbs_g ? ` · C: ${it.carbs_g}g` : ''}
                            {it.fat_g ? ` · G: ${it.fat_g}g` : ''}
                          </span>
                        </div>

                        {/* Ración y botón de intercambio */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="rounded-lg bg-slate-900 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-400 border border-slate-800">
                            {it.quantity} {it.unit || 'g'}
                          </span>

                          <button
                            onClick={() => handleOpenSwap(it)}
                            title="Intercambiar por alimento equivalente"
                            className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-300 px-2 py-1 text-[10px] font-medium border border-slate-700/80 transition-colors"
                          >
                            <ArrowLeftRight className="h-3 w-3 text-emerald-400" />
                            <span className="hidden sm:inline">Cambiar</span>
                          </button>

                          {it.isSwapped && (
                            <button
                              onClick={() => handleRevertSwap(it.id)}
                              title="Restablecer alimento original"
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Instrucción crítica de Meal Prep si está definida */}
                      {Boolean(it.notes || it.mealPrepNotes) && (
                        <div className="mt-2 pt-1.5 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5 bg-amber-950/20 rounded-lg p-2">
                          <span className="text-[13px] shrink-0">🥣</span>
                          <div>
                            <span className="font-semibold text-amber-200">Meal Prep:</span>{' '}
                            <span className="text-slate-300 leading-relaxed">{it.notes || it.mealPrepNotes}</span>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      </>
      )}

      {/* Modal de Intercambios Dinámicos */}
      <FoodSwapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        swapData={currentSwapData}
        onApplySwap={handleApplySwap}
      />
    </div>
  );
}
