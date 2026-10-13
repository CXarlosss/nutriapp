'use client';

import React from 'react';
import { FoodSwapResult, FoodSwapAlternative } from '@/types/diet';
import { ArrowLeftRight, Check, X, Flame, ShieldAlert, Sparkles, Scale } from 'lucide-react';

interface FoodSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: FoodSwapResult | null;
  onApplySwap: (alternative: FoodSwapAlternative) => void;
}

export function FoodSwapModal({
  isOpen,
  onClose,
  swapData,
  onApplySwap,
}: FoodSwapModalProps) {
  if (!isOpen || !swapData) return null;

  const pivotLabel =
    swapData.pivotNutrient === 'protein'
      ? 'proteína'
      : swapData.pivotNutrient === 'carbs'
      ? 'carbohidratos'
      : swapData.pivotNutrient === 'fat'
      ? 'grasas'
      : 'calorías';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm font-semibold text-white">
                Intercambio equivalente
              </h2>
              <p className="text-[11px] text-slate-400">
                Alternativas calculadas matemáticamente por {pivotLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resumen de porción original */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
              Alimento base actual
            </span>
            <span className="text-xs font-medium text-slate-200">
              {swapData.originalFoodName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-400 block">
              {swapData.originalQuantity} {swapData.originalUnit}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {swapData.originalKcal} kcal · {swapData.originalPivotValue}g {pivotLabel.slice(0, 4)}
            </span>
          </div>
        </div>

        {/* Lista de alternativas equivalentes */}
        <div className="overflow-y-auto px-5 py-3 space-y-2.5 flex-1 max-h-[60vh]">
          {swapData.alternatives.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay alternativas registradas en este grupo de intercambio.
            </div>
          ) : (
            swapData.alternatives.map((alt) => {
              const deltaKcalSign = alt.deltaKcal > 0 ? `+${alt.deltaKcal}` : `${alt.deltaKcal}`;
              const isVeryCloseKcal = Math.abs(alt.deltaKcal) <= 35;

              return (
                <div
                  key={alt.foodId}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 hover:border-emerald-500/40 transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {alt.foodName}
                        </span>
                        {isVeryCloseKcal && (
                          <span className="shrink-0 text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Óptimo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {alt.category} · {alt.description}
                      </span>
                    </div>

                    {/* Porción calculada destacada */}
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/20 block">
                        {alt.calculatedGrams} {alt.unit}
                      </span>
                    </div>
                  </div>

                  {/* Fila de macros y delta */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <span>{alt.kcal} kcal</span>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          isVeryCloseKcal
                            ? 'text-slate-400'
                            : alt.deltaKcal > 0
                            ? 'text-amber-400 bg-amber-950/30'
                            : 'text-sky-400 bg-sky-950/30'
                        }`}
                      >
                        ({deltaKcalSign} kcal)
                      </span>
                      <span>· P: {alt.proteinG}g</span>
                      <span>· C: {alt.carbsG}g</span>
                      <span>· G: {alt.fatG}g</span>
                    </div>

                    <button
                      onClick={() => onApplySwap(alt)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      <Check className="h-3 w-3" /> Aplicar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie informativo */}
        <div className="border-t border-slate-800 px-5 py-3 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-emerald-400" />
            Mantiene idéntico aporte de {pivotLabel} (0g variación)
          </span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
