'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DietHeader } from '@/components/diet-editor/DietHeader';
import { NutrientCyclingBar } from '@/components/diet-editor/NutrientCyclingBar';
import { DietGrid } from '@/components/diet-editor/DietGrid';
import { ClinicalAuditScorecard } from '@/components/diet-editor/ClinicalAuditScorecard';
import { useDietStore } from '@/lib/stores/useDietStore';
import { useTemplateStore } from '@/lib/stores/useTemplateStore';
import { useModeStore, findClientById } from '@/lib/stores/useModeStore';

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
  const clientId = searchParams.get('client');
  const { loadTemplateItems, setClientInfo } = useDietStore();
  const { getTemplateById } = useTemplateStore();
  const { realClients } = useModeStore();

  useEffect(() => {
    if (clientId) {
      const client = findClientById(clientId, realClients);
      if (client) {
        setClientInfo({
          clientName: client.name,
          clientPhone: client.phone,
          clientEmail: client.email,
          dietName: `Pauta Nutricional ${client.plan} - ${client.name.split(' ')[0]}`,
        });
      }
    }
  }, [clientId, realClients, setClientInfo]);

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
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#151513]">
          <NutrientCyclingBar />
          <DietGrid />
        </main>

        {/* Panel Lateral de Decisión Clínica y Evidencia (Scorecard) */}
        <ClinicalAuditScorecard />
      </div>
    </div>
  );
}
