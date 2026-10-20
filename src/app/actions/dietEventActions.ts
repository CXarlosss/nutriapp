'use server';

import { revalidatePath } from 'next/cache';
import {
  appendDietEvent,
  getDietEventStream,
  getProjectedDiet,
  AppendEventParams,
  AppendEventResult,
} from '@/lib/eventsourcing/eventStoreService';
import { resolveCurrentClinicId } from '@/lib/services/tenantResolver';
import { ProjectedDietState } from '@/lib/eventsourcing/dietProjector';
import { DietEvent } from '@/lib/eventsourcing/dietEventTypes';

/**
 * Server Action: Inserta un evento inmutable en el Event Store clínico
 * Se ejecuta en lugar de un comando UPDATE destructivo.
 */
export async function appendDietEventAction(
  params: AppendEventParams
): Promise<AppendEventResult> {
  const clinicId = await resolveCurrentClinicId();
  const result = await appendDietEvent({ ...params, clinicId });

  if (result.success) {
    revalidatePath(`/dietas/${params.streamId}`);
    revalidatePath('/dietas/creador');
  }

  return result;
}

/**
 * Server Action: Recupera el stream de eventos de una dieta
 */
export async function getDietEventStreamAction(
  streamId: string,
  targetVersion?: number
): Promise<DietEvent[]> {
  return await getDietEventStream(streamId, targetVersion);
}

/**
 * Server Action: Obtiene el estado proyectado de la dieta (CQRS Read Model)
 * Permite Time Travel pasando targetVersion
 */
export async function getProjectedDietAction(
  streamId: string,
  targetVersion?: number
): Promise<ProjectedDietState> {
  return await getProjectedDiet(streamId, targetVersion);
}
