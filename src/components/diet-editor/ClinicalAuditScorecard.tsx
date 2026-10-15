'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  IconPill,
  IconX,
  IconToolsKitchen2,
} from '@tabler/icons-react';
import { Badge, Button } from '@/components/ui/nutri-ui';
import { RecipeBankPanel } from './RecipeBankPanel';

export const ClinicalAuditScorecard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipes' | 'cdss'>('recipes');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
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
      <div className="p-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-subtle)]">
        {isOpen ? (
          <div className="flex items-center gap-2">
            {activeTab === 'recipes' ? (
              <>
                <IconToolsKitchen2 size={18} className="text-purple-600 dark:text-purple-400" stroke={1.5} />
                <span className="text-[13px] font-[600] text-[var(--text)]">Banco de Platos (Lego)</span>
              </>
            ) : (
              <>
                <IconShieldCheck size={18} className="text-[var(--brand-solid)]" stroke={1.5} />
                <span className="text-[13px] font-[600] text-[var(--text)]">Copiloto Clínico CDSS</span>
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto" title="Abrir Copiloto / Banco de Platos">
            <IconToolsKitchen2 size={18} className="text-purple-600 dark:text-purple-400" stroke={1.5} />
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
        <>
          {/* Segmented Switcher de Pestañas: Banco de Platos vs CDSS */}
          <div className="flex border-b border-[var(--border)] p-1.5 bg-[var(--card-subtle)] gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card)]'
              }`}
            >
              <IconToolsKitchen2 size={13} />
              <span>Platos (Lego)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cdss')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'cdss'
                  ? 'bg-[var(--brand-solid)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card)]'
              }`}
            >
              <IconShieldCheck size={13} />
              <span>CDSS Clínico</span>
            </button>
          </div>

          {activeTab === 'recipes' ? (
            <div className="flex-1 overflow-hidden">
              <RecipeBankPanel />
            </div>
          ) : (
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
                  className="w-14 px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-right font-[600] text-[var(--text)] text-[12px] tabular-nums font-mono raw-metric"
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
                  className={`text-[16px] font-[600] font-mono tabular-nums raw-metric leading-tight mt-0.5 ${
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
                  className={`text-[16px] font-[600] font-mono tabular-nums raw-metric leading-tight mt-0.5 ${
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
                <div className="text-[15px] font-[600] font-mono tabular-nums raw-metric leading-tight mt-0.5 text-[var(--text)]">
                  {audit.totalCalciumAvg} <span className="text-[11px] font-sans font-normal">mg</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Ref: ≥950 mg/día</div>
              </div>

              {/* Ratio Omega 6:3 */}
              <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-secondary)]">Ratio Omega 3/6</div>
                <div className="text-[15px] font-[600] font-mono tabular-nums raw-metric leading-tight mt-0.5 text-[var(--text)]">
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

          {/* Alertas Fármaco-Nutriente (CDSS) */}
          {audit.drugNutrientAlerts && audit.drugNutrientAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-[500] uppercase tracking-wider text-[var(--danger-text)] flex items-center justify-between">
                <span>Alertas Fármaco-Nutriente ({audit.drugNutrientAlerts.length})</span>
                <IconPill size={14} />
              </div>

              <div className="space-y-2">
                {audit.drugNutrientAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAlert(alert)}
                    data-testid={`cdss-alert-card-${alert.id}`}
                    className={`p-2.5 rounded-[8px] border text-[12px] space-y-1.5 transition-colors cursor-pointer select-none ${
                      alert.severity === 'critical'
                        ? 'bg-[var(--danger-bg)] border-[var(--danger-text)]/30 text-[var(--danger-text)]'
                        : 'bg-[var(--warning-bg)] border-[var(--warning-text)]/30 text-[var(--warning-text)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-[500] text-[12px] leading-tight">
                        {alert.drugName} ↔ {alert.conflictingFoodName}
                      </span>
                      <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                        {alert.conflictingSlot}
                      </Badge>
                    </div>

                    <p className="text-[11px] leading-relaxed opacity-95">
                      {alert.biologicalMechanism}
                    </p>

                    <div className="text-[11px] font-[500] opacity-90">
                      💡 {alert.clinicalRecommendation}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] font-mono opacity-80 flex items-center gap-1">
                        🔍 Clic para ampliar evidencia
                      </span>
                      <span className="text-[10px] underline opacity-80">
                        DOI: {alert.doiReference.replace('https://doi.org/', '')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
    </>
  )}

      {/* Modal de Detalle de Alerta Fármaco-Nutriente con Transición de Origen (Shared Layout) */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.65, x: 80, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, x: 40, filter: 'blur(2px)' }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 26,
                mass: 0.85,
              }}
              style={{ transformOrigin: 'center right' }}
              onClick={(e) => e.stopPropagation()}
              data-testid="cdss-alert-evidence-modal"
              className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <IconPill size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--text)]">
                      Interacción Fármaco-Nutriente Detectada
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {selectedAlert.drugName} ↔ {selectedAlert.conflictingFoodName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="close-alert-modal-btn"
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[var(--card-subtle)] rounded-xl border border-[var(--border)] space-y-1">
                  <span className="font-mono text-[10px] uppercase text-slate-400">Franja Horaria en Conflicto</span>
                  <div className="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Badge variant={selectedAlert.severity === 'critical' ? 'danger' : 'warning'}>
                      {selectedAlert.conflictingSlot}
                    </Badge>
                    <span>Severidad: {selectedAlert.severity === 'critical' ? 'Crítica (Bloqueo de absorción)' : 'Moderada'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-slate-400">Mecanismo Farmacocinético</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    {selectedAlert.biologicalMechanism}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">💡 Recomendación Clínica Accionable</span>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    {selectedAlert.clinicalRecommendation}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                  <a
                    href={selectedAlert.doiReference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--brand-solid)] underline"
                  >
                    <span>Paper Indexado (DOI: {selectedAlert.doiReference.replace('https://doi.org/', '')})</span>
                    <IconExternalLink size={12} />
                  </a>

                  <Button
                    variant="secondary"
                    className="h-7 px-3 text-xs"
                    onClick={() => setSelectedAlert(null)}
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
