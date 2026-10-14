'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconLeaf,
  IconCheck,
  IconCircleCheck,
  IconAlertCircle,
  IconUser,
  IconScale,
  IconClock,
  IconPill,
  IconActivity,
  IconHeartbeat,
  IconX,
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
  IconSparkles,
} from '@tabler/icons-react';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import { submitPreConsultationAction, getOnboardingPatientAction } from '@/app/actions/onboardingActions';
import { PreConsultationFormData, BristolStoolType } from '@/types/diet';
import { BRISTOL_DESCRIPTIONS } from '@/components/clients/DigestiveSymptomTracker';

interface PreConsultaPageProps {
  params: Promise<{ token: string }>;
}

const COMMON_ALLERGIES = [
  'Gluten',
  'Lactosa',
  'Proteína de leche (PLV)',
  'Frutos secos',
  'Cacahuetes',
  'Huevo',
  'Soja',
  'Pescado',
  'Marisco',
  'Fructosa / Sorbitol',
  'Histamina',
];

const COMMON_PATHOLOGIES = [
  'Hipotiroidismo de Hashimoto',
  'Resistencia a la Insulina',
  'Diabetes Tipo 2',
  'Síndrome de Intestino Irritable (SII)',
  'Hipertensión Arterial',
  'Hipercolesterolemia',
  'Reflujo Gastroesofágico / Gastritis',
  'SOP (Ovario Poliquístico)',
  'Sobrecrecimiento Bacteriano (SIBO)',
  'Enfermedad Inflamatoria Intestinal',
];

const COMMON_AVERSIONS = [
  'Brócoli crudo',
  'Vísceras / Hígado',
  'Pescado blanco hervido',
  'Cilantro',
  'Coliflor',
  'Carne muy grasa',
  'Berenjena',
  'Pimiento crudo',
  'Marisco',
  'Quesos fuertes',
];

export default function PreConsultaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
          <div className="text-[13px] text-[var(--text-secondary)] animate-pulse">
            Cargando tu cuestionario seguro...
          </div>
        </main>
      }
    >
      <PreConsultaContent />
    </Suspense>
  );
}

function PreConsultaContent() {
  const routeParams = useParams();
  const token = (routeParams?.token as string) || '';

  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState('Paciente');
  const [patientEmail, setPatientEmail] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customAversionInput, setCustomAversionInput] = useState('');
  const [customMedDrug, setCustomMedDrug] = useState('');
  const [customMedDose, setCustomMedDose] = useState('');
  const [customMedSlot, setCustomMedSlot] = useState<'desayuno' | 'comida' | 'cena' | 'ayunas_manana' | 'noche'>('desayuno');

  const [formData, setFormData] = useState<PreConsultationFormData>({
    fullName: '',
    email: '',
    phone: '',
    heightCm: 175,
    currentWeightKg: 75,
    goal: 'Recomposición corporal y salud general',
    dietaryPreference: 'omnivoro',
    allergies: [],
    pathologies: [],
    foodAversions: [],
    dailyRoutine: {
      wakeUpTime: '07:30',
      bedTime: '23:30',
      workType: 'Trabajo sedentario de oficina',
      mealsCount: 4,
      trainingSchedule: 'Fuerza 3-4 días a la semana',
      stressLevel: 'Medio',
      waterLitersDaily: 2.0,
    },
    digestiveBaseline: {
      habitualBristol: 4,
      bloatingFrequency: 'Ocasional',
      acidReflux: false,
      digestionNotes: '',
    },
    medications: [],
    generalNotes: '',
  });

  useEffect(() => {
    async function loadPatient() {
      setIsLoading(true);
      try {
        const patient = await getOnboardingPatientAction(token);
        if (patient) {
          setPatientName(patient.fullName);
          setPatientEmail(patient.email);
          setFormData((prev) => ({
            ...prev,
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone || '',
            heightCm: patient.formData?.heightCm || 175,
            currentWeightKg: patient.formData?.currentWeightKg || 75,
            goal: patient.formData?.goal || prev.goal,
            allergies: patient.formData?.allergies || [],
            pathologies: patient.formData?.pathologies || [],
            foodAversions: patient.formData?.foodAversions || [],
            dailyRoutine: { ...prev.dailyRoutine, ...patient.formData?.dailyRoutine },
            digestiveBaseline: { ...prev.digestiveBaseline, ...patient.formData?.digestiveBaseline },
            medications: patient.formData?.medications || [],
          }));
        }
      } catch (err) {
        console.error('Error cargando paciente:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPatient();
  }, [token]);

  const toggleAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const togglePathology = (path: string) => {
    setFormData((prev) => ({
      ...prev,
      pathologies: prev.pathologies.includes(path)
        ? prev.pathologies.filter((p) => p !== path)
        : [...prev.pathologies, path],
    }));
  };

  const toggleAversion = (aversion: string) => {
    setFormData((prev) => ({
      ...prev,
      foodAversions: prev.foodAversions.includes(aversion)
        ? prev.foodAversions.filter((a) => a !== aversion)
        : [...prev.foodAversions, aversion],
    }));
  };

  const addCustomAversion = () => {
    if (!customAversionInput.trim()) return;
    if (!formData.foodAversions.includes(customAversionInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        foodAversions: [...prev.foodAversions, customAversionInput.trim()],
      }));
    }
    setCustomAversionInput('');
  };

  const addMedication = () => {
    if (!customMedDrug.trim()) return;
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          drugName: customMedDrug.trim(),
          dosage: customMedDose.trim() || 'Dosis habitual',
          timingSlot: customMedSlot,
          indication: 'Tratamiento pautado',
        },
      ],
    }));
    setCustomMedDrug('');
    setCustomMedDose('');
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitPreConsultationAction(token, formData);
      if (res.success) {
        setIsSuccess(true);
      } else {
        alert(res.error || 'Ocurrió un error al guardar tu cuestionario.');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-[13px] text-[var(--text-secondary)] animate-pulse">
          Cargando tu cuestionario seguro...
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-[520px] bg-[var(--card)] border border-[var(--border)] rounded-[16px] p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)]">
            <IconCircleCheck size={36} stroke={1.75} />
          </div>

          <div className="space-y-1">
            <h1 className="text-[20px] font-[500] text-[var(--text)]">
              ¡Formulario completado con éxito, {patientName}!
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Tus alergias, patologías, aversiones y rutinas ya se han inyectado en la ficha clínica de tu nutricionista.
            </p>
          </div>

          <div className="bg-[var(--card-subtle)] p-4 rounded-[12px] border border-[var(--border)] text-left text-[12px] space-y-2">
            <div className="font-[500] text-[var(--text)] flex items-center gap-1.5 text-[13px]">
              <IconSparkles size={16} className="text-[var(--brand-solid)]" />
              <span>Cero Data Entry en tu Consulta</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Tu nutricionista tendrá toda tu anamnesis estructurada antes de que empiece tu visita, dedicando el 100% del tiempo a diseñar tu estrategia personalizada.
            </p>
            {formData.allergies.length > 0 && (
              <div className="pt-1 flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-[var(--text-secondary)]">Alergias registradas:</span>
                {formData.allergies.map((a, i) => (
                  <Badge key={i} variant="danger">{a}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link href="/mi-plan">
              <Button variant="primary" className="w-full">
                Acceder a Mi Portal de Paciente
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[640px] bg-[var(--card)] border border-[var(--border)] rounded-[16px] p-5 sm:p-8 space-y-6 shadow-sm">
        {/* Cabecera de la clínica */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)]">
              <IconLeaf size={18} stroke={1.75} />
            </div>
            <div>
              <span className="text-[15px] font-[500] text-[var(--text)] block leading-tight">
                NutriApp Clínica
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Cuestionario Médico Pre-Consulta
              </span>
            </div>
          </div>
          <Badge variant="brand">Paso {currentStep} de 4</Badge>
        </div>

        {/* Bienvenida y progreso */}
        <div className="space-y-1">
          <h1 className="text-[18px] font-[500] text-[var(--text)]">
            Hola, {patientName}. Preparemos tu primera consulta
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            Completa este cuestionario para que tu nutricionista tenga todo tu historial médico y de hábitos antes de tu cita (toma ~3 minutos).
          </p>

          {/* Barra de progreso */}
          <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-[var(--brand-solid)] transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              PASO 1: DATOS ANTROPOMÉTRICOS & RUTINA DIARIA
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[14px] font-[500] text-[var(--text)]">
                <IconScale size={18} className="text-[var(--brand-solid)]" />
                <span>1. Medidas Corporales y Rutinas Diarias</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Peso Actual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.currentWeightKg}
                    onChange={(e) =>
                      setFormData({ ...formData, currentWeightKg: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] font-mono text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.heightCm}
                    onChange={(e) =>
                      setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] font-mono text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Hora Habitual de Despertar
                  </label>
                  <input
                    type="time"
                    value={formData.dailyRoutine.wakeUpTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyRoutine: { ...formData.dailyRoutine, wakeUpTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Hora Habitual de Acostarse
                  </label>
                  <input
                    type="time"
                    value={formData.dailyRoutine.bedTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyRoutine: { ...formData.dailyRoutine, bedTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Actividad Laboral y Nivel de Movimiento
                </label>
                <input
                  type="text"
                  placeholder="ej. Trabajo sentado en ordenador 8h / Docente activo de pie"
                  value={formData.dailyRoutine.workType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyRoutine: { ...formData.dailyRoutine, workType: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Entrenamientos a la Semana
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Gimnasio 4 días a las 18:30"
                    value={formData.dailyRoutine.trainingSchedule}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyRoutine: { ...formData.dailyRoutine, trainingSchedule: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Número de Comidas Habituales
                  </label>
                  <select
                    value={formData.dailyRoutine.mealsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyRoutine: { ...formData.dailyRoutine, mealsCount: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px] cursor-pointer"
                  >
                    <option value={2}>2 comidas (Ayuno intermitente)</option>
                    <option value={3}>3 comidas (Desayuno, Comida, Cena)</option>
                    <option value={4}>4 comidas (+ Merienda o Media mañana)</option>
                    <option value={5}>5 comidas completas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Objetivo Principal de la Consulta
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Recomposición corporal, ganar fuerza, reducir inflamación"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px]"
                />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 2: ALERGIAS, INTOLERANCIAS Y AVERSIONES
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[14px] font-[500] text-[var(--text)]">
                <IconAlertCircle size={18} className="text-[var(--danger-text)]" />
                <span>2. Alergias, Intolerancias y Alimentos Rechazados</span>
              </div>

              {/* Alergias con chips interactivos */}
              <div className="space-y-2">
                <label className="block text-[12px] font-[500] text-[var(--text)]">
                  Alergias o Intolerancias Diagnosticadas (Selecciona las que apliquen)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = formData.allergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-[8px] text-[12px] font-[500] transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-text)]/40 font-[600]'
                            : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--card)] hover:text-[var(--text)]'
                        }`}
                      >
                        {isSelected && '✕ '}
                        {allergy}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aversiones alimentarias (Cosas que detesta) */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="block text-[12px] font-[500] text-[var(--text)]">
                  Aversiones Alimentarias (Alimentos que NO te gustan o prefieres evitar)
                </label>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Tu nutricionista garantizará que estos alimentos no aparezcan en ninguna de tus opciones de menú.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_AVERSIONS.map((aversion) => {
                    const isSelected = formData.foodAversions.includes(aversion);
                    return (
                      <button
                        key={aversion}
                        type="button"
                        onClick={() => toggleAversion(aversion)}
                        className={`px-2.5 py-1 rounded-[6px] text-[12px] transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-text)]/40 font-[500]'
                            : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--card)]'
                        }`}
                      >
                        {isSelected && '🚫 '}
                        {aversion}
                      </button>
                    );
                  })}
                </div>

                {/* Añadir aversión personalizada */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escribe otro alimento que no te guste..."
                    value={customAversionInput}
                    onChange={(e) => setCustomAversionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAversion();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                  <Button type="button" variant="secondary" onClick={addCustomAversion} className="h-[34px] text-[12px]">
                    <IconPlus size={14} />
                    <span>Añadir</span>
                  </Button>
                </div>

                {formData.foodAversions.length > 0 && (
                  <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-[var(--text-secondary)] font-[500]">Exclusiones seleccionadas:</span>
                    {formData.foodAversions.map((av, idx) => (
                      <Badge key={idx} variant="warning">{av}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 3: PATOLOGÍAS Y FARMACOTERAPIA
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[14px] font-[500] text-[var(--text)]">
                <IconHeartbeat size={18} className="text-[var(--brand-solid)]" />
                <span>3. Patologías Diagnosticadas y Medicación</span>
              </div>

              {/* Patologías con chips interactivos */}
              <div className="space-y-2">
                <label className="block text-[12px] font-[500] text-[var(--text)]">
                  Condiciones Médicas o Diagnósticos Previos
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PATHOLOGIES.map((path) => {
                    const isSelected = formData.pathologies.includes(path);
                    return (
                      <button
                        key={path}
                        type="button"
                        onClick={() => togglePathology(path)}
                        className={`px-3 py-1.5 rounded-[8px] text-[12px] font-[500] transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-[var(--brand-bg)] text-[var(--brand-text)] border-[var(--brand-border)] font-[600]'
                            : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--card)] hover:text-[var(--text)]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {path}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medicación y suplementación habitual */}
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <label className="block text-[12px] font-[500] text-[var(--text)]">
                  Medicación y Suplementos Habituales (Levotiroxina, estatinas, anticonceptivos, etc.)
                </label>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Crucial para que el sistema de soporte clínico alerte sobre posibles bloqueos de absorción entre fármacos y nutrientes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Levotiroxina)"
                    value={customMedDrug}
                    onChange={(e) => setCustomMedDrug(e.target.value)}
                    className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                  />
                  <input
                    type="text"
                    placeholder="Dosis (ej. 75 mcg)"
                    value={customMedDose}
                    onChange={(e) => setCustomMedDose(e.target.value)}
                    className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                  />
                  <select
                    value={customMedSlot}
                    onChange={(e) => setCustomMedSlot(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] cursor-pointer"
                  >
                    <option value="desayuno">En el Desayuno / Ayunas</option>
                    <option value="comida">En la Comida</option>
                    <option value="cena">En la Cena</option>
                    <option value="noche">Antes de dormir</option>
                  </select>
                </div>

                <Button type="button" variant="secondary" onClick={addMedication} className="h-[32px] text-[12px]">
                  <IconPlus size={14} />
                  <span>Añadir Medicamento</span>
                </Button>

                {formData.medications.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formData.medications.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] flex items-center justify-between text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <IconPill size={16} className="text-[var(--brand-solid)]" />
                          <span className="font-[500] text-[var(--text)]">{m.drugName}</span>
                          <span className="text-[var(--text-secondary)] font-mono">({m.dosage})</span>
                          <Badge variant="neutral">{m.timingSlot}</Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedication(idx)}
                          className="text-[var(--danger-text)] hover:opacity-80 p-1"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 4: TRÁNSITO DIGESTIVO (BRISTOL) & ENVÍO
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[14px] font-[500] text-[var(--text)]">
                <IconActivity size={18} className="text-[var(--brand-solid)]" />
                <span>4. Digestión Basal y Escala de Bristol</span>
              </div>

              {/* Frecuencia de distensión */}
              <div>
                <label className="block text-[12px] font-[500] text-[var(--text)] mb-1">
                  ¿Con qué frecuencia notas inflamación o distensión abdominal?
                </label>
                <select
                  value={formData.digestiveBaseline.bloatingFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      digestiveBaseline: {
                        ...formData.digestiveBaseline,
                        bloatingFrequency: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px] cursor-pointer"
                >
                  <option value="Rara vez o nunca">Rara vez o casi nunca</option>
                  <option value="Ocasional tras comidas copiosas">Ocasional tras comidas copiosas</option>
                  <option value="Frecuente por las tardes">Frecuente por las tardes (amanezco plano, termino hinchado)</option>
                  <option value="Severa y diaria">Severa y diaria con dolor o gases</option>
                </select>
              </div>

              {/* Escala de Bristol habitual */}
              <div className="space-y-2">
                <label className="block text-[12px] font-[500] text-[var(--text)]">
                  Tipo de Tránsito Intestinal Habitual (Escala de Bristol)
                </label>
                <select
                  value={formData.digestiveBaseline.habitualBristol || 4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      digestiveBaseline: {
                        ...formData.digestiveBaseline,
                        habitualBristol: parseInt(e.target.value) as BristolStoolType,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[13px] cursor-pointer"
                >
                  {([1, 2, 3, 4, 5, 6, 7] as BristolStoolType[]).map((type) => (
                    <option key={type} value={type}>
                      {BRISTOL_DESCRIPTIONS[type].label} — {BRISTOL_DESCRIPTIONS[type].condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas y preferencias finales */}
              <div>
                <label className="block text-[12px] font-[500] text-[var(--text)] mb-1">
                  ¿Algo más que tu nutricionista deba saber antes de la consulta?
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre tus horarios, dudas prioritarias o experiencias previas..."
                  value={formData.generalNotes}
                  onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              {/* Resumen de inyección directa */}
              <div className="p-3 bg-[var(--card-subtle)] rounded-[8px] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] space-y-1">
                <div className="font-[500] text-[var(--text)]">⚡ Sincronización Automática</div>
                <p>
                  Al hacer clic en &quot;Enviar Cuestionario Pre-Consulta&quot;, tus datos quedarán estructurados en tu expediente clínico para que tu nutricionista los revise de inmediato.
                </p>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              BOTONES DE NAVEGACIÓN Y ENVÍO
              ───────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="text-[13px]"
              >
                <IconChevronLeft size={16} />
                <span>Anterior</span>
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 && (
              <Button
                key="btn-next-step"
                type="button"
                data-testid="onboarding-next-btn"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
                className="text-[13px]"
              >
                <span>Siguiente</span>
                <IconChevronRight size={16} />
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                key="btn-submit-step"
                type="submit"
                data-testid="onboarding-submit-btn"
                variant="primary"
                disabled={isSubmitting}
                className="text-[13px]"
              >
                {isSubmitting ? (
                  <span>Guardando anamnesis...</span>
                ) : (
                  <>
                    <IconCheck size={16} />
                    <span>Enviar Cuestionario Pre-Consulta</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
