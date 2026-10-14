'use server';

import {
  searchFoodsSemantically,
  type FoodWithSimilarity,
  type SemanticSearchOptions,
} from '@/lib/services/clinicalEmbeddingService';

export interface SemanticSearchActionResponse {
  success: boolean;
  foods: FoodWithSimilarity[];
  executionTimeMs: number;
  source: 'pgvector_rpc' | 'local_vector_engine';
  query: string;
  error?: string;
}

/**
 * Server Action: Búsqueda Semántica Clínica Asistida por Embeddings Vectoriales (pgvector)
 */
export async function searchFoodsSemanticallyAction(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchActionResponse> {
  try {
    const trimmed = query?.trim() || '';
    if (!trimmed) {
      return {
        success: true,
        foods: [],
        executionTimeMs: 0,
        source: 'local_vector_engine',
        query: '',
      };
    }

    const result = await searchFoodsSemantically(trimmed, options);

    return {
      success: true,
      foods: result.foods,
      executionTimeMs: result.executionTimeMs,
      source: result.source,
      query: trimmed,
    };
  } catch (err: any) {
    console.error('[searchFoodsSemanticallyAction] Error en búsqueda semántica:', err);
    return {
      success: false,
      foods: [],
      executionTimeMs: 0,
      source: 'local_vector_engine',
      query,
      error: err?.message || 'Error desconocido al procesar búsqueda vectorial',
    };
  }
}
