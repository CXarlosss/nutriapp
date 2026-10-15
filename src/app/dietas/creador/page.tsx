'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DietHeader } from '@/components/diet-editor/DietHeader';
import { NutrientCyclingBar } from '@/components/diet-editor/NutrientCyclingBar';
import { DietGrid } from '@/components/diet-editor/DietGrid';
import { ClinicalAuditScorecard } from '@/components/diet-editor/ClinicalAuditScorecard';
import { useDietStore } from '@/lib/stores/useDietStore';
import { useTemplateStore } from '@/lib/stores/useTemplateStore';

export default function DietCreatorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-[13px] text-[var(--text-secondary)]">Cargando Diet Builder...</div>}>
      <DietCreatorContent />
    </Suspense>
  );
}

function DietCreatorContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const { loadTemplateItems } = useDietStore();
  const { getTemplateById } = useTemplateStore();

  useEffect(() => {
    if (templateId) {
      const tmpl = getTemplateById(templateId);
      if (tmpl && tmpl.items && tmpl.items.length > 0) {
        loadTemplateItems(tmpl.name, tmpl.items, tmpl.dayCyclingConfigs);
      }
    }
  }, [templateId, getTemplateById, loadTemplateItems]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans h-screen overflow-hidden">
      {/* Barra superior fija y resumen de cliente */}
      <DietHeader />

      {/* Área de trabajo: Cuadrícula Excel a la izquierda + Copiloto Científico CDSS a la derecha */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hoja de cálculo limpia */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <NutrientCyclingBar />
          <DietGrid />
        </main>

        {/* Panel Lateral de Decisión Clínica y Evidencia (Scorecard) */}
        <ClinicalAuditScorecard />
      </div>
    </div>
  );
}
