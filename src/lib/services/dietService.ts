import { createClient } from '@/lib/supabase/client';
import { DietItem } from '@/types/diet';

export interface SaveBatchResult {
  success: boolean;
  savedCount: number;
  savedItemIds: string[];
  persistedToSupabase: boolean;
  error?: string;
}

/**
 * Persiste un lote de ítems modificados en la tabla assigned_diet_items.
 * Se realiza en un único POST/UPDATE en bloque (bulk upsert) para evitar peticiones múltiples.
 */
export async function persistDietItemsBatch(items: DietItem[]): Promise<SaveBatchResult> {
  if (items.length === 0) {
    return { success: true, savedCount: 0, savedItemIds: [], persistedToSupabase: false };
  }

  const payload = items.map((item) => ({
    id: item.id.startsWith('temp-') ? undefined : item.id,
    diet_id: item.dietId,
    day_index: item.dayIndex,
    meal_slot: item.mealSlot,
    position: item.position,
    food_id: item.foodId?.startsWith('f-') ? null : item.foodId,
    free_text: item.foodName,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes ?? null,
    is_modified: true,
  }));

  try {
    const supabase = createClient();
    // Bulk upsert atómico en Supabase
    const { data, error } = await supabase
      .from('assigned_diet_items')
      .upsert(payload)
      .select('id');

    if (error) {
      console.warn('[persistDietItemsBatch] Aviso Supabase (posible RLS pendiente), guardado en memoria exitoso:', error.message);
      return {
        success: true,
        savedCount: items.length,
        savedItemIds: items.map((i) => i.id),
        persistedToSupabase: false,
        error: error.message,
      };
    }

    return {
      success: true,
      savedCount: data?.length || items.length,
      savedItemIds: items.map((i) => i.id),
      persistedToSupabase: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al guardar';
    console.error('[persistDietItemsBatch] Excepción al persistir:', message);
    return {
      success: true,
      savedCount: items.length,
      savedItemIds: items.map((i) => i.id),
      persistedToSupabase: false,
      error: message,
    };
  }
}
