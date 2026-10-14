-- ==============================================================================
-- MIGRACIÓN 0011: BÚSQUEDA SEMÁNTICA CLÍNICA CON PGVECTOR (Fase 2 - Bloque 11)
-- ==============================================================================

-- 1. Habilitar la extensión pgvector en PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Añadir columna 'embedding' (vector de 1536 dimensiones - estándar OpenAI text-embedding-3-small)
-- y etiquetas clínicas para trazabilidad de perfil metabólico
ALTER TABLE public.foods 
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS clinical_tags text[] DEFAULT '{}'::text[];

-- 3. Crear índice HNSW (Hierarchical Navigable Small World) sobre la columna embedding
-- Usando distancia coseno (vector_cosine_ops) para búsquedas de similitud angular ultrarrápidas O(log N)
CREATE INDEX IF NOT EXISTS idx_foods_embedding_hnsw 
ON public.foods 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Función Almacenada (RPC): match_foods_semantically
-- Recibe el vector de consulta, un umbral de similitud mínima (match_threshold) y límite de resultados.
-- Devuelve los alimentos ordenados por proximidad angular en el espacio semántico-nutricional.
CREATE OR REPLACE FUNCTION public.match_foods_semantically(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.25,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    name text,
    category text,
    kcal numeric,
    protein_g numeric,
    carbs_g numeric,
    fat_g numeric,
    fiber_g numeric,
    iron_mg numeric,
    calcium_mg numeric,
    omega3_g numeric,
    omega6_g numeric,
    clinical_tags text[],
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.name,
        f.category,
        f.kcal,
        f.protein_g,
        f.carbs_g,
        f.fat_g,
        COALESCE(f.fiber_g, 0) AS fiber_g,
        COALESCE(f.iron_mg, 0) AS iron_mg,
        COALESCE(f.calcium_mg, 0) AS calcium_mg,
        COALESCE(f.omega3_g, 0) AS omega3_g,
        COALESCE(f.omega6_g, 0) AS omega6_g,
        f.clinical_tags,
        (1 - (f.embedding <=> query_embedding))::float AS similarity
    FROM public.foods f
    WHERE f.embedding IS NOT NULL
      AND (1 - (f.embedding <=> query_embedding)) >= match_threshold
    ORDER BY f.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Concesión de permisos de ejecución para roles anon y authenticated
GRANT EXECUTE ON FUNCTION public.match_foods_semantically(vector, float, int) TO anon, authenticated, service_role;
