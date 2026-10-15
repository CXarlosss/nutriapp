'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconFileDownload,
  IconEye,
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
  IconMessageDots,
  IconCalendarEvent,
  IconCoins,
  IconDeviceMobile,
  IconBuildingBank,
  IconReceipt,
  IconCreditCard,
  IconSend,
  IconCheck,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Avatar } from '@/components/ui/nutri-ui';
import { BloodAnalyticsPanel } from '@/components/clients/BloodAnalyticsPanel';
import { DigestiveSymptomTracker } from '@/components/clients/DigestiveSymptomTracker';
import { MedicationInteractionsPanel } from '@/components/clients/MedicationInteractionsPanel';
import { PreConsultationCard } from '@/components/clients/PreConsultationCard';
import { ClinicalVoiceAssistantModal } from '@/components/clients/ClinicalVoiceAssistantModal';
import { ClientMessageTemplatesModal } from '@/components/clients/ClientMessageTemplatesModal';
import { ManualPaymentModal } from '@/components/clients/ManualPaymentModal';
import { requestPaymentForClientAction } from '@/app/actions/billingOutboxActions';
import { getClientOnboardingData } from '@/lib/services/onboardingService';
import { ClientOnboardingProfile } from '@/types/diet';
import { useModeStore, findClientById, RealClient } from '@/lib/stores/useModeStore';
import {
  generateWhatsAppLink,
  generateMailtoLink,
  getSmartClientContact,
  contactTemplates,
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
      daysInPlan: 12,
    };
  }, [rawId, realClients]);

  const isCarlos = client.id === 'client-1' || client.id === 'c2';
  const daysElapsed = client.daysInPlan || 12;

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

  // Modales
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [stripeLinkGenerated, setStripeLinkGenerated] = useState<string | null>(null);

  const handleGenerateStripeLink = async () => {
    setIsStripeLoading(true);
    try {
      const res = await requestPaymentForClientAction({
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
      });
      if (res.success && res.checkoutUrl) {
        setStripeLinkGenerated(res.checkoutUrl);
        navigator.clipboard.writeText(res.checkoutUrl);
        setPaymentSuccessToast('Enlace de Stripe Checkout copiado al portapapeles y registrado en Outbox para n8n.');
        setTimeout(() => setPaymentSuccessToast(null), 6000);
      } else {
        alert(res.error || 'No se pudo generar el enlace de Stripe Checkout');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al conectar con Stripe');
    } finally {
      setIsStripeLoading(false);
    }
  };

  // Estado Asistido por Voz
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
            {/* Botón rápido para abrir catálogo completo de mensajes */}
            <Button
              variant="secondary"
              onClick={() => setIsTemplatesModalOpen(true)}
              className="h-[34px] px-3 text-[13px] flex items-center gap-1.5 border-amber-500/30 text-amber-800 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70"
              title="Abrir catálogo de mensajes clínicos y recordatorios de cita"
            >
              <IconMessageDots size={16} className="text-amber-600 dark:text-amber-400" />
              <span>Plantillas</span>
            </Button>

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

            {/* Botón Mágico: Marcar pago manual (Bizum / Efectivo / Transferencia - 0% comisión) */}
            <Button
              variant="secondary"
              data-testid="manual-payment-btn"
              onClick={() => setIsManualPaymentModalOpen(true)}
              className={`h-[34px] px-3 text-[13px] flex items-center gap-1.5 transition-all cursor-pointer ${
                client.status !== 'Activo'
                  ? 'border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 font-semibold ring-2 ring-emerald-500/30 shadow-sm'
                  : 'border-emerald-500/30 text-emerald-800 dark:text-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60'
              }`}
              title="Registrar cobro presencial (Bizum, Efectivo, Banco) sin comisiones de Stripe"
            >
              <IconCoins size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{client.status !== 'Activo' ? '💰 Cobrar y Activar' : '💰 Marcar Pago'}</span>
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
            BANNER INTELIGENTE DE RETENCIÓN CLÍNICA (DÍA 12)
            ───────────────────────────────────────────────────────────── */}
        {client.nextAppointment === 'Sin agendar' && (
          <div className="p-4 rounded-[12px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[13px] animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <IconCalendarEvent size={20} stroke={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-[600] text-[var(--text)]">
                    Día {daysElapsed} de 15 · Cita de revisión quincenal sin agendar
                  </h3>
                  <Badge variant="warning">Acción clínica recomendada</Badge>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 max-w-xl">
                  {client.name} lleva {daysElapsed} días con su plan {client.plan}. Es el momento idóneo para recordarle que reserve su próxima sesión antes de agotar la quincena y asegurar su adherencia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
              <a
                href={generateWhatsAppLink(
                  client.phone || '',
                  contactTemplates.quinceDaysReviewReminder(client.name, daysElapsed, client.plan).whatsapp
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-[32px] px-3 text-[12px] font-medium rounded-[8px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-500/30 transition-colors shadow-sm"
                title="Avisar por WhatsApp para agendar revisión"
              >
                <IconBrandWhatsapp size={15} />
                <span>Avisar por WhatsApp</span>
              </a>

              <a
                href={generateMailtoLink(
                  client.email || '',
                  contactTemplates.quinceDaysReviewReminder(client.name, daysElapsed, client.plan).emailSubject,
                  contactTemplates.quinceDaysReviewReminder(client.name, daysElapsed, client.plan).emailBody
                )}
                className="inline-flex items-center gap-1.5 h-[32px] px-3 text-[12px] font-medium rounded-[8px] text-blue-800 dark:text-blue-200 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 border border-blue-500/30 transition-colors shadow-sm"
                title="Avisar por Email para agendar revisión"
              >
                <IconMail size={15} />
                <span>Avisar por Email</span>
              </a>

              <Button
                variant="ghost"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="h-[32px] px-2.5 text-[12px]"
              >
                Ver plantillas
              </Button>
            </div>
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

              {/* Derecha: Suscripción activa con seguimiento de días */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-[500] text-[var(--text)]">Suscripción activa</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[var(--text-secondary)]">
                    Ciclo 15 días
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)] mb-1.5">
                    <span>Días consumidos del ciclo</span>
                    <span className="font-[600] text-[var(--brand-solid)] tabular-nums font-mono">
                      Día {daysElapsed} de 15
                    </span>
                  </div>
                  <div className="w-full h-[6px] rounded-full bg-[#F1EFE8] dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${daysElapsed >= 11 ? 'bg-amber-500' : 'bg-[var(--brand-solid)]'}`}
                      style={{ width: `${Math.min(100, (daysElapsed / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Próxima cita</span>
                  <span
                    className={`font-[500] ${
                      client.nextAppointment === 'Sin agendar'
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-[var(--text)]'
                    }`}
                  >
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={d.status === 'Publicada' ? 'success' : 'warning'}>{d.status}</Badge>

                        {/* Ver lo que he mandado (Portal del paciente) */}
                        <a
                          href={`/mi-dieta?clientName=${encodeURIComponent(client.name)}&diet=${encodeURIComponent(d.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver cómo ve el paciente la dieta en su portal móvil"
                        >
                          <Button variant="ghost" className="h-[30px] px-2 text-[12px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                            <IconEye size={14} />
                            <span>Ver Dieta</span>
                          </Button>
                        </a>

                        {/* Descargar PDF oficial */}
                        <a
                          href={`/api/export-pdf?client=${encodeURIComponent(client.name)}&diet=${encodeURIComponent(d.name)}&autoprint=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Descargar o imprimir informe médico oficial en PDF"
                        >
                          <Button variant="ghost" className="h-[30px] px-2 text-[12px] text-[var(--brand-solid)] hover:bg-[var(--card-subtle)]">
                            <IconFileDownload size={14} />
                            <span>Descargar PDF</span>
                          </Button>
                        </a>

                        {/* Enviar directamente por WhatsApp */}
                        {client.phone && (
                          <a
                            href={generateWhatsAppLink(
                              client.phone,
                              `¡Hola ${client.name.split(' ')[0]}! Ya tienes disponible tu ${d.name}. Puedes ver tu menú completo, opciones de intercambio y lista de la compra directamente aquí: ${typeof window !== 'undefined' ? window.location.origin : 'https://nutriapp-cyan.vercel.app'}/mi-dieta?clientName=${encodeURIComponent(client.name)}&diet=${encodeURIComponent(d.name)}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-[6px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex items-center"
                            title={`Enviar ${d.name} a ${client.name} por WhatsApp`}
                          >
                            <IconBrandWhatsapp size={16} />
                          </a>
                        )}

                        <Link href={`/dietas/creador?client=${client.id}`}>
                          <Button variant="ghost" className="h-[30px] px-2 text-[12px]">
                            <IconEdit size={14} />
                            <span>Editar</span>
                          </Button>
                        </Link>
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
            PESTAÑA PAGOS (Centro de Facturación Híbrido: Presencial + Online)
            ───────────────────────────────────────────────────────────── */}
        {activeTab === 'Pagos' && (
          <div className="space-y-4">
            {/* Métricas y Estado Actual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4 space-y-1">
                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">
                  Estado de Suscripción
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={client.status === 'Activo' ? 'success' : client.status === 'Pendiente de revisión' ? 'warning' : 'neutral'}>
                    {client.status}
                  </Badge>
                  {client.status === 'Activo' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Al día</span>
                  )}
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">
                  Método de Pago Habitual
                </span>
                <div className="flex items-center gap-2 pt-1">
                  {client.paymentMethod === 'bizum' && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-emerald-700 dark:text-emerald-300">
                      <IconDeviceMobile size={16} className="text-emerald-500" /> Bizum (0% comisión)
                    </span>
                  )}
                  {client.paymentMethod === 'cash' && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-emerald-700 dark:text-emerald-300">
                      <IconCoins size={16} className="text-emerald-500" /> Efectivo (0% comisión)
                    </span>
                  )}
                  {client.paymentMethod === 'transfer' && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-blue-700 dark:text-blue-300">
                      <IconBuildingBank size={16} className="text-blue-500" /> Transferencia SEPA
                    </span>
                  )}
                  {(!client.paymentMethod || client.paymentMethod === 'stripe') && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-purple-700 dark:text-purple-300">
                      <IconCreditCard size={16} className="text-purple-500" /> Tarjeta Stripe Online
                    </span>
                  )}
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">
                  Último Pago Registrado
                </span>
                <div className="text-[14px] font-mono font-medium text-[var(--text)] pt-1">
                  {client.lastPaymentAt || 'Sin registros'}
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">
                  Próxima Renovación
                </span>
                <div className="text-[14px] font-mono font-medium text-[var(--brand-solid)] pt-1">
                  {client.renewalDate || (client.status === 'Activo' ? '30 días desde último pago' : 'Pendiente de cobro')}
                </div>
              </Card>
            </div>

            {/* Opciones de Cobro: Presencial vs Online */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opción A: Cobro en Mano o Bizum (Presencial - 0% comisiones) */}
              <Card className="p-5 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-[15px]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <IconCoins size={18} />
                      </div>
                      <span>Cobro en Consulta (Presencial)</span>
                    </div>
                    <Badge variant="success">0% Comisión</Badge>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    Registra un pago recibido en metálico o por Bizum directamente en clínica. El paciente se reactiva al instante sin pagar comisiones a pasarelas bancarias externas.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={() => setIsManualPaymentModalOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-[36px]"
                  >
                    <IconCoins size={16} />
                    <span>Marcar Cobro Manual (Efectivo / Bizum)</span>
                  </Button>
                </div>
              </Card>

              {/* Opción B: Cobro Automatizado Online (Stripe) */}
              <Card className="p-5 border-[var(--border)] bg-[var(--card-subtle)] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text)] font-semibold text-[15px]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand-bg)] text-[var(--brand-solid)] flex items-center justify-center">
                        <IconCreditCard size={18} />
                      </div>
                      <span>Cobro Automatizado (Online)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Stripe Checkout</span>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    Para pacientes online o a distancia. Genera un enlace de pago seguro cifrado con tarjeta bancaria que se envía automáticamente por WhatsApp o email.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleGenerateStripeLink}
                    disabled={isStripeLoading}
                    className="flex-1 flex items-center justify-center gap-2 h-[36px]"
                  >
                    <IconSend size={15} />
                    <span>{isStripeLoading ? 'Generando...' : 'Generar Link Stripe'}</span>
                  </Button>
                  {client.phone && stripeLinkGenerated && (
                    <a
                      href={generateWhatsAppLink(
                        client.phone,
                        `¡Hola ${client.name.split(' ')[0]}! Puedes renovar tu suscripción de ${client.plan} de forma rápida y segura desde este enlace: ${stripeLinkGenerated}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-[36px] px-3 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 flex items-center justify-center"
                      title="Enviar enlace Stripe por WhatsApp"
                    >
                      <IconBrandWhatsapp size={16} />
                    </a>
                  )}
                </div>
              </Card>
            </div>

            {/* Historial de Transacciones */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <IconReceipt size={17} className="text-[var(--text-secondary)]" />
                  <h2 className="text-[14px] font-[500] text-[var(--text)]">
                    Historial de Transacciones y Recibos
                  </h2>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {client.paymentHistory?.length || 1} registros
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-[12px] text-left min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] text-[11px]">
                      <th className="py-2 px-3 font-semibold">Fecha</th>
                      <th className="py-2 px-3 font-semibold">Concepto</th>
                      <th className="py-2 px-3 font-semibold">Método</th>
                      <th className="py-2 px-3 font-semibold">Periodo</th>
                      <th className="py-2 px-3 font-semibold text-right">Importe</th>
                      <th className="py-2 px-3 font-semibold text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(client.paymentHistory && client.paymentHistory.length > 0
                      ? client.paymentHistory
                      : [
                          {
                            id: 'p-initial',
                            date: client.lastPaymentAt || '29 sep 2026',
                            amountEur: client.lastPaymentAmountEur || 79,
                            method: client.paymentMethod || 'cash',
                            periodDays: 30,
                            concept: `Plan ${client.plan} - Renovación Mensual`,
                            notes: 'Cobro registrado en clínica.',
                          },
                        ]
                    ).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-[var(--card-subtle)] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text)]">{p.date}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[var(--text)]">{p.concept}</div>
                          {p.notes && <div className="text-[10px] text-[var(--text-secondary)]">{p.notes}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 font-mono uppercase text-[10px] px-2 py-0.5 rounded-full bg-[var(--card-subtle)] border border-[var(--border)]">
                            {p.method === 'bizum' && '📱 Bizum'}
                            {p.method === 'cash' && '💵 Efectivo'}
                            {p.method === 'transfer' && '🏦 Banco'}
                            {p.method === 'stripe' && '💳 Stripe'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)]">{p.periodDays} días</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right text-[var(--text)] tabular-nums">
                          {p.amountEur} €
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant="success">Completado</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Toast de Éxito de Pago */}
      {paymentSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
            <IconCheck size={18} />
          </div>
          <div>
            <span className="font-semibold text-[13px] block">Cobro Registrado</span>
            <span className="text-[12px] text-emerald-200">{paymentSuccessToast}</span>
          </div>
        </div>
      )}

      {/* Modal de Cobro Manual en Consulta (Bizum / Efectivo / Transferencia) */}
      <ManualPaymentModal
        isOpen={isManualPaymentModalOpen}
        onClose={() => setIsManualPaymentModalOpen(false)}
        client={client}
        onSuccess={(msg) => {
          setPaymentSuccessToast(msg);
          setTimeout(() => setPaymentSuccessToast(null), 6000);
        }}
      />

      {/* Modal Catálogo de Plantillas Clínicas */}
      <ClientMessageTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        client={client}
        daysElapsed={daysElapsed}
      />

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
