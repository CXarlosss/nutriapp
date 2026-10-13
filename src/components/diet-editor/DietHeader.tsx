'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDietStore } from '@/lib/stores/useDietStore';
import {
  IconArrowLeft,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconFileDownload,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { Button, Badge } from '@/components/ui/nutri-ui';

export const DietHeader: React.FC = () => {
  const {
    dietName,
    clientName,
    saveStatus,
    flushPendingMutations,
  } = useDietStore();

  const [localDietName, setLocalDietName] = useState(dietName);
  const [isClientSummaryOpen, setIsClientSummaryOpen] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <div className="w-full shrink-0">
      {/* ─────────────────────────────────────────────────────────────
          BARRA SUPERIOR FIJA (Altura 56px, fondo blanco, borde inf 1px)
          ───────────────────────────────────────────────────────────── */}
      <header className="h-[56px] bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
        {/* Izquierda: Volver, nombre de la dieta editable, chip cliente */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/clients"
            className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors shrink-0"
            title="Volver"
          >
            <IconArrowLeft size={18} stroke={1.5} />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            {isEditingName ? (
              <input
                type="text"
                value={localDietName}
                onChange={(e) => setLocalDietName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="text-[15px] font-[500] text-[var(--text)] bg-[var(--card-subtle)] border border-[var(--border)] rounded px-1.5 py-0.5 outline-none"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                className="text-[15px] font-[500] text-[var(--text)] truncate cursor-pointer hover:underline"
                title="Clic para editar nombre"
              >
                {localDietName}
              </span>
            )}

            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[12px] font-[400] text-[var(--text-secondary)] truncate">
              {clientName}
            </span>
          </div>
        </div>

        {/* Centro: Indicador de Guardado */}
        <div className="hidden md:flex items-center justify-center text-[12px]">
          {saveStatus === 'saved' && (
            <span className="text-[var(--brand-text)] font-[400] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-solid)]" />
              Guardado hace 3 s
            </span>
          )}

          {saveStatus === 'saving' && (
            <span className="text-[var(--text-secondary)] font-[400] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-pulse" />
              Guardando…
            </span>
          )}

          {saveStatus === 'unsaved' && (
            <span className="text-[var(--warning-text)] font-[500] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning-text)]" />
              Sin guardar
            </span>
          )}

          {saveStatus === 'error' && (
            <span className="text-[var(--danger-text)] font-[500]">Error al sincronizar</span>
          )}
        </div>

        {/* Derecha: Deshacer, Rehacer, Descargar PDF, Publicar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
            title="Deshacer (Ctrl+Z)"
          >
            <IconArrowBackUp size={16} stroke={1.5} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
            title="Rehacer"
          >
            <IconArrowForwardUp size={16} stroke={1.5} />
          </button>

          <Button variant="secondary" className="h-[32px] px-2.5 text-[12px]">
            <IconFileDownload size={14} stroke={1.5} />
            <span className="hidden sm:inline">Descargar PDF</span>
          </Button>

          <Button
            variant="primary"
            className="h-[32px] px-3 text-[12px]"
            onClick={() => flushPendingMutations()}
          >
            Publicar
          </Button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          FRANJA DE RESUMEN DEL CLIENTE (Colapsable)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--card-subtle)] border-b border-[var(--border)] px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between text-[12px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[var(--text-secondary)]">
              Objetivo: <strong className="text-[var(--text)] font-[500]">Recomposición corporal</strong>
            </span>
            <span className="text-[var(--text-secondary)]">
              Kcal objetivo: <strong className="text-[var(--brand-solid)] font-[500]">2.200 kcal</strong>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-secondary)]">Alergias:</span>
              <span className="px-1.5 py-0.2 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] text-[11px] font-[500]">
                Gluten
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] text-[11px] font-[500]">
                Lactosa
              </span>
            </div>
            {isClientSummaryOpen && (
              <span className="text-[var(--text-secondary)] truncate hidden md:inline">
                Notas: Alta adherencia; evitar lácteos en cena.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsClientSummaryOpen(!isClientSummaryOpen)}
            className="text-[var(--text-secondary)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
            title={isClientSummaryOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
          >
            {isClientSummaryOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
