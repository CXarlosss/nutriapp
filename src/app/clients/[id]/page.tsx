'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconFileDownload,
  IconEdit,
  IconArrowLeft,
  IconFlask,
  IconActivity,
  IconPill,
  IconMicrophone,
  IconSparkles,
  IconX,
  IconBrandWhatsapp,
  IconMail,
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
import { useModeStore, findClientById, RealClient } from '@/lib/stores/useModeStore';
import {
  generateWhatsAppLink,
  generateMailtoLink,
  getSmartClientContact,
} from '@/lib/utils/contactLinks';

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[var(--text-secondary)]">Cargando ficha...</div>}>
      <ClientDetailContent />
    </Suspense>
  );
}

function ClientDetailContent() {
  const params = useParams();
  const rawId = (params?.id as string) || '';
  const { realClients } = useModeStore();

  // Resolución dinámica del cliente
  const client: RealClient = useMemo(() => {
    const found = findClientById(rawId, realClients);
    if (found) return found;

    return {
      id: rawId || 'client-1',
      name: rawId && !rawId.startsWith('client_') ? rawId : 'Paciente',
      email: '',
      phone: '',
      plan: 'Plan Recomposición',
      status: 'Activo',
      lastAppointment: 'Sin citas',
      nextAppointment: 'Sin agendar',
      hasDiet: false,
    };
  }, [rawId, realClients]);

  const isCarlos = client.id === 'client-1' || client.id === 'c2';

  const clientInitials = useMemo(() => {
    const parts = client.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (client.name.slice(0, 2) || 'PA').toUpperCase();
  }, [client.name]);

  const contact = useMemo(() => {
    return getSmartClientContact(client);
  }, [client]);

  const [activeTab, setActiveTab] = useState<'Resumen' | 'Historia Clínica' | 'Dietas' | 'Citas' | 'Notas' | 'Pagos'>('Resumen');
  const [clinicalSubTab, setClinicalSubTab] = useState<'analiticas' | 'digestiones' | 'farmacos'>('analiticas');
  const [onboardingData, setOnboardingData] = useState<ClientOnboardingProfile | null>(null);

  // Estado Reactivo Asistido por Voz
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(76.4);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);
  const [clientNotes, setClientNotes] = useState<string[]>([
    isCarlos
      ? 'El paciente refiere muy buena digestión tras eliminar ultraprocesados. Reporta mayor energía en sus entrenamientos de fuerza. Seguir manteniendo el aporte hídrico de 2.5 litros diarios.'
      : `Ficha clínica creada para ${client.name}. Pendiente de primera consulta y valoración de hábitos.`,
  ]);
  const [voiceInjectedAversions, setVoiceInjectedAversions] = useState<string[]>([]);

  useEffect(() => {
    if (client.id) {
      getClientOnboardingData(client.id).then((data) => {
        if (data) setOnboardingData(data);
      });
    }
  }, [client.id]);

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
            CABECERA EN TARJETA DINÁMICA
            ───────────────────────────────────────────────────────────── */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={clientInitials} size={56} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[18px] font-[500] text-[var(--text)]">
                  {client.name}
                </h1>
                <span
                  data-testid="patient-id-badge"
                  className="patient-id font-mono text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[var(--text-secondary)] tracking-tight"
                >
                  ID: {client.id}
                </span>
                <Badge
                  variant={
                    client.status === 'Activo'
                      ? 'success'
                      : client.status === 'Pendiente de revisión'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {client.status}
                </Badge>
              </div>

              <div className="text-[13px] text-[var(--text-secondary)] font-[400] flex flex-wrap items-center gap-x-3 gap-y-1">
                {client.email ? (
                  <a
                    href={generateMailtoLink(client.email, contact.emailSubject, contact.emailBody)}
                    className="hover:text-[var(--brand-solid)] hover:underline inline-flex items-center gap-1"
                    title={`Enviar email a ${client.email}`}
                  >
                    <IconMail size={14} className="text-[var(--text-muted)]" />
                    <span>{client.email}</span>
                  </a>
                ) : (
                  <span className="text-[var(--text-muted)] italic inline-flex items-center gap-1">
                    <IconMail size={14} className="text-[var(--text-muted)] opacity-60" />
                    <span>Sin correo registrado</span>
                  </span>
                )}

                <span>•</span>

                {client.phone ? (
                  <a
                    href={generateWhatsAppLink(client.phone, contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tabular-nums font-mono hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    title={`${contact.tooltip} a ${client.phone}`}
                  >
                    <IconBrandWhatsapp size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{client.phone}</span>
                  </a>
                ) : (
                  <span className="text-[var(--text-muted)] italic inline-flex items-center gap-1">
                    <IconBrandWhatsapp size={14} className="text-[var(--text-muted)] opacity-60" />
                    <span>Sin teléfono</span>
                  </span>
                )}

                <span>•</span>
                <span>Plan {client.plan}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {client.phone ? (
              <a
                href={generateWhatsAppLink(client.phone, contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-[34px] px-3 text-[13px] font-medium rounded-[8px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-500/30 transition-colors"
                title={`${contact.tooltip} por WhatsApp`}
              >
                <IconBrandWhatsapp size={16} />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => alert(`El paciente ${client.name} no tiene número de teléfono registrado.`)}
                className="inline-flex items-center gap-1.5 h-[34px] px-3 text-[13px] font-medium rounded-[8px] text-[var(--text-muted)] bg-[var(--card-subtle)] border border-[var(--border)] opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                title="Sin teléfono registrado"
              >
                <IconBrandWhatsapp size={16} />
                <span>WhatsApp</span>
              </button>
            )}

            {client.email ? (
              <a
                href={generateMailtoLink(client.email, contact.emailSubject, contact.emailBody)}
                className="inline-flex items-center gap-1.5 h-[34px] px-3 text-[13px] font-medium rounded-[8px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/70 border border-blue-500/30 transition-colors"
                title={`Enviar correo electrónico a ${client.email}`}
              >
                <IconMail size={16} />
                <span>Email</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => alert(`El paciente ${client.name} no tiene correo electrónico registrado.`)}
                className="inline-flex items-center gap-1.5 h-[34px] px-3 text-[13px] font-medium rounded-[8px] text-[var(--text-muted)] bg-[var(--card-subtle)] border border-[var(--border)] opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                title="Sin correo registrado"
              >
                <IconMail size={16} />
                <span>Email</span>
              </button>
            )}

            <Button
              variant="secondary"
              data-testid="voice-assistant-trigger-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-950/60 flex items-center gap-1.5 text-[13px]"
              title="Iniciar consulta asistida por voz con Whisper y extracción SOAP"
            >
              <IconMicrophone size={16} className="text-purple-500 animate-pulse" />
              <span>Dictado Clínico IA</span>
            </Button>
            <Link href="/appointments">
              <Button variant="secondary">Agendar cita</Button>
            </Link>
            <Link href={`/dietas/creador?client=${client.id}`}>
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
            PESTAÑAS
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
                    <span className="font-[500] text-[var(--text)] tabular-nums font-mono raw-metric">
                      {onboardingData?.formData?.age
                        ? `${onboardingData.formData.age} años`
                        : isCarlos
                        ? '34 años'
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Altura</span>
                    <span className="font-[500] text-[var(--text)] tabular-nums font-mono raw-metric">
                      {onboardingData?.formData?.heightCm
                        ? `${onboardingData.formData.heightCm} cm`
                        : isCarlos
                        ? '178 cm'
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Peso actual</span>
                    <span className="font-[600] text-[var(--brand-solid)] tabular-nums font-mono raw-metric">
                      {onboardingData?.formData?.currentWeightKg || (isCarlos ? currentWeight : '—')} {onboardingData?.formData?.currentWeightKg || isCarlos ? 'kg' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Objetivo</span>
                    <span className="font-[400] text-[var(--text)]">
                      {onboardingData?.formData?.goal || client.plan || 'Recomposición corporal'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                  <span className="text-[12px] text-[var(--text-secondary)] block mb-1">Alergias e intolerancias</span>
                  <div className="flex flex-wrap gap-1.5">
                    {onboardingData?.formData?.allergies && onboardingData.formData.allergies.length > 0 ? (
                      onboardingData.formData.allergies.map((al, idx) => (
                        <Badge key={idx} variant="danger">{al}</Badge>
                      ))
                    ) : isCarlos ? (
                      <>
                        <Badge variant="danger">Gluten</Badge>
                        <Badge variant="danger">Lactosa</Badge>
                      </>
                    ) : (
                      <span className="text-[12px] text-[var(--text-muted)] italic">
                        Pendiente de cumplimentar en cuestionario
                      </span>
                    )}
                    {voiceInjectedAversions.map((av, idx) => (
                      <Badge key={idx} variant="warning">🚫 {av}</Badge>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Derecha: Suscripción activa */}
              <Card className="space-y-4">
                <h2 className="text-[14px] font-[500] text-[var(--text)]">Suscripción activa</h2>

                <div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)] mb-1.5">
                    <span>Estado del plan</span>
                    <span className="font-[500] text-[var(--text)]">{client.plan}</span>
                  </div>
                  <div className="w-full h-[6px] rounded-full bg-[#F1EFE8] overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand-solid)] transition-all"
                      style={{ width: client.status === 'Activo' ? '65%' : '20%' }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Próxima cita</span>
                  <span className="font-[500] text-[var(--warning-text)]">
                    {client.nextAppointment || 'Sin agendar'}
                  </span>
                </div>
              </Card>
            </div>

            {/* Cero Data Entry: Cuestionario Pre-Consulta Sincronizado */}
            <PreConsultationCard
              clientId={client.id}
              clientName={client.name}
              clientPhone={client.phone}
              clientEmail={client.email}
              onboardingData={onboardingData}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA HISTORIA CLÍNICA (CORE MÉDICO)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Historia Clínica' && (
          <div className="space-y-4">
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

            {clinicalSubTab === 'analiticas' && <BloodAnalyticsPanel clientId={client.id} />}
            {clinicalSubTab === 'digestiones' && <DigestiveSymptomTracker clientId={client.id} />}
            {clinicalSubTab === 'farmacos' && <MedicationInteractionsPanel clientId={client.id} />}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA DIETAS
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Dietas' && (
          <div>
            {client.hasDiet || isCarlos ? (
              <Card noPadding className="overflow-hidden">
                <div className="divide-y divide-[var(--border)]">
                  {[
                    { name: `Pauta Nutricional ${client.plan} V1`, origin: 'Plantilla Personalizada', range: 'Vigente', status: 'Publicada' as const },
                    { name: 'Ajuste de Carga e Hidratación', origin: 'Borrador Clínico', range: 'En preparación', status: 'Borrador' as const },
                  ].map((d, i) => (
                    <div key={i} className="p-[12px_16px] flex items-center justify-between gap-4 text-[13px]">
                      <div>
                        <div className="font-[500] text-[var(--text)]">{d.name}</div>
                        <div className="text-[12px] text-[var(--text-secondary)]">{d.origin} • {d.range}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={d.status === 'Publicada' ? 'success' : 'warning'}>{d.status}</Badge>
                        <Link href={`/dietas/creador?client=${client.id}`}>
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
            ) : (
              <Card className="text-center py-10 space-y-3">
                <div className="text-[14px] font-medium text-[var(--text)]">
                  No hay pautas nutricionales asignadas a {client.name} todavía
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-md mx-auto">
                  Crea y personaliza un menú semanal adaptado a sus necesidades en el Creador de Dietas interactivo.
                </p>
                <Link href={`/dietas/creador?client=${client.id}`}>
                  <Button variant="primary">Crear primera pauta en Diet Builder</Button>
                </Link>
              </Card>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA CITAS
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Citas' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de citas</h2>
              <Link href="/appointments">
                <Button variant="secondary" className="h-[30px] text-[12px]">
                  Agendar nueva cita
                </Button>
              </Link>
            </div>

            {client.lastAppointment === 'Sin citas' && client.nextAppointment === 'Sin agendar' ? (
              <div className="text-center py-8 text-[13px] text-[var(--text-secondary)]">
                {client.name} aún no tiene ninguna cita agendada en la clínica.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border)]">
                {[
                  {
                    date: client.nextAppointment !== 'Sin agendar' ? client.nextAppointment : 'Próxima consulta',
                    type: 'Consulta de Seguimiento',
                    notes: `Revisión de adherencia y sensaciones con ${client.plan}.`,
                  },
                  ...(isCarlos
                    ? [
                        { date: '29 sep, 11:30', type: 'Presencial', notes: 'Medición de pliegues antropométricos.' },
                        { date: '15 sep, 10:00', type: 'Presencial', notes: 'Entrevista inicial y establecimiento de objetivos.' },
                      ]
                    : []),
                ].map((c, i) => (
                  <div key={i} className="relative text-[13px]">
                    <span className="absolute -left-[20px] top-1.5 w-[8px] h-[8px] rounded-full bg-[var(--brand-solid)]" />
                    <div className="font-[500] text-[var(--text)]">{c.date}</div>
                    <div className="text-[12px] text-[var(--text-secondary)] mb-1">{c.type}</div>
                    <div className="text-[13px] text-[var(--text)] font-[400]">{c.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA NOTAS
            ───────────────────────────────────────────────────────────── */}
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

        {/* ─────────────────────────────────────────────────────────────
            PESTAÑA PAGOS
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Pagos' && (
          <Card className="space-y-3">
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Historial de pagos</h2>
            <div className="text-[13px] text-[var(--text-secondary)]">
              Suscripción para {client.name} ({client.plan}) gestionada de forma directa. Estado: {client.status}.
            </div>
          </Card>
        )}
      </div>

      {/* Modal Asistente de Consulta por Voz (Cero Pantallas) */}
      <ClinicalVoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        clientId={client.id}
        patientName={client.name}
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
            `Consulta procesada por voz: Peso actualizado a ${ext.currentWeightKg} kg, reporte digestivo Bristol ${ext.digestiveReport.bristolType || 4} y nota SOAP guardada para ${client.name}.`
          );
        }}
      />
    </AppShell>
  );
}
