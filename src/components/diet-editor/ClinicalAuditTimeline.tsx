'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  IconHistory,
  IconArrowRight,
  IconClock,
  IconUserCheck,
  IconShieldCheck,
  IconSparkles,
  IconArrowsExchange,
  IconAdjustments,
  IconPlus,
  IconTrash,
  IconRefresh,
} from '@tabler/icons-react';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import { ProjectedDietState, AuditTimelineEntry } from '@/lib/eventsourcing/dietProjector';
import { getProjectedDietAction } from '@/app/actions/dietEventActions';

interface ClinicalAuditTimelineProps {
  streamId: string;
  onTimeTravelChange?: (version: number | null) => void;
  className?: string;
}

export function ClinicalAuditTimeline({
  streamId = 'diet-demo-1',
  onTimeTravelChange,
  className = '',
}: ClinicalAuditTimelineProps) {
  const [projectedState, setProjectedState] = useState<ProjectedDietState | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadStream = (version?: number | null) => {
    startTransition(async () => {
      try {
        const state = await getProjectedDietAction(streamId, version || undefined);
        setProjectedState(state);
      } catch (err) {
        console.error('Error cargando proyección de eventos:', err);
      }
    });
  };

  useEffect(() => {
    loadStream(selectedVersion);
  }, [streamId, selectedVersion]);

  const handleSelectVersion = (version: number) => {
    if (selectedVersion === version) {
      // Desactivar Time Travel y volver a la versión más reciente
      setSelectedVersion(null);
      if (onTimeTravelChange) onTimeTravelChange(null);
    } else {
      setSelectedVersion(version);
      if (onTimeTravelChange) onTimeTravelChange(version);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'DietAssigned':
        return <IconShieldCheck size={16} className="text-purple-600" />;
      case 'FoodSwapped':
        return <IconArrowsExchange size={16} className="text-emerald-600" />;
      case 'ItemQuantityUpdated':
        return <IconAdjustments size={16} className="text-amber-600" />;
      case 'ItemAdded':
        return <IconPlus size={16} className="text-blue-600" />;
      case 'ItemRemoved':
        return <IconTrash size={16} className="text-rose-600" />;
      default:
        return <IconSparkles size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Encabezado del panel de Auditoría */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <IconHistory size={18} className="text-[var(--brand-solid)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Auditoría Clínica Inmutable (Event Sourcing)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="font-mono bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border)]">
            Stream: {streamId}
          </span>
          <button
            onClick={() => loadStream(selectedVersion)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Refrescar stream"
          >
            <IconRefresh size={14} className={isPending ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Banner de Time Travel si se está visualizando un snapshot histórico */}
      {projectedState?.isHistoricalSnapshot && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>Modo Histórico (Time Travel):</strong> Visualizando Versión {projectedState.version} de {projectedState.maxVersionAvailable}.
            </span>
          </div>
          <button
            onClick={() => handleSelectVersion(projectedState.maxVersionAvailable)}
            className="text-[11px] font-semibold text-amber-800 underline hover:text-amber-900 cursor-pointer"
          >
            Volver a Versión Actual (V{projectedState.maxVersionAvailable})
          </button>
        </div>
      )}

      {/* Selector de Línea Temporal (Time Travel Slider / Buttons) */}
      {projectedState && projectedState.maxVersionAvailable > 0 && (
        <div className="bg-[var(--card)] p-3 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Selector de Versión Histórica (CQRS):</span>
            <span className="font-semibold text-[var(--text)]">
              {selectedVersion ? `Versión V${selectedVersion}` : `Versión Actual (V${projectedState.maxVersionAvailable})`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: projectedState.maxVersionAvailable }, (_, i) => i + 1).map((ver) => {
              const isSelected = selectedVersion === ver || (!selectedVersion && ver === projectedState.maxVersionAvailable);
              return (
                <button
                  key={ver}
                  type="button"
                  onClick={() => handleSelectVersion(ver)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[var(--brand-solid)] text-white font-semibold'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  v{ver}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Eventos Cronológicos (Timeline) */}
      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 before:pointer-events-none pl-1">
        {projectedState?.timeline.map((entry) => {
          const isCurrentTarget = selectedVersion === entry.version;
          return (
            <div key={entry.version} className="relative flex items-start gap-3 pl-6 text-xs">
              {/* Nodo en la línea de tiempo */}
              <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>

              <div
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  isCurrentTarget
                    ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {getEventIcon(entry.eventType)}
                    <span className="font-semibold text-slate-800 text-[13px]">
                      {entry.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      v{entry.version}
                    </span>
                    <Badge variant={entry.badge.variant}>{entry.badge.label}</Badge>
                  </div>
                </div>

                <p className="text-slate-600 text-xs mb-2 leading-relaxed">
                  {entry.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono">
                  <div className="flex items-center gap-1 text-slate-600">
                    <IconUserCheck size={12} className="text-emerald-700" />
                    <span>{entry.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconClock size={12} />
                    <span>{new Date(entry.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(!projectedState || projectedState.timeline.length === 0) && (
          <div className="p-6 text-center text-xs text-slate-400">
            No se han registrado eventos para esta pauta clínica aún.
          </div>
        )}
      </div>
    </div>
  );
}
