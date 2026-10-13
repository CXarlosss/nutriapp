'use client';

import React, { useState } from 'react';
import { useDietStore } from '@/lib/stores/useDietStore';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconExternalLink,
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
  IconSparkles,
  IconScale,
  IconBook,
} from '@tabler/icons-react';
import { Badge, Button } from '@/components/ui/nutri-ui';

export const ClinicalAuditScorecard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    items,
    clientWeightKg,
    setClientWeightKg,
    clientProfileType,
    setClientProfileType,
    getClinicalAudit,
    addItemToSlot,
  } = useDietStore();

  // Evaluación en tiempo real memorizada (60 FPS)
  const audit = getClinicalAudit();

  return (
    <aside
      className={`transition-all duration-300 bg-[var(--card)] border-l border-[var(--border)] shrink-0 flex flex-col justify-between z-20 ${
        isOpen ? 'w-[340px]' : 'w-[48px]'
      }`}
    >
      {/* Botón de alternar colapso */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-subtle)]">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <IconShieldCheck size={18} className="text-[var(--brand-solid)]" stroke={1.5} />
            <span className="text-[13px] font-[500] text-[var(--text)]">Copiloto Científico CDSS</span>
          </div>
        ) : (
          <div className="mx-auto" title="Abrir Copiloto Científico">
            <IconShieldCheck size={18} className="text-[var(--brand-solid)]" stroke={1.5} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-[var(--card)] text-[var(--text-secondary)] transition-colors cursor-pointer"
          title={isOpen ? 'Colapsar panel' : 'Expandir panel'}
        >
          {isOpen ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Ajuste del perfil y peso del cliente */}
          <div className="bg-[var(--card-subtle)] p-3 rounded-[8px] border border-[var(--border)] space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <IconScale size={14} /> Peso del paciente:
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  value={clientWeightKg}
                  onChange={(e) => setClientWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-14 px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-right font-[500] text-[var(--text)] text-[12px]"
                />
                <span className="text-[var(--text-secondary)]">kg</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Perfil clínico:</span>
              <select
                value={clientProfileType}
                onChange={(e) => setClientProfileType(e.target.value as any)}
                className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[12px] font-[500] text-[var(--text)] cursor-pointer"
              >
                <option value="deportista">Deportista (ISSN)</option>
                <option value="sedentario">Sedentario (OMS)</option>
                <option value="general">Población General</option>
              </select>
            </div>
          </div>

          {/* Ratios Clínicos en Vivo */}
          <div className="space-y-2">
            <div className="text-[11px] font-[500] uppercase tracking-wider text-[var(--text-secondary)]">
              Ratios Clínicos en Tiempo Real
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {/* Proteína por kg */}
              <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-secondary)]">Proteína / kg</div>
                <div
                  className={`text-[16px] font-[500] font-mono leading-tight mt-0.5 ${
                    audit.proteinPerKg < (clientProfileType === 'deportista' ? 1.4 : 0.8)
                      ? 'text-[var(--danger-text)]'
                      : 'text-[var(--brand-solid)]'
                  }`}
                >
                  {audit.proteinPerKg} <span className="text-[11px] font-sans font-normal">g/kg</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Ref: {clientProfileType === 'deportista' ? '≥1.4' : '≥0.8'} g/kg
                </div>
              </div>

              {/* Fibra diaria */}
              <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-secondary)]">Fibra media</div>
                <div
                  className={`text-[16px] font-[500] font-mono leading-tight mt-0.5 ${
                    audit.totalFiberAvg < 25 ? 'text-[var(--warning-text)]' : 'text-[var(--success-text)]'
                  }`}
                >
                  {audit.totalFiberAvg} <span className="text-[11px] font-sans font-normal">g/día</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Ref: ≥25 g/día (EFSA)</div>
              </div>

              {/* Calcio */}
              <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-secondary)]">Calcio medio</div>
                <div className="text-[15px] font-[500] font-mono leading-tight mt-0.5 text-[var(--text)]">
                  {audit.totalCalciumAvg} <span className="text-[11px] font-sans font-normal">mg</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Ref: ≥950 mg/día</div>
              </div>

              {/* Ratio Omega 6:3 */}
              <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-secondary)]">Ratio Omega 3/6</div>
                <div className="text-[15px] font-[500] font-mono leading-tight mt-0.5 text-[var(--text)]">
                  {audit.omega3_6_ratio}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Simopoulos 2006</div>
              </div>
            </div>
          </div>

          {/* Estado de Aprobación Científica */}
          <div>
            {audit.hasCriticalBlocker ? (
              <div className="p-3 rounded-[8px] bg-[var(--danger-bg)] border border-[var(--danger-text)]/30 text-[var(--danger-text)] text-[12px] space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-[500]">
                  <IconAlertCircle size={16} />
                  <span>Alerta Crítica: Protocolo no conforme</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  La estructura no alcanza los requerimientos mínimos de la literatura médica para el perfil del cliente.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-[8px] bg-[var(--success-bg)] border border-[var(--success-text)]/30 text-[var(--success-text)] text-[12px] space-y-1">
                <div className="flex items-center gap-1.5 font-[500]">
                  <IconShieldCheck size={16} />
                  <span>Dieta con respaldo clínico completo</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Todos los umbrales de macronutrientes y micronutrientes se encuentran dentro de las directrices de la ISSN y OMS.
                </p>
              </div>
            )}
          </div>

          {/* Listado de Auditorías y Papers con DOI */}
          <div className="space-y-2">
            <div className="text-[11px] font-[500] uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
              <span>Evidencia y Consensos</span>
              <IconBook size={14} />
            </div>

            <div className="space-y-2">
              {audit.evaluations.map((ev, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-[8px] border text-[12px] space-y-1.5 transition-colors ${
                    ev.status === 'critical'
                      ? 'bg-[var(--danger-bg)] border-[var(--danger-text)]/30 text-[var(--danger-text)]'
                      : ev.status === 'warning'
                      ? 'bg-[var(--warning-bg)] border-[var(--warning-text)]/30 text-[var(--warning-text)]'
                      : 'bg-[var(--card-subtle)] border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-[500] text-[12px] leading-tight">
                      {ev.guideline.title}
                    </span>
                    <Badge
                      variant={
                        ev.status === 'optimal' ? 'success' : ev.status === 'critical' ? 'danger' : 'warning'
                      }
                    >
                      {ev.status === 'optimal' ? 'Conforme' : ev.status === 'critical' ? 'Bloqueo' : 'Aviso'}
                    </Badge>
                  </div>

                  {!ev.passed && (
                    <p className="text-[11px] leading-relaxed opacity-95">
                      {ev.guideline.warning_message}
                    </p>
                  )}

                  {/* Enlace al DOI */}
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <a
                      href={ev.guideline.doi_reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-[400] hover:opacity-80"
                      title="Ver paper científico en repositorio oficial"
                    >
                      <span>DOI: {ev.guideline.doi_reference.replace('https://doi.org/', '')}</span>
                      <IconExternalLink size={12} />
                    </a>
                    <span className="font-mono text-[10px] opacity-80">
                      Actual: {ev.currentValue} {ev.guideline.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complementos y Alimentos Sugeridos */}
          {audit.suggestedFoods.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-[11px] font-[500] uppercase tracking-wider text-[var(--brand-solid)]">
                <IconSparkles size={14} />
                <span>Complementos Sugeridos</span>
              </div>

              <div className="space-y-1.5">
                {audit.suggestedFoods.map((sug, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-[8px] bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[12px] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-[500] text-[var(--brand-text)] truncate">{sug.foodName}</div>
                      <div className="text-[10px] text-[var(--brand-text)]/80 truncate">{sug.richnessLabel}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // Añadir sugerencia a Comida del Día 1
                        addItemToSlot(1, 'comida', {
                          id: `sug-${Date.now()}`,
                          name: sug.foodName,
                          category: sug.category,
                          kcal: sug.nutrient === 'Proteína' ? 120 : 150,
                          protein_g: sug.nutrient === 'Proteína' ? 25 : 5,
                          carbs_g: sug.nutrient === 'Fibra' ? 30 : 0,
                          fat_g: 1,
                          default_unit: 'g',
                        }, sug.defaultGrams);
                      }}
                      className="h-6 px-2 rounded-[6px] bg-[var(--brand-solid)] text-white text-[11px] font-[500] inline-flex items-center gap-0.5 hover:opacity-90 shrink-0 cursor-pointer"
                      title={`Añadir ${sug.defaultGrams}g a la comida`}
                    >
                      <IconPlus size={12} />
                      <span>+{sug.defaultGrams}g</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
