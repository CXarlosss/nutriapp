'use server';

import { revalidatePath } from 'next/cache';
import type { PreConsultationFormData } from '@/types/diet';
import {
  getClientByOnboardingToken,
  submitPreConsultationForm,
} from '@/lib/services/onboardingService';

export interface SubmitPreConsultationResult {
  success: boolean;
  clientName?: string;
  error?: string;
}

/**
 * Server Action: Envío del Cuestionario Pre-Consulta Digital
 * 
 * 1. Valida el token del paciente.
 * 2. Inyecta los datos antropométricos, patologías, alergias, aversiones y rutinas
 *    directamente en la base de datos (PostgreSQL).
 * 3. Encola el evento 'onboarding.completed' en la tabla Outbox para notificar a n8n.
 * 4. Refresca la caché de las fichas clínicas para que la nutricionista vea todo al instante.
 */
export async function submitPreConsultationAction(
  token: string,
  formData: PreConsultationFormData
): Promise<SubmitPreConsultationResult> {
  if (!token) {
    return {
      success: false,
      error: 'Token de acceso no proporcionado o inválido.',
    };
  }

  if (!formData.fullName || formData.fullName.trim() === '') {
    return {
      success: false,
      error: 'El nombre completo es obligatorio.',
    };
  }

  try {
    const result = await submitPreConsultationForm(token, formData);

    if (result.success) {
      // Revalidar rutas para que la nutricionista tenga los datos actualizados
      try {
        revalidatePath('/clients');
        revalidatePath('/dashboard');
      } catch (err) {
        // En Server Actions es seguro ignorar fallos de revalidación en tests
      }

      return {
        success: true,
        clientName: result.clientName || formData.fullName,
      };
    } else {
      return {
        success: false,
        error: result.error || 'No se pudo guardar la información del cuestionario.',
      };
    }
  } catch (error: any) {
    console.error('[Onboarding Action Error]:', error);
    return {
      success: false,
      error: error.message || 'Error interno al procesar el cuestionario.',
    };
  }
}

/**
 * Server Action para obtener los datos del paciente desde el token (para SSR/Client)
 */
export async function getOnboardingPatientAction(token: string) {
  if (!token) return null;
  return await getClientByOnboardingToken(token);
}
