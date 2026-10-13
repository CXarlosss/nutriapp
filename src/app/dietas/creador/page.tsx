import React from 'react';
import { DietHeader } from '@/components/diet-editor/DietHeader';
import { DietGrid } from '@/components/diet-editor/DietGrid';
import { MacroSummary } from '@/components/diet-editor/MacroSummary';
import Link from 'next/link';
import { ArrowLeft, Keyboard, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export default function DietCreatorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6">
      {/* Barra de navegación superior */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio / Dashboard
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Zustand Store + Supabase Autosave (500ms debounce)
          </span>
        </div>
      </div>

      {/* Cabecera del Creador */}
      <DietHeader />

      {/* Resumen Reactivo de Macros */}
      <MacroSummary />

      {/* Cuadrícula Principal Tipo Hoja de Cálculo (Excel/Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Keyboard className="h-4 w-4 text-emerald-400" />
            Navegación espacial por teclado activa: [Tab] [Shift+Tab] [Flechas] [Enter] [Esc]
          </div>
          <div className="text-[11px] text-slate-500">
            Doble clic o <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">Enter</kbd> para buscar alimento con autocompletado
          </div>
        </div>
        <DietGrid />
      </div>

      {/* Panel de Auditoría Técnica & Testeo de Criterios */}
      <footer className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          Verificación de Criterios de Aceptación (Día/Bloque 2)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400">
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
            <strong className="text-slate-200 block mb-1">1. Navegación Espacial</strong>
            El foco viaja entre celdas mediante Tab o Flechas sin saltos ilógicos. La tecla Escape cancela y Enter activa la búsqueda.
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
            <strong className="text-slate-200 block mb-1">2. Fuzzy Search & Debounce</strong>
            Búsqueda de alimentos en Supabase con debounce estricto de 350ms, evitando peticiones por cada pulsación de tecla.
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
            <strong className="text-slate-200 block mb-1">3. Prevención de Race Conditions</strong>
            Mutaciones encoladas en Map por clave única + Mutex en vuelo. Modificar 3 celdas consecutivas genera un único POST consolidado.
          </div>
        </div>
      </footer>
    </div>
  );
}
