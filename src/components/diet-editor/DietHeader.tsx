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

        {/* Botón Asignar a Cliente (Copy-on-Assign) */}
        <AssignModal />

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

// Subcomponente modal para asignar la plantilla al cliente
function AssignModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; dietId?: string; error?: string } | null>(null);

  const handleAssign = async () => {
    setIsPending(true);
    setResult(null);
    try {
      // Import dinámico de la Server Action
      const { assignTemplateToClient } = await import('@/app/actions/dietAssignment');
      const res = await assignTemplateToClient({
        clientId: 'a0000000-0000-0000-0000-000000000001', // ID del cliente demo de seed.sql
        templateId: 'tmpl-def-1900',
        dietName: 'Definición Muscular 1900 kcal',
      });
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setResult(null);
        }}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 border border-emerald-500/30"
      >
        <User className="h-3.5 w-3.5" />
        Asignar a cliente
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white">Asignar Dieta al Paciente</h2>
            <p className="mt-1 text-xs text-slate-400">
              Se ejecutará el procedimiento transaccional <code>assign_template</code> en PostgreSQL (Copy-on-Assign). La plantilla original quedará intacta y el cliente recibirá una copia editable.
            </p>

            <div className="mt-4 rounded-xl bg-slate-950 p-3 text-xs border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Paciente:</span>
                <strong className="text-slate-200">Carlos Pérez (Cliente Demo)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plantilla Matriz:</span>
                <strong className="text-emerald-400">Definición Muscular 1900 kcal</strong>
              </div>
            </div>

            {result && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs border ${
                  result.success
                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/40 text-rose-300'
                }`}
              >
                {result.success ? (
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> ¡Asignación completada con éxito!
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      ID Dieta Generada: <code className="text-white font-mono">{result.dietId}</code>
                    </p>
                    <div className="mt-3">
                      <a
                        href="/mi-dieta"
                        className="inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Ver vista del paciente (/mi-dieta) →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>Error: {result.error}</div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
              {!result?.success && (
                <button
                  onClick={handleAssign}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Clonando en Supabase...
                    </>
                  ) : (
                    'Confirmar Asignación'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
