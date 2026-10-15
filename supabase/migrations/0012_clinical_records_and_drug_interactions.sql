-- ==============================================================================
-- MIGRACIÓN 0012: HISTORIA CLÍNICA, ANALÍTICAS SANGUÍNEAS Y ALERTAS FÁRMACO-NUTRIENTE
-- ==============================================================================

-- 1. Tabla de Analíticas Sanguíneas (Blood Tests)
CREATE TABLE IF NOT EXISTS public.client_blood_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    laboratory_name TEXT DEFAULT 'Laboratorio Clínico Central',
    notes TEXT,
    -- Marcadores clave (valores numéricos estructurados)
    ferritina_ug_l NUMERIC,         -- 30 - 300 µg/L
    hierro_serico_ug_dl NUMERIC,    -- 60 - 170 µg/dL
    vitamina_d_ng_ml NUMERIC,       -- 30 - 100 ng/mL
    vitamina_b12_pg_ml NUMERIC,     -- 200 - 900 pg/mL
    hba1c_porcentaje NUMERIC,       -- 4.0 - 5.6 %
    glucosa_basal_mg_dl NUMERIC,    -- 70 - 99 mg/dL
    colesterol_total_mg_dl NUMERIC, -- < 200 mg/dL
    colesterol_ldl_mg_dl NUMERIC,   -- < 100 mg/dL
    colesterol_hdl_mg_dl NUMERIC,   -- > 45 mg/dL
    trigliceridos_mg_dl NUMERIC,    -- < 150 mg/dL
    tsh_uiu_ml NUMERIC,             -- 0.4 - 4.0 µIU/mL
    t4_libre_ng_dl NUMERIC,         -- 0.8 - 1.8 ng/dL
    t3_libre_pg_ml NUMERIC,         -- 2.3 - 4.2 pg/mL
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_blood_tests_client_date 
ON public.client_blood_tests (client_id, test_date DESC);

-- 2. Tabla de Gestor de Síntomas y Digestiones (Digestive & Symptoms Tracker)
CREATE TABLE IF NOT EXISTS public.client_digestive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bloating_score INTEGER NOT NULL CHECK (bloating_score BETWEEN 0 AND 5),      -- 0=nulo, 5=severo
    reflux_score INTEGER NOT NULL CHECK (reflux_score BETWEEN 0 AND 5),        -- 0=nulo, 5=severo
    bristol_stool_type INTEGER NOT NULL CHECK (bristol_stool_type BETWEEN 1 AND 7), -- Escala de Bristol (1-7)
    chronic_fatigue_score INTEGER NOT NULL CHECK (chronic_fatigue_score BETWEEN 0 AND 5), -- 0=vitalidad, 5=astenia
    notes TEXT,
    correlation_tags TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_digestive_logs_client 
ON public.client_digestive_logs (client_id, evaluation_date DESC);

-- 3. Tabla de Farmacoterapia Activa del Paciente (Patient Medications)
CREATE TABLE IF NOT EXISTS public.client_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,                     -- ej. 'Levotiroxina'
    active_ingredient TEXT NOT NULL,             -- ej. 'Levothyroxine Sodium'
    dosage TEXT NOT NULL,                        -- ej. '75 mcg'
    timing_slot TEXT NOT NULL,                   -- 'desayuno', 'ayunas_manana', 'comida', 'cena', 'noche'
    indication TEXT,                             -- ej. 'Hipotiroidismo autoinmune (Hashimoto)'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_client_medications_client 
ON public.client_medications (client_id, active);

-- 4. Catálogo de Conocimiento Científico de Interacciones Fármaco-Nutriente
CREATE TABLE IF NOT EXISTS public.drug_nutrient_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_keyword TEXT NOT NULL,                  -- ej. 'levotiroxina'
    conflicting_nutrient_or_food TEXT NOT NULL,  -- ej. 'soja', 'calcio_alto', 'fibra_alta'
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title TEXT NOT NULL,
    biological_mechanism TEXT NOT NULL,
    clinical_recommendation TEXT NOT NULL,
    doi_reference TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Semilla de Conocimiento Clínico de Interacciones Fármaco-Nutriente (CDSS)
INSERT INTO public.drug_nutrient_interactions 
(drug_keyword, conflicting_nutrient_or_food, severity, title, biological_mechanism, clinical_recommendation, doi_reference)
VALUES
(
    'levotiroxina',
    'soja',
    'critical',
    'Quelación de Levotiroxina por Isoflavonas de Soja',
    'Las isoflavonas y proteínas de la soja bloquean la absorción enteral de la hormona tiroidea T4 libre en el lumen intestinal hasta un 50%, provocando descompensación de TSH.',
    'Separar la ingesta de soja, tofu o edamame al menos 4 horas de la toma de levotiroxina (idealmente reubicar en merienda o cena).',
    'https://doi.org/10.1089/thy.2014.0028'
),
(
    'levotiroxina',
    'fibra_alta',
    'warning',
    'Interferencia de Fibra Insoluble en la Biodisponibilidad de Tiroxina',
    'Grandes bolos de fibra dietética (>8g en una sola toma matutina) atrapan las moléculas de T4 reduciendo su pico plasmático.',
    'Evitar suplementos de salvado o ingestas masivas de avena/chía simultáneamente con el fármaco; espaciar 2 a 3 horas.',
    'https://doi.org/10.1210/jc.2007-0098'
),
(
    'sintrom',
    'vitamina_k_alta',
    'critical',
    'Antagonismo Competitivo Vitamina K vs Anticoagulantes Cumarínicos',
    'Los alimentos ricos en filoquinona (espinacas, acelgas, brócoli, kale) antagonizan el bloqueo de la epóxido reductasa, disminuyendo el INR y aumentando riesgo trombótico.',
    'Mantener un consumo estable y regular de vegetales de hoja verde (no introducir variaciones bruscas de más del 30% semanal).',
    'https://doi.org/10.1378/chest.11-2292'
),
(
    'metformina',
    'vitamina_b12_baja',
    'warning',
    'Malabsorción Ileal Crónica de Vitamina B12',
    'El uso continuado de metformina antagoniza el complejo calcio-dependiente de absorción del factor intrínseco en el íleon terminal.',
    'Monitorizar niveles séricos de Vitamina B12 cada 6 meses e incorporar fuentes alimentarias ricas en cobalamina o suplementación.',
    'https://doi.org/10.2337/dc16-0133'
),
(
    'atorvastatina',
    'pomelo',
    'critical',
    'Inhibición del Citocromo CYP3A4 por Furanocumarinas',
    'El pomelo / toronja inhibe de forma irreversible la enzima CYP3A4 intestinal, multiplicando las concentraciones séricas de la estatina hasta un 300% (riesgo de miopatía/rabdomiólisis).',
    'Contraindicación absoluta: Excluir el pomelo y su zumo de cualquier dieta en pacientes bajo tratamiento con estatinas lipofílicas.',
    'https://doi.org/10.1016/j.amjcard.2006.11.026'
)
ON CONFLICT DO NOTHING;

-- 6. Habilitar RLS y Políticas de Acceso
ALTER TABLE public.client_blood_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_digestive_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_nutrient_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blood_tests_access" ON public.client_blood_tests FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "digestive_logs_access" ON public.client_digestive_logs FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "medications_access" ON public.client_medications FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "interactions_read_all" ON public.drug_nutrient_interactions FOR SELECT TO anon, authenticated USING (true);

-- 7. Datos Semilla para Carlos Gómez Pardo ('a0000000-0000-0000-0000-000000000001')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.clients WHERE id = 'a0000000-0000-0000-0000-000000000001') THEN
    INSERT INTO public.client_blood_tests 
    (client_id, test_date, laboratory_name, notes, ferritina_ug_l, hierro_serico_ug_dl, vitamina_d_ng_ml, vitamina_b12_pg_ml, hba1c_porcentaje, glucosa_basal_mg_dl, colesterol_total_mg_dl, colesterol_ldl_mg_dl, colesterol_hdl_mg_dl, trigliceridos_mg_dl, tsh_uiu_ml, t4_libre_ng_dl, t3_libre_pg_ml)
    VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        '2026-06-15',
        'Laboratorio Clínico Sanitas',
        'Analítica basal pre-temporada de fuerza y recomposición',
        28.5, 62, 22.4, 380, 5.5, 92, 218, 134, 52, 160, 4.82, 0.95, 2.6
    ),
    (
        'a0000000-0000-0000-0000-000000000001',
        '2026-09-20',
        'Laboratorio Clínico Sanitas',
        'Control trimestral tras suplementación de Vit D3 y ajuste proteico',
        54.0, 98, 42.0, 420, 5.2, 86, 188, 108, 58, 110, 2.45, 1.25, 3.1
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.client_digestive_logs
    (client_id, week_start_date, evaluation_date, bloating_score, reflux_score, bristol_stool_type, chronic_fatigue_score, notes, correlation_tags)
    VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        '2026-09-28',
        '2026-10-04',
        4, 2, 2, 3,
        'Distensión notable por las tardes tras comida con legumbres sin triturar. Estreñimiento moderado.',
        ARRAY['FODMAPs', 'Legumbres', 'Estreñimiento']
    ),
    (
        'a0000000-0000-0000-0000-000000000001',
        '2026-10-05',
        '2026-10-11',
        1, 0, 4, 1,
        'Gran mejoría tras introducir alimentos de fácil digestión, hidratación matutina y cocción lenta. Tránsito regularizado a tipo 4.',
        ARRAY['Digestión Óptima', 'Buena tolerancia']
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.client_medications
    (client_id, drug_name, active_ingredient, dosage, timing_slot, indication, active)
    VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'Levotiroxina',
        'Levothyroxine Sodium',
        '75 mcg',
        'desayuno',
        'Hipotiroidismo subclínico / Tiroiditis de Hashimoto',
        true
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
