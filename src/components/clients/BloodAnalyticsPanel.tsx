'use client';

import React, { useState } from 'react';
import {
  BloodTestReport,
  BloodMarkerValue,
} from '@/types/diet';
import { MOCK_BLOOD_TESTS } from '@/lib/services/clinicalRecordsService';
import { Card, Badge, Button, EmptyState } from '@/components/ui/nutri-ui';
import {
  IconFlask,
  IconPlus,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconCalendar,
  IconBuildingHospital,
  IconInfoCircle,
} from '@tabler/icons-react';

interface BloodAnalyticsPanelProps {
  clientId?: string;
  initialTests?: BloodTestReport[];
}

type MarkerCategoryFilter = 'all' | 'tiroides' | 'hierro' | 'vitaminas' | 'glucemia' | 'lipidos';

export const BloodAnalyticsPanel: React.FC<BloodAnalyticsPanelProps> = ({
  clientId = 'client-1',
  initialTests = MOCK_BLOOD_TESTS,
}) => {
  const [tests, setTests] = useState<BloodTestReport[]>(initialTests);
  const [selectedTestId, setSelectedTestId] = useState<string>(
    initialTests[initialTests.length - 1]?.id || ''
  );
  const [categoryFilter, setCategoryFilter] = useState<MarkerCategoryFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Analítica seleccionada actualmente
  const currentTest = tests.find((t) => t.id === selectedTestId) || tests[tests.length - 1];
  
  // Analítica anterior para cálculo de deltas
  const currentTestIndex = tests.findIndex((t) => t.id === currentTest?.id);
  const previousTest = currentTestIndex > 0 ? tests[currentTestIndex - 1] : null;

  // Formulario de nueva analítica
  const [formData, setFormData] = useState({
    testDate: new Date().toISOString().split('T')[0],
    laboratoryName: 'Laboratorio Clínico Central',
    notes: '',
    ferritina: '58',
    hierro_serico: '105',
    vitamina_d: '45',
    vitamina_b12: '440',
    hba1c: '5.1',
    glucosa_basal: '84',
    colesterol_total: '182',
    colesterol_ldl: '102',
    colesterol_hdl: '60',
    trigliceridos: '100',
    tsh: '2.10',
    t4_libre: '1.30',
    t3_libre: '3.2',
  });

  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();

    const newReport: BloodTestReport = {
      id: `bt-${Date.now()}`,
      clientId,
      testDate: formData.testDate,
      laboratoryName: formData.laboratoryName,
      notes: formData.notes || 'Registro manual de analítica',
      markers: {
        ferritina: {
          value: parseFloat(formData.ferritina),
          unit: 'µg/L',
          minRef: 30,
          maxRef: 300,
          status: parseFloat(formData.ferritina) < 30 ? 'warning' : 'optimal',
          label: 'Ferritina Sérica',
          category: 'hierro',
        },
        hierro_serico: {
          value: parseFloat(formData.hierro_serico),
          unit: 'µg/dL',
          minRef: 60,
          maxRef: 170,
          status: 'optimal',
          label: 'Hierro Sérico',
          category: 'hierro',
        },
        vitamina_d: {
          value: parseFloat(formData.vitamina_d),
          unit: 'ng/mL',
          minRef: 30,
          maxRef: 100,
          status: parseFloat(formData.vitamina_d) < 30 ? 'warning' : 'optimal',
          label: '25-OH Vitamina D',
          category: 'vitaminas',
        },
        vitamina_b12: {
          value: parseFloat(formData.vitamina_b12),
          unit: 'pg/mL',
          minRef: 200,
          maxRef: 900,
          status: 'optimal',
          label: 'Vitamina B12',
          category: 'vitaminas',
        },
        hba1c: {
          value: parseFloat(formData.hba1c),
          unit: '%',
          minRef: 4.0,
          maxRef: 5.6,
          status: parseFloat(formData.hba1c) > 5.6 ? 'warning' : 'optimal',
          label: 'Hemoglobina Glicosilada (HbA1c)',
          category: 'glucemia',
        },
        glucosa_basal: {
          value: parseFloat(formData.glucosa_basal),
          unit: 'mg/dL',
          minRef: 70,
          maxRef: 99,
          status: 'optimal',
          label: 'Glucosa en Ayunas',
          category: 'glucemia',
        },
        colesterol_total: {
          value: parseFloat(formData.colesterol_total),
          unit: 'mg/dL',
          minRef: 120,
          maxRef: 200,
          status: parseFloat(formData.colesterol_total) > 200 ? 'warning' : 'optimal',
          label: 'Colesterol Total',
          category: 'lipidos',
        },
        colesterol_ldl: {
          value: parseFloat(formData.colesterol_ldl),
          unit: 'mg/dL',
          minRef: 50,
          maxRef: 100,
          status: parseFloat(formData.colesterol_ldl) > 100 ? 'warning' : 'optimal',
          label: 'Colesterol LDL',
          category: 'lipidos',
        },
        colesterol_hdl: {
          value: parseFloat(formData.colesterol_hdl),
          unit: 'mg/dL',
          minRef: 45,
          maxRef: 85,
          status: 'optimal',
          label: 'Colesterol HDL',
          category: 'lipidos',
        },
        trigliceridos: {
          value: parseFloat(formData.trigliceridos),
          unit: 'mg/dL',
          minRef: 40,
          maxRef: 150,
          status: 'optimal',
          label: 'Triglicéridos',
          category: 'lipidos',
        },
        tsh: {
          value: parseFloat(formData.tsh),
          unit: 'µIU/mL',
          minRef: 0.4,
          maxRef: 4.0,
          status: parseFloat(formData.tsh) > 4.0 ? 'critical' : 'optimal',
          label: 'Tirotropina (TSH)',
          category: 'tiroides',
        },
        t4_libre: {
          value: parseFloat(formData.t4_libre),
          unit: 'ng/dL',
          minRef: 0.8,
          maxRef: 1.8,
          status: 'optimal',
          label: 'T4 Libre',
          category: 'tiroides',
        },
        t3_libre: {
          value: parseFloat(formData.t3_libre),
          unit: 'pg/mL',
          minRef: 2.3,
          maxRef: 4.2,
          status: 'optimal',
          label: 'T3 Libre',
          category: 'tiroides',
        },
      },
    };

    setTests((prev) => [...prev, newReport]);
    setSelectedTestId(newReport.id);
    setIsModalOpen(false);
  };

  if (!currentTest) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={<IconFlask size={28} stroke={1.6} />}
          badge="Bioquímica Clínica 🔬"
          title="Sin analíticas sanguíneas registradas"
          description="Aún no se han introducido informes analíticos para este paciente. Registra los biomarcadores de laboratorio para activar la correlación automática con la pauta nutricional."
          actionLabel="Registrar analítica médica"
          actionIcon={<IconPlus size={16} stroke={1.8} />}
          onAction={() => setIsModalOpen(true)}
          tip="El motor CDSS alertará si algún ingrediente interfiere con biomarcadores como ferritina, TSH o glucosa."
        />
      </Card>
    );
  }

  // Filtrar marcadores según la categoría seleccionada
  const activeMarkers = Object.entries(currentTest.markers).filter(([_, marker]) => {
    if (!marker) return false;
    if (categoryFilter === 'all') return true;
    return marker.category === categoryFilter;
  });

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          CABECERA, SELECTOR DE ANALÍTICAS Y ACCIONES
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-[12px] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)] shrink-0">
            <IconFlask size={20} stroke={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-[500] text-[var(--text)]">
                Módulo de Analíticas de Sangre
              </h2>
              <span className="clinical-id font-mono text-[11px] px-2 py-0.5 rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[var(--text-secondary)]">
                {currentTest.id}
              </span>
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] flex items-center gap-2">
              <span className="flex items-center gap-1">
                <IconBuildingHospital size={13} /> {currentTest.laboratoryName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <IconCalendar size={13} /> {currentTest.testDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de fecha de analítica */}
          <div className="flex items-center gap-1 bg-[var(--card-subtle)] p-1 rounded-[8px] border border-[var(--border)]">
            {tests.map((t) => {
              const isSelected = t.id === currentTest.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTestId(t.id)}
                  className={`px-2.5 py-1 text-[12px] rounded-[6px] font-[500] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card)] text-[var(--text)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {t.testDate}
                </button>
              );
            })}
          </div>

          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-[32px] text-[12px]">
            <IconPlus size={14} />
            <span>Nueva Analítica</span>
          </Button>
        </div>
      </div>

      {/* Notas Clínicas del Laboratorio */}
      {currentTest.notes && (
        <div className="p-3 bg-[var(--card-subtle)] border border-[var(--border)] rounded-[8px] text-[12px] text-[var(--text-secondary)] flex items-start gap-2">
          <IconInfoCircle size={16} className="text-[var(--brand-solid)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-[500] text-[var(--text)]">Criterio clínico: </span>
            {currentTest.notes}
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FILTROS POR CATEGORÍA DE MARCADORES
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px]">
        {[
          { key: 'all', label: 'Todos los Marcadores' },
          { key: 'tiroides', label: 'Tiroides (TSH, T4, T3)' },
          { key: 'hierro', label: 'Hierro y Ferritina' },
          { key: 'vitaminas', label: 'Vitaminas (D, B12)' },
          { key: 'glucemia', label: 'Glucemia y HbA1c' },
          { key: 'lipidos', label: 'Perfil Lipídico' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key as MarkerCategoryFilter)}
            className={`px-3 py-1.5 rounded-[8px] font-[500] whitespace-nowrap transition-colors cursor-pointer border ${
              categoryFilter === cat.key
                ? 'bg-[var(--brand-solid)] text-white border-[var(--brand-solid)]'
                : 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CUADRÍCULA DE MARCADORES CON BARRAS DE REFERENCIA Y DELTAS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeMarkers.map(([markerKey, marker]) => {
          if (!marker) return null;

          // Obtener valor en la prueba anterior para comparar evolución
          const prevMarker = previousTest?.markers[markerKey as keyof typeof previousTest.markers];
          let deltaPercent: number | null = null;
          let isFavorableDelta: boolean = false;

          if (prevMarker && prevMarker.value > 0) {
            deltaPercent = ((marker.value - prevMarker.value) / prevMarker.value) * 100;

            // Determinar si el cambio es clínicamente favorable
            if (marker.category === 'tiroides' || marker.category === 'glucemia') {
              // Si estaba alto, bajar es favorable
              isFavorableDelta = deltaPercent < 0;
            } else if (marker.category === 'hierro' || marker.category === 'vitaminas') {
              // Subir suele ser favorable si estaba deficitario
              isFavorableDelta = deltaPercent > 0;
            } else if (markerKey === 'colesterol_total' || markerKey === 'colesterol_ldl' || markerKey === 'trigliceridos') {
              isFavorableDelta = deltaPercent < 0;
            } else if (markerKey === 'colesterol_hdl') {
              isFavorableDelta = deltaPercent > 0;
            }
          }

          // Cálculo para el indicador en la barra de rango (clamp entre 0% y 100%)
          const barRangeMin = marker.minRef * 0.7;
          const barRangeMax = marker.maxRef * 1.3;
          const percentagePosition = Math.min(
            100,
            Math.max(0, ((marker.value - barRangeMin) / (barRangeMax - barRangeMin)) * 100)
          );

          return (
            <Card key={markerKey} className="space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--text-secondary)] block">
                    {marker.category}
                  </span>
                  <h3 className="text-[14px] font-[500] text-[var(--text)] leading-tight">
                    {marker.label}
                  </h3>
                </div>
                <Badge
                  variant={
                    marker.status === 'optimal'
                      ? 'success'
                      : marker.status === 'critical'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {marker.status === 'optimal'
                    ? 'Óptimo'
                    : marker.status === 'critical'
                    ? 'Crítico'
                    : 'Atención'}
                </Badge>
              </div>

              {/* Valor actual y delta temporal */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-[600] font-mono tabular-nums raw-metric text-[var(--text)]">
                    {marker.value}
                  </span>
                  <span className="text-[12px] text-[var(--text-secondary)] font-normal">
                    {marker.unit}
                  </span>
                </div>

                {deltaPercent !== null && (
                  <div
                    className={`flex items-center gap-0.5 text-[11px] font-[500] tabular-nums font-mono px-1.5 py-0.5 rounded-[4px] ${
                      isFavorableDelta
                        ? 'text-[var(--success-text)] bg-[var(--success-bg)]'
                        : 'text-[var(--warning-text)] bg-[var(--warning-bg)]'
                    }`}
                    title={`Valor previo: ${prevMarker?.value} ${marker.unit}`}
                  >
                    {deltaPercent > 0 ? (
                      <IconArrowUpRight size={13} stroke={2} />
                    ) : deltaPercent < 0 ? (
                      <IconArrowDownRight size={13} stroke={2} />
                    ) : (
                      <IconMinus size={13} />
                    )}
                    <span>{Math.abs(deltaPercent).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Barra Visual de Rango de Referencia */}
              <div className="space-y-1 pt-1">
                <div className="relative w-full h-[6px] bg-[var(--border)] rounded-full overflow-hidden">
                  {/* Segmento verde central de referencia óptima */}
                  <div
                    className="absolute top-0 bottom-0 bg-[var(--brand-solid)] opacity-35"
                    style={{
                      left: `${((marker.minRef - barRangeMin) / (barRangeMax - barRangeMin)) * 100}%`,
                      width: `${((marker.maxRef - marker.minRef) / (barRangeMax - barRangeMin)) * 100}%`,
                    }}
                  />
                  {/* Indicador de valor del cliente */}
                  <div
                    className={`absolute top-0 bottom-0 w-[4px] rounded-full shadow-sm ${
                      marker.status === 'optimal'
                        ? 'bg-[var(--success-text)]'
                        : marker.status === 'critical'
                        ? 'bg-[var(--danger-text)]'
                        : 'bg-[var(--warning-text)]'
                    }`}
                    style={{ left: `calc(${percentagePosition}% - 2px)` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-mono tabular-nums">
                  <span>Ref: {marker.minRef}</span>
                  <span className="font-sans text-[var(--text-muted)]">Rango normal</span>
                  <span>{marker.maxRef} {marker.unit}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL REGISTRO DE NUEVA ANALÍTICA
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <IconFlask className="text-[var(--brand-solid)]" size={20} />
                <h3 className="text-[15px] font-[500] text-[var(--text)]">
                  Registrar Analítica Sanguínea
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

            <form onSubmit={handleSaveNewTest} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Fecha del Análisis
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                    Centro / Laboratorio
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.laboratoryName}
                    onChange={(e) => setFormData({ ...formData, laboratoryName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[500] text-[var(--text-secondary)] mb-1">
                  Notas Clínicas / Motivo de Consulta
                </label>
                <input
                  type="text"
                  placeholder="ej. Control semestral post-ajuste de dieta y levotiroxina"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px]"
                />
              </div>

              {/* Entradas de Marcadores Clave */}
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--brand-solid)] block">
                  Marcadores Clave del Perfil
                </span>

                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">Ferritina (µg/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.ferritina}
                      onChange={(e) => setFormData({ ...formData, ferritina: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">Vit. D (ng/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitamina_d}
                      onChange={(e) => setFormData({ ...formData, vitamina_d: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">HbA1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.hba1c}
                      onChange={(e) => setFormData({ ...formData, hba1c: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">Colest. Total (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.colesterol_total}
                      onChange={(e) => setFormData({ ...formData, colesterol_total: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">Colest. LDL (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.colesterol_ldl}
                      onChange={(e) => setFormData({ ...formData, colesterol_ldl: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-secondary)]">TSH (µIU/mL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tsh}
                      onChange={(e) => setFormData({ ...formData, tsh: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  <IconCheck size={14} />
                  <span>Guardar Analítica</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
