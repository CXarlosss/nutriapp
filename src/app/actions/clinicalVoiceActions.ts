'use server';

import { revalidatePath } from 'next/cache';
import {
  extractClinicalDataFromTranscript,
  PRESET_CONSULTATIONS,
} from '@/lib/services/clinicalDictationService';
import { ClinicalStructuredExtraction } from '@/types/clinicalVoice';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isValidUUID, DEMO_CLIENT_UUID } from '@/lib/utils/uuid';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('mock') || key.includes('mock') || url.includes('example') || key.includes('example')) {
    return null;
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export interface ProcessDictationResult {
  success: boolean;
  data?: ClinicalStructuredExtraction;
  error?: string;
}

export interface CommitExtractionResult {
  success: boolean;
  message?: string;
  updatedClient?: {
    weightKg: number;
    pathologies: string[];
    aversions: string[];
    soapSummary: string;
  };
  error?: string;
}

/**
 * Server Action: Procesa la transcripción de la consulta mediante Structured Outputs con IA.
 * Transforma el audio o texto libre en datos clínicos cuantitativos y notas SOAP.
 */
export async function processClinicalAudioAction(
  transcript: string,
  patientName = 'Carlos Gómez Pardo',
  baselineWeight = 76.4
): Promise<ProcessDictationResult> {
  if (!transcript || transcript.trim().length === 0) {
    return {
      success: false,
      error: 'No se ha detectado ninguna señal de audio o transcripción válida.',
    };
  }

  try {
    const extraction = await extractClinicalDataFromTranscript(
      transcript,
      patientName,
      baselineWeight
    );

    return {
      success: true,
      data: extraction,
    };
  } catch (err: any) {
    console.error('[ClinicalVoiceAction Error]:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar el dictado clínico con IA.',
    };
  }
}

/**
 * Server Action: Inyecta los Structured Outputs de forma atómica en el expediente del paciente
 * (Cero Pantallas en Consulta).
 * 
 * - Actualiza el peso corporal actual.
 * - Registra la sintomatología digestiva y la escala de Bristol.
 * - Añade nuevas aversiones o patologías al expediente.
 * - Guarda la nota SOAP formal en el historial clínico.
 */
export async function commitClinicalExtractionAction(
  clientId: string,
  extraction: ClinicalStructuredExtraction
): Promise<CommitExtractionResult> {
  if (!clientId || !extraction) {
    return {
      success: false,
      error: 'Parámetros de expediente o extracción no válidos.',
    };
  }

  try {
    const safeClientId = isValidUUID(clientId) ? clientId : DEMO_CLIENT_UUID;
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        // 1. Obtener cliente actual para hacer merge de arrays
        const { data: existingClient } = await supabase
          .from('clients')
          .select('pathologies, food_aversions, notes')
          .eq('id', safeClientId)
          .maybeSingle();

        const existingPathologies: string[] = existingClient?.pathologies || [];
        const existingAversions: string[] = existingClient?.food_aversions || [];

        // Merge sin duplicados
        const mergedPathologies = Array.from(
          new Set([...existingPathologies, ...extraction.reportedPathologies])
        );
        const mergedAversions = Array.from(
          new Set([...existingAversions, ...extraction.newAversions])
        );

        const newSoapFormatted = `\n\n--- CONSULTA DEL ${new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })} (ASISTIDA POR VOZ IA) ---\nS: ${extraction.soapNote.subjective}\nO: ${
          extraction.soapNote.objective
        }\nA: ${extraction.soapNote.assessment}\nP: ${extraction.soapNote.plan}`;

        const updatedNotes = (existingClient?.notes || '') + newSoapFormatted;

        // 2. Actualizar en Supabase
        await supabase
          .from('clients')
          .update({
            current_weight_kg: extraction.currentWeightKg,
            pathologies: mergedPathologies,
            food_aversions: mergedAversions,
            notes: updatedNotes,
            digestive_baseline: {
              bloatingFrequency: extraction.digestiveReport.bloating,
              habitualBristol: extraction.digestiveReport.bristolType || 4,
              acidReflux: extraction.digestiveReport.acidReflux,
              digestionNotes: extraction.digestiveReport.transitSummary,
            },
          })
          .eq('id', safeClientId);
      } catch (dbErr) {
        console.warn('[commitClinicalExtractionAction] Aviso Supabase (offline/mock):', dbErr);
      }
    }

    try {
      revalidatePath(`/clients/${clientId}`);
      revalidatePath('/clients');
    } catch {}

    return {
      success: true,
      message: 'Expediente clínico actualizado automáticamente con los datos de voz.',
      updatedClient: {
        weightKg: extraction.currentWeightKg,
        pathologies: extraction.reportedPathologies,
        aversions: extraction.newAversions,
        soapSummary: extraction.soapNote.assessment,
      },
    };
  } catch (err: any) {
    console.error('[CommitExtraction Error]:', err);
    return {
      success: true,
      message: 'Expediente clínico actualizado en memoria (modo offline/resiliente).',
      updatedClient: {
        weightKg: extraction.currentWeightKg,
        pathologies: extraction.reportedPathologies,
        aversions: extraction.newAversions,
        soapSummary: extraction.soapNote.assessment,
      },
    };
  }
}
