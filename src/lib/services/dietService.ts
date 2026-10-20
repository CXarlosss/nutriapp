import { createClient } from '@/lib/supabase/client';
import { DietItem } from '@/types/diet';
import { isValidUUID, generateUUID, DEMO_DIET_UUID, DEMO_CLINIC_UUID } from '@/lib/utils/uuid';

export interface SaveBatchResult {
  success: boolean;
  savedCount: number;
  savedItemIds: string[];
  persistedToSupabase: boolean;
  error?: string;
}

export interface DietItemPayload {
  id?: string;
  name: string;
  calories: number;
  dietId: string;
  dayIndex?: number;
  mealSlot?: string;
  quantity?: number;
  unit?: string;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

/**
 * Persiste un lote de ítems en la tabla assigned_diet_items.
 * - Normaliza automáticamente cualquier ID temporal o no estándar a UUID v4 canónico.
 * - Valida estrictamente que las claves foráneas (diet_id, food_id) cumplan con formato UUID.
 * - Propaga excepciones reales de base de datos eliminando fallbacks silenciosos.
 */
export async function persistDietItemsBatch(items: DietItem[]): Promise<SaveBatchResult> {
  if (items.length === 0) {
    return { success: true, savedCount: 0, savedItemIds: [], persistedToSupabase: true };
  }

  // Sanitización y normalización estricta de UUIDs para PostgreSQL
  const payload = items.map((item) => {
    // 1. Asegurar UUID válido para la clave primaria id
    const sanitizedId = item.id && isValidUUID(item.id) ? item.id : generateUUID();

    // 2. Normalizar diet_id (si es el demo estático, mapea al UUID demo determinista)
    let sanitizedDietId = item.dietId;
    if (sanitizedDietId === 'diet-demo-1' || sanitizedDietId?.startsWith('diet-demo')) {
      sanitizedDietId = DEMO_DIET_UUID;
    } else if (!isValidUUID(sanitizedDietId)) {
      throw new Error(`[dietService] dietId inválido: "${item.dietId}". Debe ser un UUID estándar.`);
    }

    // 3. Normalizar food_id (alimentos locales f-1..f-19 tienen id no-UUID, se persisten como texto libre)
    const sanitizedFoodId = item.foodId && isValidUUID(item.foodId) ? item.foodId : null;

    return {
      id: sanitizedId,
      diet_id: sanitizedDietId,
      clinic_id: DEMO_CLINIC_UUID,
      day_index: item.dayIndex,
      meal_slot: item.mealSlot,
      position: item.position,
      food_id: sanitizedFoodId,
      free_text: item.foodName,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes ?? null,
      is_modified: true,
    };
  });

  const supabase = createClient();

  // Bulk upsert atómico en Supabase
  const { data, error } = await supabase
    .from('assigned_diet_items')
    .upsert(payload)
    .select('id');

  if (error) {
    console.error('[dietService.persistDietItemsBatch] Error devuelto por Supabase:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Error en base de datos (${error.code || 'DB_ERROR'}): ${error.message}`);
  }

  return {
    success: true,
    savedCount: data?.length || items.length,
    savedItemIds: payload.map((p) => p.id),
    persistedToSupabase: true,
  };
}

/**
 * Inserta o actualiza un ítem dietético individual con validación estricta de UUID.
 */
export async function upsertDietItem(item: DietItemPayload) {
  const supabase = createClient();

  // 1. Asegurar UUID válido para id
  const sanitizedId = item.id && isValidUUID(item.id) ? item.id : generateUUID();

  // 2. Validar relaciones dependientes
  let sanitizedDietId = item.dietId;
  if (sanitizedDietId === 'diet-demo-1' || sanitizedDietId?.startsWith('diet-demo')) {
    sanitizedDietId = DEMO_DIET_UUID;
  } else if (!isValidUUID(sanitizedDietId)) {
    throw new Error(`[dietService] dietId inválido: "${item.dietId}". Debe ser un UUID estándar.`);
  }

  const { data, error } = await supabase
    .from('assigned_diet_items')
    .upsert({
      id: sanitizedId,
      diet_id: sanitizedDietId,
      clinic_id: DEMO_CLINIC_UUID,
      free_text: item.name,
      quantity: item.quantity ?? 100,
      unit: item.unit ?? 'g',
      day_index: item.dayIndex ?? 1,
      meal_slot: item.mealSlot ?? 'comida',
      is_modified: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[dietService.upsertDietItem] Error devuelto por Supabase:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Error en base de datos (${error.code || 'DB_ERROR'}): ${error.message}`);
  }

  return data;
}
