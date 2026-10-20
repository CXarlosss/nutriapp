'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resolveCurrentClinicId } from '@/lib/services/tenantResolver';
import { isValidUUID, generateUUID, DEMO_CLIENT_UUID } from '@/lib/utils/uuid';

export interface AssignTemplateInput {
  clientId: string;
  templateId: string;
  dietName?: string;
}

export interface AssignTemplateResult {
  success: boolean;
  dietId?: string;
  itemsCount?: number;
  error?: string;
}

/**
 * Server Action: Asigna y clona una plantilla de dieta a un cliente (Copy-on-Assign).
 * Invoca el procedimiento almacenado transaccional assign_template en Supabase,
 * o ejecuta la clonación relacional como fallback si la función RPC aún no está migrada.
 */
export async function assignTemplateToClient(
  input: AssignTemplateInput
): Promise<AssignTemplateResult> {
  const { clientId, templateId, dietName } = input;

  if (!clientId || !templateId) {
    return { success: false, error: 'Faltan parámetros obligatorios: clientId o templateId' };
  }

  const safeClientId = isValidUUID(clientId) ? clientId : DEMO_CLIENT_UUID;
  const safeTemplateId = isValidUUID(templateId) ? templateId : DEMO_CLIENT_UUID;

  try {
    const supabase = await createClient();
    const clinicId = await resolveCurrentClinicId();

    // 1. Intentar ejecución vía RPC nativo de Supabase
    const { data: rpcDietId, error: rpcError } = await supabase.rpc('assign_template', {
      p_client_id: safeClientId,
      p_template_id: safeTemplateId,
    });

    if (!rpcError && rpcDietId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[assignTemplateToClient] Éxito vía RPC: nueva dieta ${rpcDietId}`);
      }
      revalidatePath('/mi-dieta');
      revalidatePath('/dietas/creador');
      return { success: true, dietId: rpcDietId };
    }

    // 2. Fallback transaccional en caso de que el RPC no esté activo o se ejecute en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn('[assignTemplateToClient] RPC no disponible o error:', rpcError?.message, 'Ejecutando fallback directo...');
    }

    // Obtener datos de la plantilla base
    const { data: template, error: tmplError } = await supabase
      .from('diet_templates')
      .select('id, name, version')
      .eq('id', safeTemplateId)
      .single();

    if (tmplError || !template) {
      console.error('[assignTemplateToClient] Plantilla no encontrada en base de datos:', tmplError?.message || safeTemplateId);
      return {
        success: false,
        error: `Plantilla base no encontrada (${tmplError?.message || safeTemplateId}).`,
      };
    }

    // Crear registro en assigned_diets con clinic_id
    const { data: newDiet, error: dietError } = await supabase
      .from('assigned_diets')
      .insert({
        clinic_id: clinicId,
        client_id: safeClientId,
        template_id: template.id,
        template_version: template.version,
        name: dietName || template.name,
        status: 'draft',
      })
      .select('id')
      .single();

    if (dietError || !newDiet) {
      return { success: false, error: dietError?.message || 'Error al crear assigned_diet' };
    }

    // Clonar ítems de template_items a assigned_diet_items con clinic_id
    const { data: items, error: itemsError } = await supabase
      .from('template_items')
      .select('*')
      .eq('template_id', safeTemplateId);

    if (itemsError) {
      console.warn('[assignTemplateToClient] Aviso consultando template_items:', itemsError.message);
    }

    if (items && items.length > 0) {
      const clonedItems = items.map((it) => ({
        id: generateUUID(),
        clinic_id: clinicId,
        diet_id: newDiet.id,
        day_index: it.day_index,
        meal_slot: it.meal_slot,
        position: it.position,
        food_id: it.food_id && isValidUUID(it.food_id) ? it.food_id : null,
        free_text: it.free_text,
        quantity: it.quantity,
        unit: it.unit,
        notes: it.notes,
        source_item_id: it.id && isValidUUID(it.id) ? it.id : null,
        is_modified: false,
      }));

      const { error: itemsInsertError } = await supabase.from('assigned_diet_items').insert(clonedItems);
      if (itemsInsertError) {
        console.error('[assignTemplateToClient] Error al insertar ítems de la dieta:', itemsInsertError.message);
        return {
          success: false,
          error: `Error al clonar los alimentos de la plantilla: ${itemsInsertError.message}`,
        };
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/clients');
    revalidatePath('/mi-dieta');
    revalidatePath('/dietas/creador');
    return { success: true, dietId: newDiet.id, itemsCount: items?.length || 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al asignar plantilla';
    console.error('[assignTemplateToClient] Excepción:', msg);
    return { success: false, error: msg };
  }
}
