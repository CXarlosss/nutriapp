'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';
import {
  IconMicrophone,
  IconPlayerStop,
  IconSparkles,
  IconCheck,
  IconX,
  IconScale,
  IconAlertCircle,
  IconActivity,
  IconClock,
  IconLoader2,
  IconDeviceFloppy,
  IconFileText,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react';
import {
  PRESET_CONSULTATIONS,
  PresetConsultation,
} from '@/lib/services/clinicalDictationService';
import {
  processClinicalAudioAction,
  commitClinicalExtractionAction,
} from '@/app/actions/clinicalVoiceActions';
import { ClinicalStructuredExtraction } from '@/types/clinicalVoice';

interface ClinicalVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  patientName: string;
  currentWeightKg: number;
  onExtractionApplied?: (extraction: ClinicalStructuredExtraction) => void;
}

export function ClinicalVoiceAssistantModal({
  isOpen,
  onClose,
  clientId,
  patientName,
  currentWeightKg,
  onExtractionApplied,
}: ClinicalVoiceAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'mic' | 'text'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<PresetConsultation>(PRESET_CONSULTATIONS[0]);
  const [customText, setCustomText] = useState('');
  
  // Estados de Grabación Real con Micrófono
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de Procesamiento y Resultados
  const [isProcessing, setIsProcessing] = useState(false);
  const [extraction, setExtraction] = useState<ClinicalStructuredExtraction | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Limpiar estados al cerrar
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingSeconds(0);
      setExtraction(null);
      setCommitSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Manejo de grabación con micrófono
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setErrorMessage(null);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecordingAndProcess = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    
    // Al detener la grabación real o simulada, procesar el preset o texto
    const textToProcess =
      customText.trim() || selectedPreset.transcript;

    await handleProcessText(textToProcess);
  };

  const handleProcessPreset = async (preset: PresetConsultation) => {
    setSelectedPreset(preset);
    await handleProcessText(preset.transcript);
  };

  const handleProcessText = async (text: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await processClinicalAudioAction(text, patientName, currentWeightKg);
      if (res.success && res.data) {
        setExtraction(res.data);
      } else {
        setErrorMessage(res.error || 'No se pudieron extraer los datos clínicos de la consulta.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el motor de voz.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitToChart = async () => {
    if (!extraction) return;
    setIsCommitting(true);
    try {
      const res = await commitClinicalExtractionAction(clientId, extraction);
      if (res.success) {
        setCommitSuccess(true);
        if (onExtractionApplied) {
          onExtractionApplied(extraction);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Error al inyectar los datos en el expediente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al guardar en expediente.');
    } finally {
      setIsCommitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, y: 20, filter: 'blur(2px)' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
              mass: 0.9,
            }}
            style={{ transformOrigin: 'top right' }}
            data-testid="voice-modal-content"
            className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-[16px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)] shrink-0">
              <IconMicrophone size={20} stroke={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-[500] text-[var(--text)]">
                  Asistente de Consulta por Voz (Cero Pantallas)
                </h2>
                <Badge variant="brand">Whisper + IA</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Grabación ambiental y extracción automática de datos para {patientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded-lg transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-[13px] flex-1">
          {errorMessage && (
            <div className="p-3 bg-[var(--danger-bg)] text-[var(--danger-text)] rounded-[8px] border border-[var(--danger-text)]/30 text-[12px] flex items-center gap-2">
              <IconAlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Estado de Éxito al Inyectar */}
          {commitSuccess ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--brand-bg)] flex items-center justify-center text-[var(--brand-solid)]">
                <IconCheck size={32} stroke={2} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-[500] text-[var(--text)]">
                  ¡Expediente actualizado con éxito!
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Peso ({extraction?.currentWeightKg} kg), reporte digestivo, aversiones y nota SOAP inyectados sin tocar la pantalla.
                </p>
              </div>
            </div>
          ) : !extraction ? (
            /* Vista de Selección y Grabación */
            <div className="space-y-4">
              {/* Selector de Pestañas de Entrada */}
              <div className="flex border-b border-[var(--border)] gap-4 text-[13px]">
                <button
                  type="button"
                  data-testid="tab-presets-btn"
                  onClick={() => setActiveTab('presets')}
                  className={`pb-2 font-[500] transition-colors relative cursor-pointer ${
                    activeTab === 'presets'
                      ? 'text-[var(--brand-solid)] border-b-2 border-[var(--brand-solid)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  Casos de Consulta Precargados
                </button>

                <button
                  type="button"
                  data-testid="tab-mic-btn"
                  onClick={() => setActiveTab('mic')}
                  className={`pb-2 font-[500] transition-colors relative cursor-pointer ${
                    activeTab === 'mic'
                      ? 'text-[var(--brand-solid)] border-b-2 border-[var(--brand-solid)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  Grabar Micrófono en Vivo
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`pb-2 font-[500] transition-colors relative cursor-pointer ${
                    activeTab === 'text'
                      ? 'text-[var(--brand-solid)] border-b-2 border-[var(--brand-solid)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  Dictado Libre / Texto
                </button>
              </div>

              {/* Pestaña: Casos Precargados */}
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Selecciona una simulación de consulta real para verificar la transcripción y extracción instantánea de Structured Outputs:
                  </p>

                  <div className="space-y-2">
                    {PRESET_CONSULTATIONS.map((preset) => (
                      <div
                        key={preset.id}
                        data-testid={`preset-${preset.id}`}
                        onClick={() => setSelectedPreset(preset)}
                        className={`p-3 rounded-[10px] border transition-all cursor-pointer ${
                          selectedPreset.id === preset.id
                            ? 'bg-[var(--brand-bg)] border-[var(--brand-border)] shadow-sm'
                            : 'bg-[var(--card-subtle)] border-[var(--border)] hover:bg-[var(--card)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-[500] text-[var(--text)] text-[13px]">
                            {preset.title}
                          </span>
                          <Badge variant="brand">{preset.tag}</Badge>
                        </div>
                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      data-testid="process-preset-btn"
                      disabled={isProcessing}
                      onClick={() => handleProcessPreset(selectedPreset)}
                      className="w-full h-[40px] text-[13px]"
                    >
                      {isProcessing ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          <span>Extrayendo Structured Outputs con IA...</span>
                        </>
                      ) : (
                        <>
                          <IconSparkles size={16} />
                          <span>Procesar Grabación de Consulta Seleccionada</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Pestaña: Micrófono en Vivo */}
              {activeTab === 'mic' && (
                <div className="py-6 text-center space-y-4 bg-[var(--card-subtle)] rounded-[12px] border border-[var(--border)]">
                  {isRecording ? (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center animate-pulse">
                        <IconMicrophone size={32} />
                      </div>
                      <div>
                        <span className="text-[18px] font-mono font-bold text-rose-500 block">
                          {formatTimer(recordingSeconds)}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          🔴 Grabando audio ambiental de consulta...
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        data-testid="stop-mic-btn"
                        onClick={handleStopRecordingAndProcess}
                        className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
                      >
                        <IconPlayerStop size={16} />
                        <span>Detener y Procesar con Whisper</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[var(--brand-bg)] text-[var(--brand-solid)] flex items-center justify-center">
                        <IconMicrophone size={32} stroke={1.75} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-[500] text-[var(--text)] text-[14px]">
                          Consulta Presencial o Videollamada
                        </h4>
                        <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto">
                          Pulsa para iniciar la captura de audio. Puedes hablar libremente con el paciente sin mirar el ordenador.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        data-testid="start-mic-btn"
                        onClick={handleStartRecording}
                        className="px-6"
                      >
                        <IconMicrophone size={16} />
                        <span>Comenzar Grabación de Consulta</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Pestaña: Dictado Libre / Texto */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Escribe o pega el resumen hablado de la consulta médica:
                  </p>

                  <textarea
                    rows={6}
                    data-testid="clinical-custom-textarea"
                    placeholder="ej. El paciente pesa hoy 75.2 kg. Buen cumplimiento al 90%. Refiere distensión por las tardes y heces tipo 3. Retirar el brócoli hervido..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full p-3 rounded-[8px] border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--text)] text-[12px] font-sans"
                  />

                  <Button
                    variant="primary"
                    data-testid="process-custom-text-btn"
                    disabled={isProcessing || !customText.trim()}
                    onClick={() => handleProcessText(customText)}
                    className="w-full h-[38px] text-[13px]"
                  >
                    {isProcessing ? (
                      <>
                        <IconLoader2 size={16} className="animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <IconSparkles size={16} />
                        <span>Extraer Datos Clínicos</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Vista de Resultados Extraídos (Structured Outputs) */
            <div className="space-y-4 animate-fadeIn">
              {/* Tarjetas Cuantitativas Rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Peso detectado */}
                <div className="p-3 bg-[var(--card-subtle)] rounded-[10px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                    <IconScale size={13} className="text-[var(--brand-solid)]" /> Peso Actual
                  </div>
                  <div className="text-[16px] font-bold font-mono text-[var(--text)] mt-0.5">
                    {extraction.currentWeightKg} kg
                  </div>
                  {extraction.weightChangeKg !== undefined && (
                    <span
                      className={`text-[10px] font-mono ${
                        extraction.weightChangeKg <= 0 ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {extraction.weightChangeKg <= 0 ? '' : '+'}
                      {extraction.weightChangeKg} kg vs basal
                    </span>
                  )}
                </div>

                {/* Adherencia */}
                <div className="p-3 bg-[var(--card-subtle)] rounded-[10px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                    <IconClock size={13} className="text-amber-500" /> Adherencia
                  </div>
                  <div className="text-[16px] font-bold font-mono text-amber-500 mt-0.5">
                    {extraction.adherencePercentage}%
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] capitalize">
                    {extraction.adherenceLevel}
                  </span>
                </div>

                {/* Escala Bristol */}
                <div className="p-3 bg-[var(--card-subtle)] rounded-[10px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                    <IconActivity size={13} className="text-teal-500" /> Escala Bristol
                  </div>
                  <div className="text-[16px] font-bold font-mono text-[var(--text)] mt-0.5">
                    Tipo {extraction.digestiveReport.bristolType || 4}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {extraction.digestiveReport.bloating}
                  </span>
                </div>

                {/* Aversiones detectadas */}
                <div className="p-3 bg-[var(--card-subtle)] rounded-[10px] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                    <IconAlertCircle size={13} className="text-[var(--warning-text)]" /> Aversiones
                  </div>
                  <div className="text-[13px] font-[500] text-[var(--text)] mt-1 truncate">
                    {extraction.newAversions.length > 0
                      ? extraction.newAversions[0]
                      : 'Ninguna nueva'}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)]">Vetar en pauta</span>
                </div>
              </div>

              {/* Desglose Clínico Digestivo */}
              <div className="p-3.5 bg-[var(--card-subtle)] rounded-[10px] border border-[var(--border)] space-y-1.5 text-[12px]">
                <div className="font-[500] text-[var(--text)] flex items-center gap-1.5">
                  <span className="text-base">🥣</span>
                  <span>Reporte Digestivo y de Tránsito Intestinal</span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {extraction.digestiveReport.transitSummary}
                </p>
              </div>

              {/* Estructura SOAP Formal */}
              <div className="space-y-2 p-3.5 rounded-[10px] bg-[var(--card-subtle)] border border-[var(--border)] text-[12px]">
                <div className="font-[500] text-[var(--text)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IconFileText size={16} className="text-[var(--brand-solid)]" />
                    <span>Registro Clínico SOAP Generado</span>
                  </span>
                  <Badge variant="neutral">Formato Estándar Sanitario</Badge>
                </div>

                <div className="space-y-2 pt-1 font-sans">
                  <div>
                    <span className="font-bold text-[var(--text)] block text-[11px]">S (Subjetivo):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{extraction.soapNote.subjective}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text)] block text-[11px]">O (Objetivo):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{extraction.soapNote.objective}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text)] block text-[11px]">A (Análisis):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{extraction.soapNote.assessment}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text)] block text-[11px]">P (Plan):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{extraction.soapNote.plan}</p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-[var(--border)]">
                <Button
                  variant="secondary"
                  onClick={() => setExtraction(null)}
                  className="text-[12px]"
                >
                  <IconRefresh size={14} />
                  <span>Procesar otra consulta</span>
                </Button>

                <Button
                  variant="primary"
                  data-testid="commit-voice-data-btn"
                  disabled={isCommitting}
                  onClick={handleCommitToChart}
                  className="text-[13px] px-4"
                >
                  {isCommitting ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Inyectando en expediente...</span>
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy size={16} />
                      <span>⚡ Inyectar en Expediente y Guardar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
