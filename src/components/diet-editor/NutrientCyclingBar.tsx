'use client';

import React, { useState } from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import { CYCLING_PRESETS, DEMAND_CONFIGS } from '@/lib/clinical/nutrientCyclingEngine';
import { Dumbbell, Moon, Sparkles, ChevronDown, Check, Flame } from 'lucide-react';

export const NutrientCyclingBar: React.FC = () => {
  const {
    dayCyclingConfigs,
    activeCyclingPresetId,
    applyCyclingPreset,
    getWeekAverageKcal,
  } = useDietStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activePreset = CYCLING_PRESETS.find((p) => p.id === activeCyclingPresetId) || CYCLING_PRESETS[0];

  // Contar días de entrenamiento vs descanso
  let trainingDays = 0;
  let restDays = 0;
  for (let d = 1; d <= 7; d++) {
    const config = dayCyclingConfigs[d];
    if (config?.demandType === 'entrenamiento_pesado' || config?.demandType === 'entrenamiento_moderado') {
      trainingDays++;
    } else {
      restDays++;
    }
  }

  const weekAvg = getWeekAverageKcal();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Selector de Preset */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Dumbbell className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Ciclado de Nutrientes</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-400 border border-slate-800 hover:border-emerald-500/40 transition-colors"
              >
                <span>{activePreset.name}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-8 z-50 w-72 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl backdrop-blur-md space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500">
                    Estrategias de Ciclado Disponibles
                  </div>
                  {CYCLING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        applyCyclingPreset(preset.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left rounded-lg p-2 transition-colors flex items-start justify-between ${
                        activePreset.id === preset.id
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-xs">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">
                          {preset.description}
                        </span>
                      </div>
                      {activePreset.id === preset.id && (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Alternancia calculada para optimizar glucógeno en cargas pesadas y sensibilidad a la insulina.
          </p>
        </div>
      </div>

      {/* Métricas rápidas de la pauta */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="text-emerald-400 flex items-center gap-1">
            <span>🏋️‍♂️</span> {trainingDays} Entreno
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 flex items-center gap-1">
            <span>🛌</span> {restDays} Descanso
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/20">
          <Flame className="h-3 w-3" />
          <span>Media: {weekAvg} kcal/día</span>
        </div>
      </div>
    </div>
  );
};
