'use client';

import React from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import { Flame, Activity, Zap, ShieldCheck } from 'lucide-react';

export const MacroSummary: React.FC = () => {
  const { targetKcal, getWeekAverageKcal, getDayTotals, focusedCell } = useDietStore();

  const avgKcal = getWeekAverageKcal();
  const activeDay = focusedCell ? focusedCell.dayIndex : 1;
  const activeDayTotals = getDayTotals(activeDay);

  const kcalDiff = activeDayTotals.kcal - targetKcal;
  const isCloseToTarget = Math.abs(kcalDiff) <= 100;

  // Porcentaje estimado de macros sobre calorías (P: 4 kcal/g, C: 4 kcal/g, G: 9 kcal/g)
  const totalCalFromMacros =
    activeDayTotals.protein * 4 + activeDayTotals.carbs * 4 + activeDayTotals.fat * 9 || 1;
  const pctProtein = Math.round(((activeDayTotals.protein * 4) / totalCalFromMacros) * 100);
  const pctCarbs = Math.round(((activeDayTotals.carbs * 4) / totalCalFromMacros) * 100);
  const pctFat = Math.round(((activeDayTotals.fat * 9) / totalCalFromMacros) * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Balance Nutricional en Tiempo Real (Día #{activeDay})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Recálculo reactivo con 0ms de latencia vía Zustand Store
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 border border-slate-800">
            <Flame className="h-4 w-4 text-amber-400" />
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Día: </span>
              <span className="font-mono text-sm font-bold text-white">{activeDayTotals.kcal}</span>
              <span className="text-xs text-slate-500"> / {targetKcal} kcal</span>
            </div>
          </div>

          <div
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
              isCloseToTarget
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                : kcalDiff > 0
                ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                : 'bg-sky-950/80 text-sky-400 border border-sky-500/30'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {isCloseToTarget
              ? 'En Objetivo (±100 kcal)'
              : kcalDiff > 0
              ? `+${kcalDiff} kcal sobre objetivo`
              : `${kcalDiff} kcal bajo objetivo`}
          </div>
        </div>
      </div>

      {/* Distribución de Macronutrientes */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calorías */}
        <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400">Energía Total</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-amber-400">{activeDayTotals.kcal}</span>
            <span className="text-xs text-slate-500">kcal</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (activeDayTotals.kcal / targetKcal) * 100)}%` }}
            />
          </div>
        </div>

        {/* Proteína */}
        <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
            <span>Proteínas</span>
            <span className="text-emerald-400 font-mono">{pctProtein}%</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-emerald-400">{activeDayTotals.protein}</span>
            <span className="text-xs text-slate-500">g</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, pctProtein * 2)}%` }}
            />
          </div>
        </div>

        {/* Carbohidratos */}
        <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
            <span>Carbohidratos</span>
            <span className="text-sky-400 font-mono">{pctCarbs}%</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-sky-400">{activeDayTotals.carbs}</span>
            <span className="text-xs text-slate-500">g</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${Math.min(100, pctCarbs * 2)}%` }}
            />
          </div>
        </div>

        {/* Grasas */}
        <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
            <span>Grasas</span>
            <span className="text-rose-400 font-mono">{pctFat}%</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-rose-400">{activeDayTotals.fat}</span>
            <span className="text-xs text-slate-500">g</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-rose-400 transition-all duration-300"
              style={{ width: `${Math.min(100, pctFat * 2)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
