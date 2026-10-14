'use client';

import React, { useState } from 'react';
import { ClientOnboardingProfile } from '@/types/diet';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import {
  IconClipboardCheck,
  IconClock,
  IconCopy,
  IconCheck,
  IconBrandWhatsapp,
  IconAlertTriangle,
  IconAlertCircle,
  IconActivity,
  IconMoon,
  IconSun,
  IconBarbell,
  IconDroplet,
  IconSparkles,
  IconExternalLink,
} from '@tabler/icons-react';
import { BRISTOL_DESCRIPTIONS } from '@/components/clients/DigestiveSymptomTracker';

interface PreConsultationCardProps {
  onboardingData?: ClientOnboardingProfile | null;
  clientId?: string;
  clientName?: string;
}

export const PreConsultationCard: React.FC<PreConsultationCardProps> = ({
  onboardingData,
  clientId = 'client-1',
  clientName = 'Carlos Gómez Pardo',
}) => {
  const [copied, setCopied] = useState(false);
  const [simulatedSent, setSimulatedSent] = useState(false);

  const token = onboardingData?.onboardingToken || 'token_carlos_gomez_2026';
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const preConsultationUrl = `${appBaseUrl}/pre-consulta/${token}`;

  const isCompleted = onboardingData?.onboardingStatus === 'completed';
  const formData = onboardingData?.formData;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(preConsultationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateN8nWhatsApp = () => {
    setSimulatedSent(true);
    setTimeout(() => setSimulatedSent(false), 3000);
  };

  return (
    <Card className="space-y-4 border-[var(--border)] overflow-hidden">
      {/* Cabecera de Estado y Automatización */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)] shrink-0">
            <IconClipboardCheck size={18} stroke={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-[500] text-[var(--text)]">
                Cuestionario Pre-Consulta (Cero Data Entry)
              </h3>
              <Badge variant={isCompleted ? 'success' : 'warning'}>
                {isCompleted ? 'Completado por el paciente ✓' : 'Pendiente de rellenar'}
              </Badge>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {isCompleted ? (
                <span>
                  Sincronizado automáticamente antes de la visita{' '}
                  {onboardingData?.intakeCompletedAt && (
                    <span className="font-mono">
                      ({new Date(onboardingData.intakeCompletedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })})
                    </span>
                  )}
                </span>
              ) : (
                <span>El paciente aún no ha rellenado el cuestionario digital</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de enlace rápido */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            onClick={handleCopyLink}
            className="h-[30px] px-2.5 text-[12px]"
            title="Copiar enlace del cuestionario digital"
          >
            {copied ? <IconCheck size={14} className="text-[var(--success-text)]" /> : <IconCopy size={14} />}
            <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleSimulateN8nWhatsApp}
            className="h-[30px] px-2.5 text-[12px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
            title="Simular disparo de n8n por WhatsApp"
          >
            <IconBrandWhatsapp size={14} />
            <span>{simulatedSent ? 'Enviado vía n8n' : 'WhatsApp'}</span>
          </Button>
        </div>
      </div>

      {/* Contenido estructurado de anamnesis inyectada */}
      {isCompleted && formData ? (
        <div className="space-y-3.5 text-[13px]">
          {/* Bloque Alergias y Aversiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Alergias e Intolerancias */}
            <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] space-y-1.5">
              <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--danger-text)] flex items-center gap-1">
                <IconAlertCircle size={14} /> Alergias e Intolerancias
              </span>
              {formData.allergies && formData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {formData.allergies.map((a, i) => (
                    <Badge key={i} variant="danger">{a}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-[var(--text-secondary)]">Sin alergias declaradas</span>
              )}
            </div>

            {/* Aversiones alimentarias */}
            <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] space-y-1.5">
              <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--warning-text)] flex items-center gap-1">
                <IconAlertTriangle size={14} /> Aversiones (No tolera / Rechaza comer)
              </span>
              {formData.foodAversions && formData.foodAversions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {formData.foodAversions.map((av, i) => (
                    <Badge key={i} variant="warning">🚫 {av}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-[var(--text-secondary)]">Sin alimentos vetados</span>
              )}
            </div>
          </div>

          {/* Patologías y Condiciones Médicas */}
          <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] space-y-1.5">
            <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--brand-solid)] flex items-center gap-1">
              <IconActivity size={14} /> Patologías y Diagnósticos Médicos
            </span>
            {formData.pathologies && formData.pathologies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {formData.pathologies.map((p, i) => (
                  <Badge key={i} variant="brand">✓ {p}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-[var(--text-secondary)]">Sin patologías previas registradas</span>
            )}
          </div>

          {/* Rutina Diaria del Paciente */}
          {formData.dailyRoutine && (
            <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] space-y-2">
              <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--text-secondary)] block">
                Rutina Diaria, Horarios y Estilo de Vida
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                {/* Despertar y Dormir */}
                <div className="bg-[var(--card)] p-2 rounded-[6px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <IconSun size={12} className="text-amber-500" /> Despertar / Sueño
                  </div>
                  <div className="font-mono font-[500] text-[var(--text)] mt-0.5">
                    {formData.dailyRoutine.wakeUpTime || '--:--'} - {formData.dailyRoutine.bedTime || '--:--'}
                  </div>
                </div>

                {/* Comidas al día */}
                <div className="bg-[var(--card)] p-2 rounded-[6px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <IconClock size={12} className="text-[var(--brand-solid)]" /> Tomas / día
                  </div>
                  <div className="font-[500] text-[var(--text)] mt-0.5">
                    {formData.dailyRoutine.mealsCount || 4} tomas habituales
                  </div>
                </div>

                {/* Entrenamiento */}
                <div className="bg-[var(--card)] p-2 rounded-[6px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <IconBarbell size={12} className="text-blue-500" /> Ejercicio
                  </div>
                  <div className="text-[11px] font-[500] text-[var(--text)] truncate mt-0.5" title={formData.dailyRoutine.trainingSchedule}>
                    {formData.dailyRoutine.trainingSchedule || 'Fuerza 3-4 días'}
                  </div>
                </div>

                {/* Hidratación */}
                <div className="bg-[var(--card)] p-2 rounded-[6px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <IconDroplet size={12} className="text-cyan-500" /> Aporte hídrico
                  </div>
                  <div className="font-mono font-[500] text-[var(--text)] mt-0.5">
                    {formData.dailyRoutine.waterLitersDaily || 2.0} L / día
                  </div>
                </div>
              </div>

              {formData.dailyRoutine.workType && (
                <div className="text-[11px] text-[var(--text-secondary)] pt-1 flex items-center gap-1">
                  <span className="font-[500] text-[var(--text)]">Ocupación laboral:</span>
                  <span>{formData.dailyRoutine.workType}</span>
                </div>
              )}
            </div>
          )}

          {/* Línea Base Digestiva */}
          {formData.digestiveBaseline && (
            <div className="p-3 rounded-[8px] bg-[var(--card-subtle)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
              <div>
                <span className="text-[11px] font-[500] uppercase tracking-wider text-[var(--text-secondary)] block">
                  Perfil Digestivo Basal Pre-Consulta
                </span>
                <div className="text-[var(--text)] font-[500] mt-0.5">
                  Distensión: <span className="font-normal text-[var(--text-secondary)]">{formData.digestiveBaseline.bloatingFrequency || 'Ocasional'}</span>
                  {formData.digestiveBaseline.habitualBristol && (
                    <> • Hábito Bristol: <Badge variant="neutral">Tipo {formData.digestiveBaseline.habitualBristol}</Badge></>
                  )}
                </div>
              </div>

              <a
                href={preConsultationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--brand-solid)] hover:underline font-[500] shrink-0"
              >
                <span>Ver formulario completo</span>
                <IconExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-[8px] bg-[var(--card-subtle)] border border-dashed border-[var(--border)] text-center space-y-2 text-[12px]">
          <p className="text-[var(--text-secondary)]">
            El enlace digital ha sido generado para <strong className="text-[var(--text)]">{clientName}</strong>. En cuanto el paciente lo complete, sus datos aparecerán aquí estructurados automáticamente.
          </p>
          <div className="pt-1">
            <a
              href={preConsultationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--brand-solid)] font-[500] hover:underline"
            >
              <span>Abrir vista previa del formulario digital</span>
              <IconExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};
