'use client';

import React, { useState } from 'react';
import {
  PatientMedication,
  DrugNutrientInteractionAlert,
  DietItem,
  MealSlotType,
} from '@/types/diet';
import {
  MOCK_MEDICATIONS,
  auditDrugNutrientInteractions,
} from '@/lib/services/clinicalRecordsService';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import {
  IconPill,
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconPlus,
  IconExternalLink,
  IconClock,
  IconShield,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';

interface MedicationInteractionsPanelProps {
  clientId?: string;
  initialMedications?: PatientMedication[];
  dietItems?: DietItem[];
}

// Ítems de dieta por defecto para probar y demostrar la detección inmediata de interacciones
const DEMO_TEST_DIET_ITEMS: DietItem[] = [
  {
    id: 'demo-item-soja',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'desayuno',
    position: 0,
    foodId: 'f-soja',
    foodName: 'Bebida de Soja Enriquecida con Calcio',
    quantity: 250,
    unit: 'ml',
    kcal: 110,
    proteinG: 8.0,
    carbsG: 6.0,
    fatG: 4.5,
    fiberG: 1.2,
    calciumMg: 300,
    ironMg: 1.5,
  },
  {
    id: 'demo-item-avena-fibra',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'desayuno',
    position: 1,
    foodId: 'f-avena',
    foodName: 'Salvado de Avena Integral Concentrado',
    quantity: 60,
    unit: 'g',
    kcal: 210,
    proteinG: 10.0,
    carbsG: 38.0,
    fatG: 4.0,
    fiberG: 9.5, // >8g genera alerta de interferencia
    calciumMg: 40,
    ironMg: 3.2,
  },
  {
    id: 'demo-item-comida',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'comida',
    position: 0,
    foodId: 'f-pollo',
    foodName: 'Pechuga de pollo con arroz basmati',
    quantity: 180,
    unit: 'g',
    kcal: 450,
    proteinG: 45.0,
    carbsG: 50.0,
    fatG: 5.0,
    fiberG: 2.0,
  },
];

export const MedicationInteractionsPanel: React.FC<MedicationInteractionsPanelProps> = ({
  clientId = 'client-1',
  initialMedications = MOCK_MEDICATIONS,
  dietItems = DEMO_TEST_DIET_ITEMS,
}) => {
  const [medications, setMedications] = useState<PatientMedication[]>(initialMedications);
  const [testItems, setTestItems] = useState<DietItem[]>(dietItems);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo fármaco
  const [formData, setFormData] = useState({
    drugName: 'Atorvastatina',
    activeIngredient: 'Atorvastatin Calcium',
    dosage: '20 mg',
    timingSlot: 'cena' as MealSlotType,
    indication: 'Hipercolesterolemia familiar / Prevención cardiovascular',
    interactionsNotes: 'Evitar consumo simultáneo de pomelo o toronja (inhibición de CYP3A4).',
  });

  // Evaluación en tiempo real de interacciones (CDSS)
  const activeAlerts = auditDrugNutrientInteractions(testItems, medications);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: PatientMedication = {
      id: `med-${Date.now()}`,
      clientId,
      drugName: formData.drugName,
      activeIngredient: formData.activeIngredient,
      dosage: formData.dosage,
      timingSlot: formData.timingSlot,
      indication: formData.indication,
      interactionsNotes: formData.interactionsNotes,
      active: true,
    };
    setMedications((prev) => [...prev, newMed]);
    setIsModalOpen(false);
  };

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  // Acciones rápidas para simular conflictos en tiempo real
  const addConflictFood = (type: 'soja' | 'fibra' | 'pomelo') => {
    let newItem: DietItem;
    if (type === 'soja') {
      newItem = {
        id: `item-soja-${Date.now()}`,
        dietId: 'diet-demo-1',
        dayIndex: 1,
        mealSlot: 'desayuno',
        position: 0,
        foodId: 'f-soja-demo',
        foodName: 'Tofu firme marinado en soja',
        quantity: 150,
        unit: 'g',
        kcal: 180,
        proteinG: 22,
        carbsG: 3,
        fatG: 9,
      };
    } else if (type === 'fibra') {
      newItem = {
        id: `item-fibra-${Date.now()}`,
        dietId: 'diet-demo-1',
        dayIndex: 1,
        mealSlot: 'desayuno',
        position: 1,
        foodId: 'f-fibra-demo',
        foodName: 'Bolo de Chía y Salvado Puro (10g Fibra)',
        quantity: 40,
        unit: 'g',
        kcal: 140,
        proteinG: 6,
        carbsG: 12,
        fatG: 8,
        fiberG: 10.2,
      };
    } else {
      newItem = {
        id: `item-pomelo-${Date.now()}`,
        dietId: 'diet-demo-1',
        dayIndex: 1,
        mealSlot: 'cena',
        position: 0,
        foodId: 'f-pomelo-demo',
        foodName: 'Zumo de Pomelo Natural',
        quantity: 200,
        unit: 'ml',
        kcal: 80,
        proteinG: 1,
        carbsG: 18,
        fatG: 0,
      };
    }
    setTestItems((prev) => [...prev, newItem]);
  };

  const clearConflictFoods = () => {
    setTestItems(
      testItems.filter(
        (it) =>
          !it.foodName.toLowerCase().includes('soja') &&
          !it.foodName.toLowerCase().includes('tofu') &&
          !it.foodName.toLowerCase().includes('salvado') &&
          !it.foodName.toLowerCase().includes('chía') &&
          !it.foodName.toLowerCase().includes('pomelo')
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          CABECERA Y ESTADO DEL AUDITOR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-[12px] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)] shrink-0">
            <IconPill size={20} stroke={1.75} />
          </div>
          <div>
            <h2 className="text-[15px] font-[500] text-[var(--text)]">
              Farmacoterapia y Alertas Fármaco-Nutriente
            </h2>
            <div className="text-[12px] text-[var(--text-secondary)]">
              Detección de interferencias absortivas, quelación mineral y antagonismo enzimático con la dieta en la misma franja horaria.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-[32px] text-[12px]">
            <IconPlus size={14} />
            <span>Añadir Fármaco</span>
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL DE ALERTAS ACTIVAS DETECTADAS EN LA DIETA
          ───────────────────────────────────────────────────────────── */}
      <div>
        {activeAlerts.length === 0 ? (
          <div className="p-4 rounded-[12px] bg-[var(--success-bg)] border border-[var(--success-text)]/30 text-[var(--success-text)] flex items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <IconCheck size={20} className="shrink-0" />
              <div>
                <span className="font-[500] block">Sin conflictos fármaco-nutriente</span>
                <span className="text-[12px] opacity-90">
                  La distribución horaria de comidas no interfiere con la biodisponibilidad de los medicamentos activos.
                </span>
              </div>
            </div>
            <Badge variant="success">Seguro</Badge>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-[500] text-[var(--text)] flex items-center gap-2">
                <IconAlertTriangle className="text-[var(--danger-text)]" size={18} />
                <span>Interacciones Detectadas ({activeAlerts.length})</span>
              </span>
              <div className="flex items-center gap-2">
                {criticalCount > 0 && <Badge variant="danger">{criticalCount} Crítico(s)</Badge>}
                {warningCount > 0 && <Badge variant="warning">{warningCount} Advertencia(s)</Badge>}
              </div>
            </div>

            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-[12px] border text-[13px] space-y-2 transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-[var(--danger-bg)] border-[var(--danger-text)]/35 text-[var(--danger-text)] shadow-xs'
                      : 'bg-[var(--warning-bg)] border-[var(--warning-text)]/35 text-[var(--warning-text)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {alert.severity === 'critical' ? (
                        <IconAlertCircle size={18} className="shrink-0 text-[var(--danger-text)]" />
                      ) : (
                        <IconAlertTriangle size={18} className="shrink-0 text-[var(--warning-text)]" />
                      )}
                      <h4 className="font-[500] text-[14px] leading-tight">
                        {alert.title}
                      </h4>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                      {alert.severity === 'critical' ? 'Bloqueo Crítico' : 'Desfase Requerido'}
                    </Badge>
                  </div>

                  {/* Mecanismo fisiopatológico */}
                  <div className="bg-[var(--card)]/80 p-3 rounded-[8px] border border-[var(--border)] text-[12px] text-[var(--text)] space-y-1">
                    <div className="font-[500] text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                      Mecanismo Biológico y Farmacocinética
                    </div>
                    <p className="leading-relaxed opacity-95">
                      {alert.biologicalMechanism}
                    </p>
                  </div>

                  {/* Recomendación Clínica */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] pt-1">
                    <div className="leading-relaxed font-[500]">
                      <span className="underline">Acción recomendada:</span> {alert.clinicalRecommendation}
                    </div>

                    <a
                      href={alert.doiReference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-[400] text-[11px] shrink-0 hover:opacity-80"
                      title="Ver publicación científica indexada"
                    >
                      <span>DOI: {alert.doiReference.replace('https://doi.org/', '')}</span>
                      <IconExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LISTADO DE MEDICAMENTOS ACTIVOS DEL CLIENTE
          ───────────────────────────────────────────────────────────── */}
      <Card noPadding className="overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] bg-[var(--card-subtle)] flex items-center justify-between">
          <span className="text-[13px] font-[500] text-[var(--text)]">
            Farmacoterapia Activa del Paciente
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            {medications.filter((m) => m.active).length} fármaco(s) en seguimiento
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {medications.map((med) => (
            <div key={med.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-[500] text-[14px] text-[var(--text)]">
                    {med.drugName} ({med.dosage})
                  </span>
                  <Badge variant={med.active ? 'brand' : 'neutral'}>
                    {med.active ? 'Activo' : 'Pausado'}
                  </Badge>
                  <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 font-mono">
                    <IconClock size={13} /> {med.timingSlot}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)]">
                  Principio: <span className="text-[var(--text)]">{med.activeIngredient}</span> • Indicación: <span className="text-[var(--text)]">{med.indication}</span>
                </div>
                {med.interactionsNotes && (
                  <div className="text-[11px] text-amber-700 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200/50 inline-block">
                    ⚠️ {med.interactionsNotes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  onClick={() => toggleMedication(med.id)}
                  className="h-[30px] px-2.5 text-[12px]"
                >
                  {med.active ? 'Pausar' : 'Reanudar'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => removeMedication(med.id)}
                  className="h-[30px] px-2 text-[12px] text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
                  title="Eliminar de la ficha"
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          SIMULADOR INTERACTIVO DE CONFLICTOS DIETÉTICOS (TEST CDSS)
          ───────────────────────────────────────────────────────────── */}
      <Card className="space-y-3 bg-[var(--card-subtle)] border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-[500] text-[var(--text)]">
            <IconSparkles size={16} className="text-[var(--brand-solid)]" />
            <span>Simulador de Evaluación Fármaco-Nutriente en Tiempo Real</span>
          </div>
          <button
            type="button"
            onClick={clearConflictFoods}
            className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] underline cursor-pointer"
          >
            Limpiar alimentos de prueba
          </button>
        </div>

        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          Inyecta alimentos en la franja del desayuno para comprobar cómo el motor CDSS evalúa la quelación molecular de la Levotiroxina (o Atorvastatina) y activa las alertas al instante:
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addConflictFood('soja')}
            className="px-2.5 py-1.5 rounded-[6px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--brand-solid)] text-[12px] font-[500] text-[var(--text)] transition-colors cursor-pointer"
          >
            + Añadir Tofu/Soja en Desayuno (Quelación Crítica)
          </button>
          <button
            type="button"
            onClick={() => addConflictFood('fibra')}
            className="px-2.5 py-1.5 rounded-[6px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--brand-solid)] text-[12px] font-[500] text-[var(--text)] transition-colors cursor-pointer"
          >
            + Añadir Bolo Fibra &gt;8g en Desayuno (Interferencia)
          </button>
          <button
            type="button"
            onClick={() => addConflictFood('pomelo')}
            className="px-2.5 py-1.5 rounded-[6px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--brand-solid)] text-[12px] font-[500] text-[var(--text)] transition-colors cursor-pointer"
          >
            + Añadir Zumo de Pomelo (Inhibición CYP3A4)
          </button>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          MODAL AÑADIR NUEVO FÁRMACO
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <IconPill className="text-[var(--brand-solid)]" size={20} />
                <h3 className="text-[15px] font-[500] text-[var(--text)]">
                  Registrar Fármaco del Paciente
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

            <form onSubmit={handleAddMedication} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Nombre del Medicamento
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.drugName}
                    onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Dosis Prescrita
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 75 mcg / 20 mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Principio Activo
                </label>
                <input
                  type="text"
                  required
                  value={formData.activeIngredient}
                  onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Franja Horaria de Administración
                  </label>
                  <select
                    value={formData.timingSlot}
                    onChange={(e) => setFormData({ ...formData, timingSlot: e.target.value as MealSlotType })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px] cursor-pointer"
                  >
                    <option value="desayuno">Desayuno / Ayunas mañana</option>
                    <option value="media_manana">Media Mañana</option>
                    <option value="comida">Comida</option>
                    <option value="merienda">Merienda</option>
                    <option value="cena">Cena / Noche</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Indicación Clínica
                  </label>
                  <input
                    type="text"
                    value={formData.indication}
                    onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Instrucciones Clínicas e Interacciones Conocidas
                </label>
                <textarea
                  rows={2}
                  value={formData.interactionsNotes}
                  onChange={(e) => setFormData({ ...formData, interactionsNotes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <IconCheck size={14} />
                  <span>Guardar Fármaco</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
