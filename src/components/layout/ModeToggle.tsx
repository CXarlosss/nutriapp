'use client';

import React, { useEffect, useState } from 'react';
import { useModeStore } from '@/lib/stores/useModeStore';
import { IconSparkles, IconBuildingHospital, IconFlask } from '@tabler/icons-react';

export function ModeToggle() {
  const { mode, setMode } = useModeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-full bg-[var(--card-subtle)] rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between p-1 bg-slate-100/80 border border-slate-200 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => setMode('real')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-semibold transition-all ${
            mode === 'real'
              ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/50'
          }`}
          title="Consulta Real: sin pacientes falsos, lista para tus pacientes propios"
        >
          <IconBuildingHospital size={14} className={mode === 'real' ? 'text-emerald-600' : 'text-slate-600'} />
          <span className="truncate">Mi Consulta</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('demo')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-semibold transition-all ${
            mode === 'demo'
              ? 'bg-amber-500/20 text-amber-900 shadow-xs border border-amber-500/40 font-bold'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/50'
          }`}
          title="Modo Demo: pacientes ficticios para probar y explorar"
        >
          <IconFlask size={14} className={mode === 'demo' ? 'text-amber-700' : 'text-slate-600'} />
          <span className="truncate">Modo Demo</span>
        </button>
      </div>
    </div>
  );
}

export function DemoNoticeBanner() {
  const { mode, setMode } = useModeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || mode !== 'demo') return null;

  return (
    <div className="mb-4 p-2.5 sm:px-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-400 animate-fadeIn">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
        <span className="truncate">
          <strong>Modo Demostración activo:</strong> Estás viendo pacientes y citas ficticias de prueba.
        </span>
      </div>
      <button
        onClick={() => setMode('real')}
        className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors text-[11px]"
      >
        Ir a Mi Consulta Real →
      </button>
    </div>
  );
}
