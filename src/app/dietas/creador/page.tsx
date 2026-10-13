'use client';

import React from 'react';
import { DietHeader } from '@/components/diet-editor/DietHeader';
import { DietGrid } from '@/components/diet-editor/DietGrid';
import { ClinicalAuditScorecard } from '@/components/diet-editor/ClinicalAuditScorecard';

export default function DietCreatorPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans h-screen overflow-hidden">
      {/* Barra superior fija y resumen de cliente */}
      <DietHeader />

      {/* Área de trabajo: Cuadrícula Excel a la izquierda + Copiloto Científico CDSS a la derecha */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hoja de cálculo limpia */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <DietGrid />
        </main>

        {/* Panel Lateral de Decisión Clínica y Evidencia (Scorecard) */}
        <ClinicalAuditScorecard />
      </div>
    </div>
  );
}
