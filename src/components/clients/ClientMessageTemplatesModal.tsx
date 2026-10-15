'use client';

import React, { useState } from 'react';
import {
  IconX,
  IconBrandWhatsapp,
  IconMail,
  IconCopy,
  IconCheck,
  IconCalendarEvent,
  IconHeartbeat,
  IconClipboardCheck,
  IconSalad,
  IconClock,
} from '@tabler/icons-react';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import { RealClient } from '@/lib/stores/useModeStore';
import {
  contactTemplates,
  generateWhatsAppLink,
  generateMailtoLink,
} from '@/lib/utils/contactLinks';

interface ClientMessageTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: RealClient;
  daysElapsed?: number;
}

export const ClientMessageTemplatesModal: React.FC<ClientMessageTemplatesModalProps> = ({
  isOpen,
  onClose,
  client,
  daysElapsed = 12,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<'day12' | 'followup' | 'welcome' | 'diet' | 'appointment'>('day12');
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | null>(null);

  if (!isOpen) return null;

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nutriapp-cyan.vercel.app';
  const token = `token_${client.id.replace(/[^a-zA-Z0-9_]/g, '')}`;
  const intakeUrl = `${appBaseUrl}/pre-consulta/${token}`;
  const dietUrl = `${appBaseUrl}/mi-dieta`;
  const bookingUrl = `${appBaseUrl}/appointments`;

  const templates = [
    {
      id: 'day12' as const,
      title: `Recordatorio Quincenal (Día ${daysElapsed} de 15)`,
      tag: 'Retención Clave',
      tagVariant: 'warning' as const,
      icon: <IconCalendarEvent size={18} className="text-amber-500" />,
      description: 'Ideal para pacientes que llevan entre 10 y 14 días con su pauta y aún no han reservado su revisión.',
      data: contactTemplates.quinceDaysReviewReminder(client.name, daysElapsed, client.plan, bookingUrl),
    },
    {
      id: 'followup' as const,
      title: 'Seguimiento Clínico y Sensaciones',
      tag: 'Adherencia',
      tagVariant: 'brand' as const,
      icon: <IconHeartbeat size={18} className="text-emerald-500" />,
      description: 'Pregunta cómo se siente con la saciedad, energía, digestiones y dudas con los menús.',
      data: contactTemplates.quickFollowUp(client.name, client.plan, client.nextAppointment),
    },
    {
      id: 'welcome' as const,
      title: 'Bienvenida y Cuestionario Pre-consulta',
      tag: 'Onboarding',
      tagVariant: 'neutral' as const,
      icon: <IconClipboardCheck size={18} className="text-blue-500" />,
      description: 'Envía el formulario digital para que el paciente declare intolerancias, rutinas y gustos.',
      data: contactTemplates.welcomeWithIntake(client.name, intakeUrl, client.plan),
    },
    {
      id: 'diet' as const,
      title: 'Entrega de Dieta / Pauta Lista',
      tag: 'Pauta Activa',
      tagVariant: 'success' as const,
      icon: <IconSalad size={18} className="text-emerald-600" />,
      description: 'Notifica al paciente que su nuevo menú semanal y recetas ya están subidos a su portal.',
      data: contactTemplates.dietDelivery(client.name, dietUrl, client.plan),
    },
    {
      id: 'appointment' as const,
      title: 'Recordatorio de Cita Agendada',
      tag: 'Agenda',
      tagVariant: 'neutral' as const,
      icon: <IconClock size={18} className="text-purple-500" />,
      description: 'Confirma la hora y detalles de la consulta para evitar ausencias o retrasos.',
      data: contactTemplates.appointmentReminder(
        client.name,
        client.nextAppointment !== 'Sin agendar' ? client.nextAppointment.split(',')[0] : 'esta semana',
        'la hora acordada'
      ),
    },
  ];

  const currentTpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleCopy = (text: string, type: 'whatsapp' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const whatsappHref = generateWhatsAppLink(client.phone || '', currentTpl.data.whatsapp);
  const emailHref = generateMailtoLink(client.email || '', currentTpl.data.emailSubject, currentTpl.data.emailBody);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[16px] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)]">
              <IconBrandWhatsapp size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-[600] text-[var(--text)]">
                Plantillas de Mensajes Clínicos para {client.name}
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Selecciona una plantilla para enviar por WhatsApp o Email con un solo clic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Cuerpo: Columnas de selector y previsualización */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          {/* Selector de plantillas */}
          <div className="md:col-span-5 p-3 sm:p-4 space-y-2 bg-[var(--card-subtle)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-1 block mb-2">
              Mensajes recomendados
            </span>
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-3 rounded-[10px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card)] border-[var(--brand-solid)] shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-[var(--card)]/60 text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 font-[500] text-[13px] text-[var(--text)]">
                      {tpl.icon}
                      <span className="truncate">{tpl.title}</span>
                    </div>
                    <Badge variant={tpl.tagVariant}>{tpl.tag}</Badge>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Vista previa y acciones */}
          <div className="md:col-span-7 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-[600] text-[var(--text)]">{currentTpl.title}</h3>
                  <Badge variant={currentTpl.tagVariant}>{currentTpl.tag}</Badge>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">{currentTpl.description}</p>
              </div>

              {/* Caja de previsualización WhatsApp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px] font-medium text-[var(--text)]">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <IconBrandWhatsapp size={15} /> Texto para WhatsApp
                  </span>
                  <button
                    onClick={() => handleCopy(currentTpl.data.whatsapp, 'whatsapp')}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'whatsapp' ? (
                      <>
                        <IconCheck size={12} className="text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={12} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-[8px] bg-[#EFEAE2]/70 dark:bg-emerald-950/20 border border-emerald-500/20 text-[12px] text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {currentTpl.data.whatsapp}
                </div>
              </div>

              {/* Caja de previsualización Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px] font-medium text-[var(--text)]">
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <IconMail size={15} /> Asunto de Email
                  </span>
                  <button
                    onClick={() => handleCopy(`${currentTpl.data.emailSubject}\n\n${currentTpl.data.emailBody}`, 'email')}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'email' ? (
                      <>
                        <IconCheck size={12} className="text-blue-500" />
                        <span className="text-blue-500 font-semibold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={12} />
                        <span>Copiar correo</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] text-[12px] text-[var(--text)] font-medium">
                  {currentTpl.data.emailSubject}
                </div>
              </div>
            </div>

            {/* Botones de acción final */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-end gap-2.5">
              <Button variant="ghost" onClick={onClose} className="text-[13px]">
                Cerrar
              </Button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 text-[13px] font-medium rounded-[8px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-500/30 transition-colors shadow-sm"
              >
                <IconBrandWhatsapp size={16} />
                <span>Abrir WhatsApp Web</span>
              </a>

              <a
                href={emailHref}
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 text-[13px] font-medium rounded-[8px] text-blue-800 dark:text-blue-200 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/70 border border-blue-500/30 transition-colors shadow-sm"
              >
                <IconMail size={16} />
                <span>Abrir en Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
