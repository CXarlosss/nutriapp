'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Check, Sparkles } from 'lucide-react';

export interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroCurrent {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ConcentricMacroRingsProps {
  current: MacroCurrent;
  target?: MacroTargets;
  dayName?: string;
  isTrainingDay?: boolean;
}

export const ConcentricMacroRings: React.FC<ConcentricMacroRingsProps> = ({
  current,
  target = { kcal: 1900, protein: 140, carbs: 210, fat: 55 },
  dayName,
  isTrainingDay = true,
}) => {
  // Dimensiones del SVG concéntrico
  const size = 180;
  const center = size / 2;
  const strokeWidth = 9;

  // Radios de los 3 anillos concéntricos
  // Exterior: Proteína | Intermedio: Carbohidratos | Interior: Grasas
  const rings = [
    {
      id: 'protein',
      label: 'Proteína',
      shortLabel: 'Prot',
      current: current.protein,
      target: target.protein,
      unit: 'g',
      radius: 72,
      color: '#10B981', // Emerald Neón
      gradientId: 'emerald-gradient',
      gradientFrom: '#10B981',
      gradientTo: '#34D399',
      trackColor: 'rgba(16, 185, 129, 0.15)',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    },
    {
      id: 'carbs',
      label: 'Carbohidratos',
      shortLabel: 'Carb',
      current: current.carbs,
      target: target.carbs,
      unit: 'g',
      radius: 56,
      color: '#0EA5E9', // Sky Azul Neón
      gradientId: 'sky-gradient',
      gradientFrom: '#0284C7',
      gradientTo: '#38BDF8',
      trackColor: 'rgba(14, 165, 233, 0.15)',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      dotClass: 'bg-sky-400',
    },
    {
      id: 'fat',
      label: 'Grasas Saludables',
      shortLabel: 'Grasa',
      current: current.fat,
      target: target.fat,
      unit: 'g',
      radius: 40,
      color: '#F43F5E', // Rose Fucsia Neón
      gradientId: 'rose-gradient',
      gradientFrom: '#E11D48',
      gradientTo: '#FB7185',
      trackColor: 'rgba(244, 63, 94, 0.15)',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-400',
    },
  ];

  // Cálculo de cumplimiento porcentual
  const proteinRatio = target.protein > 0 ? current.protein / target.protein : 0;
  const carbsRatio = target.carbs > 0 ? current.carbs / target.carbs : 0;
  const fatRatio = target.fat > 0 ? current.fat / target.fat : 0;
  const kcalRatio = target.kcal > 0 ? current.kcal / target.kcal : 0;

  const allClosed = proteinRatio >= 0.95 && carbsRatio >= 0.95 && fatRatio >= 0.95;
  const avgCompletion = Math.round(((proteinRatio + carbsRatio + fatRatio) / 3) * 100);

  return (
    <div
      data-testid="concentric-macro-rings"
      className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md relative overflow-hidden"
    >
      {/* Halo de fondo sutil con los tonos de los anillos */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

      {/* Cabecera del Scorecard de Anillos */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white flex items-center gap-1.5">
            <span>Anillos de Adherencia Diaria</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              Apple Rings
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">
            {dayName ? `Plan de ${dayName}` : 'Objetivo'}
          </span>
          <span className="text-[11px] font-mono tabular-nums font-semibold text-amber-400">
            {Math.round(target.kcal)} kcal
          </span>
        </div>
      </div>

      {/* Contenedor Principal: Anillos a la izquierda + Desglose cuantitativo a la derecha */}
      <div className="pt-3 flex flex-col sm:flex-row items-center gap-5">
        {/* Gráfico SVG de Anillos Concéntricos */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="-rotate-90 transform drop-shadow-md"
            aria-label="Anillos concéntricos de macronutrientes"
          >
            <defs>
              {rings.map((r) => (
                <linearGradient
                  key={r.gradientId}
                  id={r.gradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={r.gradientFrom} />
                  <stop offset="100%" stopColor={r.gradientTo} />
                </linearGradient>
              ))}
            </defs>

            {rings.map((r) => {
              const circumference = 2 * Math.PI * r.radius;
              const ratio = r.target > 0 ? r.current / r.target : 0;
              // El arco de visualización se limita a 1 para el cierre visual del anillo principal
              const visualRatio = Math.min(Math.max(ratio, 0), 1);
              const strokeOffset = circumference * (1 - visualRatio);
              const isComplete = ratio >= 0.99;

              return (
                <g key={r.id} className="transition-all duration-500">
                  {/* Pista de fondo (Track) */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r.radius}
                    stroke={r.trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  {/* Anillo de progreso animado */}
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={r.radius}
                    stroke={`url(#${r.gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset: strokeOffset }}
                    transition={{
                      type: 'spring',
                      stiffness: 55,
                      damping: 14,
                      mass: 0.8,
                    }}
                    strokeLinecap="round"
                    fill="none"
                    style={{
                      filter: isComplete ? `drop-shadow(0 0 4px ${r.glowColor})` : 'none',
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Núcleo Central: Calorías consumidas y llama */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 mb-0.5">
              <Flame size={14} className="animate-pulse" />
            </div>
            <span
              data-testid="rings-current-kcal"
              className="text-base font-extrabold text-white tabular-nums font-mono raw-metric leading-none"
            >
              {Math.round(current.kcal)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums leading-none mt-0.5">
              / {Math.round(target.kcal)}
            </span>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
              kcal
            </span>
          </div>
        </div>

        {/* Desglose de Macronutrientes por Anillo */}
        <div className="w-full space-y-2 flex-1">
          {rings.map((r) => {
            const ratio = r.target > 0 ? r.current / r.target : 0;
            const percent = Math.round(ratio * 100);
            const isClosed = percent >= 98;

            return (
              <div
                key={r.id}
                data-testid={`macro-ring-row-${r.id}`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-900/90"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${r.dotClass} shrink-0 shadow-xs`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 text-[12px] truncate">
                        {r.label}
                      </span>
                      {isClosed && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded-full">
                          <Check size={10} strokeWidth={2.5} />
                          <span>Cerrado</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                      <span className="font-semibold text-slate-100">{Math.round(r.current)}</span>
                      <span> / {r.target} {r.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold font-mono tabular-nums raw-metric ${
                      isClosed ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner de Adherencia Psicológica */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {allClosed ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span>¡Objetivo alcanzado! Has cerrado todos los anillos de macronutrientes. 🎉</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
            <span>Cumplimiento global de adherencia:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400">
              {avgCompletion}% completado
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
