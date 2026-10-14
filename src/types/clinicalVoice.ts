export interface DigestiveReportExtraction {
  bloating: 'Ninguna' | 'Leve' | 'Moderada' | 'Severa por las tardes' | 'Constante';
  bristolType?: number; // 1 a 7
  acidReflux: boolean;
  transitSummary: string;
}

export interface SoapClinicalNote {
  subjective: string; // Relato del paciente, síntomas, sensaciones de hambre y saciedad
  objective: string;  // Peso registrado, tensión, antropometría, Bristol cuantitativo
  assessment: string; // Interpretación clínica, balance energético, evolución
  plan: string;       // Cambios en la pauta, suplementación, próxima cita
}

export interface ClinicalStructuredExtraction {
  patientName: string;
  currentWeightKg: number;
  weightChangeKg?: number;
  adherencePercentage: number;
  adherenceLevel: 'baja' | 'media' | 'alta' | 'excelente';
  adherenceDetails: string;
  digestiveReport: DigestiveReportExtraction;
  reportedPathologies: string[];
  newAversions: string[];
  soapNote: SoapClinicalNote;
  rawTranscript: string;
  durationSeconds?: number;
  processedAt: string;
  source: 'whisper_live' | 'clinical_dictation_file' | 'simulation_preset';
}

export interface ClinicalVoiceSessionState {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  isProcessing: boolean;
  extraction: ClinicalStructuredExtraction | null;
  error: string | null;
  isCommitted: boolean;
}
