'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import {
  IconFileDownload,
  IconEdit,
  IconCalendarEvent,
  IconClock,
  IconArrowLeft,
  IconFlask,
  IconActivity,
  IconPill,
  IconMicrophone,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Avatar } from '@/components/ui/nutri-ui';
import { BloodAnalyticsPanel } from '@/components/clients/BloodAnalyticsPanel';
import { DigestiveSymptomTracker } from '@/components/clients/DigestiveSymptomTracker';
import { MedicationInteractionsPanel } from '@/components/clients/MedicationInteractionsPanel';
import { PreConsultationCard } from '@/components/clients/PreConsultationCard';
import { ClinicalVoiceAssistantModal } from '@/components/clients/ClinicalVoiceAssistantModal';
import { getClientOnboardingData } from '@/lib/services/onboardingService';
import { ClientOnboardingProfile } from '@/types/diet';
import { ClinicalStructuredExtraction } from '@/types/clinicalVoice';

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[var(--text-secondary)]">Cargando ficha...</div>}>
      <ClientDetailContent />
    </Suspense>
  );
}

function ClientDetailContent() {
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Historia Clínica' | 'Dietas' | 'Citas' | 'Notas' | 'Pagos'>('Resumen');
  const [clinicalSubTab, setClinicalSubTab] = useState<'analiticas' | 'digestiones' | 'farmacos'>('analiticas');
  const [onboardingData, setOnboardingData] = useState<ClientOnboardingProfile | null>(null);
  
  // Estado Reactivo Asistido por Voz (Cero Pantallas)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(76.4);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);
  const [clientNotes, setClientNotes] = useState<string[]>([
    'El paciente refiere muy buena digestión tras eliminar ultraprocesados. Reporta mayor energía en sus entrenamientos de fuerza. Seguir manteniendo el aporte hídrico de 2.5 litros diarios.',
  ]);
  const [voiceInjectedAversions, setVoiceInjectedAversions] = useState<string[]>([]);

  React.useEffect(() => {
    getClientOnboardingData('client-1').then((data) => {
      if (data) setOnboardingData(data);
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Volver */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <IconArrowLeft size={16} stroke={1.5} />
          <span>Volver a clientes</span>
        </Link>

        {/* ─────────────────────────────────────────────────────────────
            CABECERA EN TARJETA
            ───────────────────────────────────────────────────────────── */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials="CM" size={56} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[18px] font-[500] text-[var(--text)]">
                  Carlos Gómez Pardo
                </h1>
                <span data-testid="patient-id-badge" className="patient-id font-mono text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[var(--text-secondary)] tracking-tight">
                  ID: client-1
                </span>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="text-[13px] text-[var(--text-secondary)] font-[400] flex flex-wrap gap-x-3 gap-y-1">
                <span>carlos.paciente@example.com</span>
                <span>•</span>
                <span className="tabular-nums font-mono">+34 600 11 22 33</span>
                <span>•</span>
                <span>Plan Recomposición</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              variant="secondary"
              data-testid="voice-assistant-trigger-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 flex items-center gap-1.5 text-[13px]"
              title="Iniciar consulta asistida por voz con Whisper y extracción SOAP"
            >
              <IconMicrophone size={16} className="text-emerald-500 animate-pulse" />
              <span>Dictado Clínico IA</span>
            </Button>
            <Link href="/appointments">
              <Button variant="secondary">Agendar cita</Button>
            </Link>
            <Link href="/dietas/creador">
              <Button variant="primary">Asignar dieta</Button>
            </Link>
          </div>
        </Card>

        {/* Notificación de Inyección Automática de Datos por Voz */}
        {voiceNotification && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 rounded-[10px] text-[12px] flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <IconSparkles size={16} className="text-emerald-500 shrink-0" />
              <span>{voiceNotification}</span>
            </div>
            <button
              onClick={() => setVoiceNotification(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-1"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑAS (Subrayado 2px en verde sobre la activa)
            ───────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[var(--border)] gap-6 overflow-x-auto">
          {(['Resumen', 'Historia Clínica', 'Dietas', 'Citas', 'Notas', 'Pagos'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-[14px] font-[500] transition-colors relative cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-[var(--brand-solid)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-solid)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CONTENIDO DE LA PESTAÑA SELECCIONADA
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Resumen' && (
          <div className="space-y-[12px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
              {/* Izquierda: Datos personales */}
              <Card className="space-y-3">
                <h2 className="text-[14px] font-[500] text-[var(--text)] mb-2">Datos personales</h2>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Edad</span>
                    <span className="font-[500] text-[var(--text)] tabular-nums font-mono raw-metric">34 años</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Altura</span>
                    <span className="font-[500] text-[var(--text)] tabular-nums font-mono raw-metric">178 cm</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Peso actual</span>
                    <span className="font-[600] text-[var(--brand-solid)] tabular-nums font-mono raw-metric">{currentWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Objetivo</span>
                    <span className="font-[400] text-[var(--text)]">Recomposición corporal</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                  <span className="text-[12px] text-[var(--text-secondary)] block mb-1">Alergias e intolerancias</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="danger">Gluten</Badge>
                    <Badge variant="danger">Lactosa</Badge>
                    {voiceInjectedAversions.map((av, idx) => (
                      <Badge key={idx} variant="warning">🚫 {av}</Badge>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Derecha: Suscripción con barra de progreso */}
              <Card className="space-y-4">
                <h2 className="text-[14px] font-[500] text-[var(--text)]">Suscripción activa</h2>

                <div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)] mb-1.5">
                    <span>Días consumidos</span>
                    <span className="font-[500] text-[var(--text)]">Día 9 de 15</span>
                  </div>
                  {/* Barra de progreso de 6px */}
                  <div className="w-full h-[6px] rounded-full bg-[#F1EFE8] overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand-solid)] transition-all"
                      style={{ width: `${(9 / 15) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Próxima revisión clínica</span>
                  <span className="font-[500] text-[var(--warning-text)]">En 6 días (19 oct)</span>
                </div>
              </Card>
            </div>

            {/* Cero Data Entry: Cuestionario Pre-Consulta Sincronizado */}
            <PreConsultationCard
              clientId="client-1"
              clientName="Carlos Gómez Pardo"
              onboardingData={onboardingData}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA HISTORIA CLÍNICA (CORE MÉDICO)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Historia Clínica' && (
          <div className="space-y-4">
            {/* Sub-navegación Historia Clínica */}
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-[13px]">
              <button
                type="button"
                onClick={() => setClinicalSubTab('analiticas')}
                className={`px-3 py-1.5 rounded-[8px] font-[500] flex items-center gap-2 transition-colors cursor-pointer ${
                  clinicalSubTab === 'analiticas'
                    ? 'bg-[var(--brand-solid)] text-white'
                    : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
                }`}
              >
                <IconFlask size={16} />
                <span>Analíticas de Sangre</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalSubTab('digestiones')}
                className={`px-3 py-1.5 rounded-[8px] font-[500] flex items-center gap-2 transition-colors cursor-pointer ${
                  clinicalSubTab === 'digestiones'
                    ? 'bg-[var(--brand-solid)] text-white'
                    : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
                }`}
              >
                <IconActivity size={16} />
                <span>Síntomas y Tránsito (Bristol)</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalSubTab('farmacos')}
                className={`px-3 py-1.5 rounded-[8px] font-[500] flex items-center gap-2 transition-colors cursor-pointer ${
                  clinicalSubTab === 'farmacos'
                    ? 'bg-[var(--brand-solid)] text-white'
                    : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
                }`}
              >
                <IconPill size={16} />
                <span>Farmacoterapia y Alertas CDSS</span>
              </button>
            </div>

            {/* Contenido de sub-sección clínica */}
            {clinicalSubTab === 'analiticas' && <BloodAnalyticsPanel clientId="client-1" />}
            {clinicalSubTab === 'digestiones' && <DigestiveSymptomTracker clientId="client-1" />}
            {clinicalSubTab === 'farmacos' && <MedicationInteractionsPanel clientId="client-1" />}
          </div>
        )}

        {activeTab === 'Dietas' && (
          <Card noPadding className="overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {[
                { name: 'Dieta Recomposición V2', origin: 'Plantilla 2.200 kcal', range: '01 oct - 31 oct', status: 'Publicada' as const },
                { name: 'Ajuste Déficit Calórico', origin: 'Plantilla Personalizada', range: 'Borrador activo', status: 'Borrador' as const },
              ].map((d, i) => (
                <div key={i} className="p-[12px_16px] flex items-center justify-between gap-4 text-[13px]">
                  <div>
                    <div className="font-[500] text-[var(--text)]">{d.name}</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">{d.origin} • {d.range}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === 'Publicada' ? 'success' : 'warning'}>{d.status}</Badge>
                    <Link href="/dietas/creador">
                      <Button variant="ghost" className="h-[30px] px-2 text-[12px]">
                        <IconEdit size={14} />
                        <span>Editar</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" className="h-[30px] px-2 text-[12px]">
                      <IconFileDownload size={14} />
                      <span>Descargar PDF</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Citas' && (
          <Card className="space-y-4">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de citas</h2>
            {/* Línea temporal vertical con punto de 8px */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border)]">
              {[
                { date: '13 oct, 11:30', type: 'Online (Google Meet)', notes: 'Revisión quincenal de adherencia y macros.' },
                { date: '29 sep, 11:30', type: 'Presencial', notes: 'Medición de pliegues antropométricos.' },
                { date: '15 sep, 10:00', type: 'Presencial', notes: 'Entrevista inicial y establecimiento de objetivos.' },
              ].map((c, i) => (
                <div key={i} className="relative text-[13px]">
                  <span className="absolute -left-[20px] top-1.5 w-[8px] h-[8px] rounded-full bg-[var(--brand-solid)]" />
                  <div className="font-[500] text-[var(--text)]">{c.date}</div>
                  <div className="text-[12px] text-[var(--text-secondary)] mb-1">{c.type}</div>
                  <div className="text-[13px] text-[var(--text)] font-[400]">{c.notes}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Notas' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h2 className="text-[14px] font-[500] text-[var(--text)]">Notas de consulta y Registros SOAP</h2>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {clientNotes.length} {clientNotes.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="space-y-3">
              {clientNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[var(--card-subtle)] rounded-[8px] border border-[var(--border)] text-[13px] text-[var(--text)] leading-relaxed whitespace-pre-line font-sans"
                >
                  {note}
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'Pagos' && (
          <Card className="space-y-3">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de pagos</h2>
            <div className="text-[13px] text-[var(--text-secondary)]">
              Suscripción gestionada vía Stripe. Último cobro realizado el 01/10/2026.
            </div>
          </Card>
        )}
      </div>

      {/* Modal Asistente de Consulta por Voz (Cero Pantallas) */}
      <ClinicalVoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        clientId="client-1"
        patientName="Carlos Gómez Pardo"
        currentWeightKg={currentWeight}
        onExtractionApplied={(ext) => {
          setCurrentWeight(ext.currentWeightKg);
          if (ext.newAversions.length > 0) {
            setVoiceInjectedAversions((prev) => Array.from(new Set([...prev, ...ext.newAversions])));
          }

          const soapString = `📋 CONSULTA ASISTIDA POR VOZ (WHISPER + IA) · ${new Date().toLocaleDateString('es-ES')}\n\n` +
            `S (Subjetivo): ${ext.soapNote.subjective}\n\n` +
            `O (Objetivo): ${ext.soapNote.objective}\n\n` +
            `A (Análisis): ${ext.soapNote.assessment}\n\n` +
            `P (Plan): ${ext.soapNote.plan}`;

          setClientNotes((prev) => [soapString, ...prev]);
          setVoiceNotification(
            `Consulta procesada por voz: Peso actualizado a ${ext.currentWeightKg} kg, reporte digestivo Bristol ${ext.digestiveReport.bristolType || 4} y nota SOAP guardada.`
          );
        }}
      />
    </AppShell>
  );
}
