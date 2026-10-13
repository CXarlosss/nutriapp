'use client';

import React from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import { CheckCircle2, Loader2, AlertCircle, Copy, User, Calendar, Sparkles } from 'lucide-react';

export const DietHeader: React.FC = () => {
  const {
    dietName,
    clientName,
    saveStatus,
    lastSavedAt,
    saveRevision,
    lastNetworkBatchSize,
    copyDayToAllDays,
    flushPendingMutations,
  } = useDietStore();

  const formattedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">{dietName}</h1>
            <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
              Borrador Activo
            </span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Cliente: <strong className="text-slate-200">{clientName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Ciclo: <strong className="text-slate-200">15 Días (Activo)</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Indicador de Estado del Motor de Autoguardado */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 px-3.5 py-2 border border-slate-800 font-mono text-xs shadow-inner">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              <span className="text-amber-400">
                Guardando {lastNetworkBatchSize > 0 ? `(${lastNetworkBatchSize} celdas)` : '...'}
              </span>
            </>
          )}

          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">Guardado ✓</span>
              <span className="text-[10px] text-slate-500">({formattedTime})</span>
            </>
          )}

          {saveStatus === 'unsaved' && (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300">Debounce 500ms...</span>
            </>
          )}

          {saveStatus === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span className="text-rose-400">Error al sincronizar</span>
            </>
          )}

          <span className="text-[10px] text-slate-600 border-l border-slate-800 pl-2">
            Rev #{saveRevision}
          </span>
        </div>

        {/* Botón de acción rápida: Replicar Lunes */}
        <button
          onClick={() => copyDayToAllDays(1)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:text-white border border-slate-700"
          title="Copia la estructura del Lunes a Martes..Domingo"
        >
          <Copy className="h-3.5 w-3.5 text-slate-400" />
          Replicar Lunes a toda la semana
        </button>

        {/* Botón Guardar Forzado */}
        <button
          onClick={() => flushPendingMutations()}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/60 transition-all hover:bg-emerald-500"
        >
          Guardar Dieta
        </button>
      </div>
    </header>
  );
};
