'use client';

import React, { useState, Suspense, use } from 'react';
import Link from 'next/link';
import {
  IconLeaf,
  IconArrowLeft,
  IconHistory,
  IconTable,
  IconShieldCheck,
  IconCalendar,
} from '@tabler/icons-react';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import { DietGrid } from '@/components/diet-editor/DietGrid';
import { NutrientCyclingBar } from '@/components/diet-editor/NutrientCyclingBar';
import { ClinicalAuditTimeline } from '@/components/diet-editor/ClinicalAuditTimeline';
import { ClinicalAuditScorecard } from '@/components/diet-editor/ClinicalAuditScorecard';

export default function DietDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-sm text-[var(--text-secondary)]">
          Cargando expediente clínico...
        </div>
      }
    >
      <DietDetailContent params={props.params} />
    </Suspense>
  );
}

function DietDetailContent(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const streamId = params.id || 'diet-demo-1';
  const [activeTab, setActiveTab] = useState<'plan' | 'audit'>('audit');
  const [historicalVersion, setHistoricalVersion] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans h-screen overflow-hidden">
      {/* Barra Superior con Identificación de Dieta y Pestañas */}
      <header className="h-[52px] bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors inline-flex items-center gap-1 text-xs"
          >
            <IconArrowLeft size={16} stroke={1.5} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <span className="text-[var(--border)] font-light">|</span>

          <div className="flex items-center gap-2">
            <IconLeaf size={18} className="text-[var(--brand-solid)]" stroke={1.5} />
            <span className="text-[14px] font-semibold text-[var(--text)] truncate max-w-[200px] sm:max-w-xs">
              Expediente Clínico · {streamId}
            </span>
            <Badge variant="purple">Event Sourced</Badge>
          </div>
        </div>

        {/* Pestañas de Navegación: Plan vs Auditoría Clínica */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <IconTable size={14} />
            <span>Plan Nutricional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <IconHistory size={14} />
            <span>Auditoría Clínica (CQRS)</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'plan' ? (
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            <NutrientCyclingBar />
            <DietGrid />
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full">
            <Card className="p-6 bg-white border border-slate-200 shadow-xs rounded-xl">
              <ClinicalAuditTimeline
                streamId={streamId}
                onTimeTravelChange={(version) => setHistoricalVersion(version)}
              />
            </Card>
          </main>
        )}

        {/* Panel Lateral Scorecard / Evidencia */}
        <ClinicalAuditScorecard />
      </div>
    </div>
  );
}
