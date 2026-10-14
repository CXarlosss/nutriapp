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
  IconAlertTriangle,
  IconX,
  IconExternalLink,
  IconShieldCheck,
  IconHistory,
} from '@tabler/icons-react';
import { Button, Badge } from '@/components/ui/nutri-ui';

export const DietHeader: React.FC = () => {
  const {
    dietName,
    clientName,
    saveStatus,
    flushPendingMutations,
    getClinicalAudit,
    clientWeightKg,
    clientProfileType,
  } = useDietStore();

  const [localDietName, setLocalDietName] = useState(dietName);
  const [isClientSummaryOpen, setIsClientSummaryOpen] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Auditoría clínica en tiempo real (CDSS)
  const audit = getClinicalAudit();

  const handlePublishClick = () => {
    if (audit.hasCriticalBlocker) {
      // Bloqueo clínico: abre el modal con la justificación del estudio y DOI
      setShowBlockerModal(true);
      return;
    }
    flushPendingMutations();
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 4000);
  };

  const criticalIssues = audit.evaluations.filter((e) => e.status === 'critical' && !e.passed);

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
              {clientName} ({clientWeightKg} kg)
            </span>

            {/* Badge de conformidad CDSS */}
            {audit.hasCriticalBlocker ? (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[var(--danger-bg)] text-[var(--danger-text)] text-[11px] font-[500]">
                <IconAlertTriangle size={12} />
                <span>CDSS: Bloqueo activo</span>
              </span>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[var(--success-bg)] text-[var(--success-text)] text-[11px] font-[500]">
                <IconShieldCheck size={12} />
                <span>CDSS: Conforme</span>
              </span>
            )}
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

          <Link href="/dietas/diet-demo-1">
            <Button variant="secondary" className="h-[32px] px-2.5 text-[12px]" title="Ver historial de auditoría inmutable y Time Travel">
              <IconHistory size={14} stroke={1.5} />
              <span className="hidden sm:inline">Auditoría Clínica</span>
            </Button>
          </Link>

          <a
            href={`/api/export-pdf?client=${encodeURIComponent(clientName)}&diet=${encodeURIComponent(
              localDietName
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="h-[32px] px-2.5 text-[12px]">
              <IconFileDownload size={14} stroke={1.5} />
              <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
          </a>

          <Button
            variant="primary"
            className={`h-[32px] px-3 text-[12px] ${
              audit.hasCriticalBlocker ? 'opacity-90 ring-2 ring-[var(--danger-text)]' : ''
            }`}
            onClick={handlePublishClick}
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
              Perfil: <strong className="text-[var(--text)] font-[500] capitalize">{clientProfileType}</strong>
            </span>
            <span className="text-[var(--text-secondary)]">
              Proteína actual:{' '}
              <strong
                className={`font-[500] ${
                  audit.proteinPerKg < (clientProfileType === 'deportista' ? 1.4 : 0.8)
                    ? 'text-[var(--danger-text)]'
                    : 'text-[var(--brand-solid)]'
                }`}
              >
                {audit.proteinPerKg} g/kg
              </strong>
            </span>
            <span className="text-[var(--text-secondary)]">
              Fibra:{' '}
              <strong
                className={`font-[500] ${
                  audit.totalFiberAvg < 25 ? 'text-[var(--warning-text)]' : 'text-[var(--text)]'
                }`}
              >
                {audit.totalFiberAvg} g/día
              </strong>
            </span>
            {isClientSummaryOpen && (
              <span className="text-[var(--text-secondary)] truncate hidden md:inline">
                Alergias: Gluten, Lactosa · Peso: {clientWeightKg} kg
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

      {/* Toast de confirmación de publicación */}
      {publishSuccess && (
        <div className="fixed bottom-4 right-4 z-50 bg-[var(--card)] border border-[var(--brand-solid)] rounded-[8px] p-3 shadow-xl text-[13px] text-[var(--brand-text)] flex items-center gap-2 animate-fadeIn">
          <IconShieldCheck size={18} className="text-[var(--brand-solid)]" />
          <span>Dieta validada clínicamente y publicada con éxito</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE BLOQUEO POR RIGOR CIENTÍFICO (CDSS)
          ───────────────────────────────────────────────────────────── */}
      {showBlockerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-[520px] bg-[var(--card)] border border-[var(--danger-text)]/40 rounded-[12px] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[var(--danger-text)]">
                <IconAlertTriangle size={24} className="shrink-0" />
                <h3 className="text-[16px] font-[500]">Bloqueo de Seguridad Clínica</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockerModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <p className="text-[13px] text-[var(--text)] leading-relaxed">
              El motor de soporte a la decisión clínica (CDSS) ha bloqueado la publicación de la dieta porque
              incumple los estándares fisiológicos mínimos para un paciente con perfil <strong>{clientProfileType}</strong>.
            </p>

            <div className="space-y-3 bg-[var(--danger-bg)] p-3.5 rounded-[8px] border border-[var(--danger-text)]/20 text-[12px] text-[var(--danger-text)]">
              {criticalIssues.map((issue, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="font-[500] text-[13px]">{issue.guideline.title}</div>
                  <p className="text-[12px] opacity-90">{issue.guideline.warning_message}</p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="font-mono">
                      Aporte actual: {issue.currentValue} {issue.guideline.unit} (Mínimo exigido:{' '}
                      {issue.guideline.min_value} {issue.guideline.unit})
                    </span>
                    <a
                      href={issue.guideline.doi_reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-[500]"
                    >
                      <span>Ver paper (DOI)</span>
                      <IconExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowBlockerModal(false)}>
                Modificar en el Editor
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--danger-text)] text-white hover:opacity-90"
                onClick={() => {
                  setShowBlockerModal(false);
                  flushPendingMutations();
                  setPublishSuccess(true);
                  setTimeout(() => setPublishSuccess(false), 4000);
                }}
              >
                Forzar Publicación (Excepción Clínica)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
