'use client';

import React, { useState } from 'react';
import {
  IconX,
  IconCheck,
  IconCircleCheck,
  IconFileDownload,
  IconEye,
  IconBrandWhatsapp,
  IconMail,
  IconCopy,
  IconSparkles,
  IconPrinter,
  IconExternalLink,
} from '@tabler/icons-react';
import { Button, Badge, AnimatedCheckmark, fireCelebrationConfetti } from '@/components/ui/nutri-ui';
import {
  generateWhatsAppLink,
  generateMailtoLink,
  contactTemplates,
} from '@/lib/utils/contactLinks';

interface PublishedDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  dietName: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  targetKcal?: number;
}

export const PublishedDietModal: React.FC<PublishedDietModalProps> = ({
  isOpen,
  onClose,
  dietName,
  clientName,
  clientPhone,
  clientEmail,
  targetKcal = 1900,
}) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fireCelebrationConfetti({ type: 'publish' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nutriapp-cyan.vercel.app';
  const portalUrl = `${appBaseUrl}/mi-dieta?clientName=${encodeURIComponent(clientName)}&diet=${encodeURIComponent(dietName)}`;
  const pdfDownloadUrl = `/api/export-pdf?client=${encodeURIComponent(clientName)}&diet=${encodeURIComponent(dietName)}&autoprint=true`;

  const template = contactTemplates.dietDelivery(clientName, portalUrl, dietName);
  const whatsappUrl = generateWhatsAppLink(clientPhone || '', template.whatsapp);
  const emailUrl = generateMailtoLink(clientEmail || '', template.emailSubject, template.emailBody);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 top-[56px] z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
        {/* Cabecera de Éxito */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-b border-[var(--border)] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AnimatedCheckmark size="sm" variant="brand" showSparkles={true} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-[600] text-[var(--text)]">
                  ¡Pauta Publicada con Éxito!
                </h2>
                <Badge variant="success">Lista para entregar</Badge>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                La pauta <strong className="text-[var(--text)]">{dietName}</strong> ha sido asignada a <strong className="text-[var(--text)]">{clientName}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4">
          {/* Opción 1: Descargar PDF y Ver lo que has mandado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-[10px] bg-[var(--card-subtle)] border border-[var(--border)] hover:border-[var(--brand-solid)] hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-bg)] text-[var(--brand-solid)] flex items-center justify-center">
                  <IconFileDownload size={18} />
                </div>
                <IconExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
              </div>
              <div>
                <div className="font-[600] text-[13px] text-[var(--text)] group-hover:text-[var(--brand-solid)] transition-colors">
                  Descargar PDF
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Informe médico hospitalario A4 oficial con recetas y macros.
                </p>
              </div>
            </a>

            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-[10px] bg-[var(--card-subtle)] border border-[var(--border)] hover:border-emerald-500 hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IconEye size={18} />
                </div>
                <IconExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
              </div>
              <div>
                <div className="font-[600] text-[13px] text-[var(--text)] group-hover:text-emerald-600 transition-colors">
                  Ver lo que he mandado
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Vista exacta del portal digital del paciente con lista de la compra.
                </p>
              </div>
            </a>
          </div>

          {/* Opción 2: Entrega directa al paciente */}
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] block">
              Entregar la dieta al paciente ahora mismo
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-[38px] px-3.5 text-[13px] font-medium rounded-[8px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-500/30 transition-colors shadow-sm"
                title="Abrir WhatsApp con el enlace de la dieta listo para enviar"
              >
                <IconBrandWhatsapp size={17} />
                <span>Enviar por WhatsApp</span>
              </a>

              <a
                href={emailUrl}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-[38px] px-3.5 text-[13px] font-medium rounded-[8px] text-blue-800 dark:text-blue-200 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/70 border border-blue-500/30 transition-colors shadow-sm"
                title="Enviar por correo electrónico"
              >
                <IconMail size={17} />
                <span>Enviar por Email</span>
              </a>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-[var(--text-secondary)] bg-[var(--card-subtle)] p-2 rounded-lg border border-[var(--border)]">
              <span className="truncate pr-2 font-mono text-[10px] text-[var(--text-muted)]">
                {portalUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 font-medium text-[var(--brand-solid)] hover:underline shrink-0 cursor-pointer"
              >
                {copied ? <IconCheck size={13} className="text-emerald-500" /> : <IconCopy size={13} />}
                <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-3.5 px-5 bg-[var(--card-subtle)] border-t border-[var(--border)] flex items-center justify-end">
          <Button variant="secondary" onClick={onClose} className="text-[12px] h-[32px]">
            Cerrar y continuar en el editor
          </Button>
        </div>
      </div>
    </div>
  );
};
