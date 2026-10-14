'use client';

import React, { useState } from 'react';
import { DigestiveSymptomLog, BristolStoolType } from '@/types/diet';
import { MOCK_DIGESTIVE_LOGS } from '@/lib/services/clinicalRecordsService';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import {
  IconActivity,
  IconPlus,
  IconFlame,
  IconWind,
  IconBatteryCharging,
  IconTag,
  IconCheck,
  IconX,
  IconNotes,
  IconSparkles,
} from '@tabler/icons-react';

interface DigestiveSymptomTrackerProps {
  clientId?: string;
  initialLogs?: DigestiveSymptomLog[];
}

export const BRISTOL_DESCRIPTIONS: Record<
  BristolStoolType,
  { label: string; condition: string; status: 'critical' | 'warning' | 'optimal'; color: string }
> = {
  1: {
    label: 'Tipo 1: Trozos duros separados (como nueces)',
    condition: 'Estreñimiento Severo',
    status: 'critical',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  2: {
    label: 'Tipo 2: Forma de salchicha pero grumosa',
    condition: 'Estreñimiento Leve',
    status: 'warning',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  3: {
    label: 'Tipo 3: Con grietas en la superficie',
    condition: 'Tránsito Normal',
    status: 'optimal',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  4: {
    label: 'Tipo 4: Suave, blanda y lisa (ideal)',
    condition: 'Tránsito Óptimo (Patrón Oro)',
    status: 'optimal',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  5: {
    label: 'Tipo 5: Trozos de masa pastosa con bordes definidos',
    condition: 'Falta de Fibra Soluble',
    status: 'warning',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  6: {
    label: 'Tipo 6: Pastosa con bordes irregulares y deshechos',
    condition: 'Tránsito Acelerado / Tendencia Diarreica',
    status: 'warning',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  7: {
    label: 'Tipo 7: Acuosa, totalmente líquida sin sólidos',
    condition: 'Diarrea Severa / Malabsorción',
    status: 'critical',
    color: 'text-red-700 bg-red-50 border-red-200',
  },
};

export const DigestiveSymptomTracker: React.FC<DigestiveSymptomTrackerProps> = ({
  clientId = 'client-1',
  initialLogs = MOCK_DIGESTIVE_LOGS,
}) => {
  const [logs, setLogs] = useState<DigestiveSymptomLog[]>(initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo log semanal
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split('T')[0],
    bloatingScore: 1,
    refluxScore: 0,
    bristolStoolType: 4 as BristolStoolType,
    chronicFatigueScore: 1,
    notes: '',
    tags: 'Buena tolerancia, Fibra equilibrada',
  });

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: DigestiveSymptomLog = {
      id: `symptom-${Date.now()}`,
      clientId,
      weekStartDate: formData.weekStartDate,
      evaluationDate: new Date().toISOString().split('T')[0],
      bloatingScore: Number(formData.bloatingScore),
      refluxScore: Number(formData.refluxScore),
      bristolStoolType: formData.bristolStoolType,
      chronicFatigueScore: Number(formData.chronicFatigueScore),
      notes: formData.notes,
      correlationTags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setLogs((prev) => [newLog, ...prev]);
    setIsModalOpen(false);
  };

  const latestLog = logs[0];

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          CABECERA Y ACCIÓN DE NUEVO REGISTRO
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-[12px] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)] shrink-0">
            <IconActivity size={20} stroke={1.75} />
          </div>
          <div>
            <h2 className="text-[15px] font-[500] text-[var(--text)]">
              Gestor de Síntomas, Tránsito y Digestiones
            </h2>
            <div className="text-[12px] text-[var(--text-secondary)]">
              Monitoreo longitudinal de inflamación, reflujo, fatiga y Escala de Bristol para ajustar la prescripción dietética.
            </div>
          </div>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-[32px] text-[12px]">
          <IconPlus size={14} />
          <span>Registrar Semana</span>
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RESUMEN DE LA ÚLTIMA EVALUACIÓN (SCORECARD)
          ───────────────────────────────────────────────────────────── */}
      {latestLog && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Inflamación / Bloating */}
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-[500]">
                <IconWind size={14} className="text-amber-500" /> Inflamación
              </span>
              <span className="font-mono text-[10px]">Escala 0-5</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[24px] font-[500] font-mono ${
                  latestLog.bloatingScore >= 3 ? 'text-[var(--danger-text)]' : 'text-[var(--text)]'
                }`}
              >
                {latestLog.bloatingScore}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {latestLog.bloatingScore === 0
                  ? 'Sin distensión'
                  : latestLog.bloatingScore <= 2
                  ? 'Mínima / normal'
                  : 'Distensión acusada'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  latestLog.bloatingScore <= 1
                    ? 'bg-[var(--success-text)]'
                    : latestLog.bloatingScore <= 3
                    ? 'bg-[var(--warning-text)]'
                    : 'bg-[var(--danger-text)]'
                }`}
                style={{ width: `${(latestLog.bloatingScore / 5) * 100}%` }}
              />
            </div>
          </Card>

          {/* Reflujo Gastroesofágico */}
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-[500]">
                <IconFlame size={14} className="text-orange-500" /> Reflujo
              </span>
              <span className="font-mono text-[10px]">Escala 0-5</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[24px] font-[500] font-mono ${
                  latestLog.refluxScore >= 3 ? 'text-[var(--danger-text)]' : 'text-[var(--text)]'
                }`}
              >
                {latestLog.refluxScore}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {latestLog.refluxScore === 0 ? 'Sin pirosis' : 'Molestia esofágica'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  latestLog.refluxScore === 0
                    ? 'bg-[var(--success-text)]'
                    : latestLog.refluxScore <= 2
                    ? 'bg-[var(--warning-text)]'
                    : 'bg-[var(--danger-text)]'
                }`}
                style={{ width: `${(latestLog.refluxScore / 5) * 100}%` }}
              />
            </div>
          </Card>

          {/* Escala de Bristol */}
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="font-[500]">Escala de Bristol</span>
              <Badge
                variant={
                  latestLog.bristolStoolType === 3 || latestLog.bristolStoolType === 4
                    ? 'success'
                    : 'warning'
                }
              >
                Tipo {latestLog.bristolStoolType}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-[500] font-mono text-[var(--text)]">
                Tipo {latestLog.bristolStoolType}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">
              {BRISTOL_DESCRIPTIONS[latestLog.bristolStoolType]?.condition}
            </div>
          </Card>

          {/* Fatiga Crónica / Energía */}
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-[500]">
                <IconBatteryCharging size={14} className="text-emerald-500" /> Fatiga
              </span>
              <span className="font-mono text-[10px]">Escala 0-5</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[24px] font-[500] font-mono ${
                  latestLog.chronicFatigueScore >= 3 ? 'text-[var(--danger-text)]' : 'text-[var(--text)]'
                }`}
              >
                {latestLog.chronicFatigueScore}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {latestLog.chronicFatigueScore <= 1 ? 'Alta energía' : 'Cansancio moderado'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  latestLog.chronicFatigueScore <= 1
                    ? 'bg-[var(--success-text)]'
                    : 'bg-[var(--warning-text)]'
                }`}
                style={{ width: `${(latestLog.chronicFatigueScore / 5) * 100}%` }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HISTORIAL SEMANAL COMPARATIVO (TIMELINE)
          ───────────────────────────────────────────────────────────── */}
      <Card noPadding className="overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] bg-[var(--card-subtle)] flex items-center justify-between">
          <span className="text-[13px] font-[500] text-[var(--text)]">
            Registro Histórico Semana a Semana
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            {logs.length} evaluaciones registradas
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {logs.map((log) => {
            const bristolMeta = BRISTOL_DESCRIPTIONS[log.bristolStoolType];
            return (
              <div key={log.id} className="p-4 space-y-3 hover:bg-[var(--card-subtle)]/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-[500] text-[var(--text)]">
                      Semana del {log.weekStartDate}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                      (Evaluada: {log.evaluationDate})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-[var(--text-secondary)]">Bristol:</span>
                    <Badge variant={bristolMeta?.status === 'optimal' ? 'success' : 'warning'}>
                      {bristolMeta?.condition}
                    </Badge>
                  </div>
                </div>

                {/* Métricas de la semana */}
                <div className="grid grid-cols-4 gap-2 text-[12px] bg-[var(--card-subtle)] p-2 rounded-[6px] border border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block">Inflamación</span>
                    <span className="font-mono font-[500] text-[var(--text)]">
                      {log.bloatingScore} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block">Reflujo</span>
                    <span className="font-mono font-[500] text-[var(--text)]">
                      {log.refluxScore} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block">Tipo Bristol</span>
                    <span className="font-mono font-[500] text-[var(--text)]">
                      Tipo {log.bristolStoolType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] block">Fatiga</span>
                    <span className="font-mono font-[500] text-[var(--text)]">
                      {log.chronicFatigueScore} / 5
                    </span>
                  </div>
                </div>

                {/* Notas clínicas */}
                {log.notes && (
                  <p className="text-[12px] text-[var(--text)] leading-relaxed">
                    {log.notes}
                  </p>
                )}

                {/* Tags de correlación con la dieta */}
                {log.correlationTags && log.correlationTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <IconTag size={12} className="text-[var(--text-secondary)]" />
                    {log.correlationTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--neutral-bg)] text-[var(--neutral-text)] border border-[var(--border)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          MODAL REGISTRO SEMANAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <IconActivity className="text-[var(--brand-solid)]" size={20} />
                <h3 className="text-[15px] font-[500] text-[var(--text)]">
                  Registro de Síntomas y Digestiones
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Semana evaluada (Fecha de inicio)
                </label>
                <input
                  type="date"
                  required
                  value={formData.weekStartDate}
                  onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              {/* Sliders de Síntomas */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    <span>Nivel de Inflamación / Distensión (0: Ninguna, 5: Muy severa)</span>
                    <span className="font-mono text-[var(--brand-solid)] font-bold">{formData.bloatingScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={formData.bloatingScore}
                    onChange={(e) => setFormData({ ...formData, bloatingScore: parseInt(e.target.value) })}
                    className="w-full accent-[var(--brand-solid)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    <span>Reflujo / Acidez Esofágica (0: Ninguno, 5: Frecuente/incapacitante)</span>
                    <span className="font-mono text-[var(--brand-solid)] font-bold">{formData.refluxScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={formData.refluxScore}
                    onChange={(e) => setFormData({ ...formData, refluxScore: parseInt(e.target.value) })}
                    className="w-full accent-[var(--brand-solid)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    <span>Fatiga Crónica / Nivel de Cansancio (0: Vital, 5: Extenuación)</span>
                    <span className="font-mono text-[var(--brand-solid)] font-bold">{formData.chronicFatigueScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={formData.chronicFatigueScore}
                    onChange={(e) => setFormData({ ...formData, chronicFatigueScore: parseInt(e.target.value) })}
                    className="w-full accent-[var(--brand-solid)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Selector de la Escala de Bristol */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)]">
                  Escala de Heces de Bristol
                </label>
                <select
                  value={formData.bristolStoolType}
                  onChange={(e) => setFormData({ ...formData, bristolStoolType: parseInt(e.target.value) as BristolStoolType })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px] cursor-pointer"
                >
                  {([1, 2, 3, 4, 5, 6, 7] as BristolStoolType[]).map((type) => (
                    <option key={type} value={type}>
                      {BRISTOL_DESCRIPTIONS[type].label} — {BRISTOL_DESCRIPTIONS[type].condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags de correlación */}
              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Etiquetas de Correlación Dietética (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. Legumbres, Lácteos, FODMAPs, Avena"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Notas Clínicas y Feedback del Paciente
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe cómo se ha sentido el paciente con la dieta asignada..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <IconCheck size={14} />
                  <span>Guardar Registro</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
