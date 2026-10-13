-- ==============================================================================
-- 0006 · Motor de Validación Clínica y Soporte Científico (CDSS)
-- Tabla de Guías de Evidencia Científica y Micronutrientes en Alimentos
-- ==============================================================================

-- 1. Ampliar tabla 'foods' con micronutrientes críticos
alter table public.foods
  add column if not exists fiber_g numeric default 0,
  add column if not exists calcium_mg numeric default 0,
  add column if not exists iron_mg numeric default 0,
  add column if not exists omega3_g numeric default 0,
  add column if not exists omega6_g numeric default 0;

-- 2. Crear tabla de guías y consensos científicos (scientific_guidelines)
create table if not exists public.scientific_guidelines (
  id uuid primary key default gen_random_uuid(),
  target_profile text not null,               -- 'deportista', 'sedentario', 'general', 'recomposicion'
  nutrient_or_ratio text not null,            -- 'proteina_kg', 'fibra_total', 'omega3_omega6_ratio', 'calcio_mg', 'hierro_mg'
  min_value numeric,
  max_value numeric,
  unit text default '',
  title text not null,
  doi_reference text not null,
  warning_message text not null,
  severity text not null default 'warning' check (severity in ('critical', 'warning', 'info')),
  created_at timestamptz default now()
);

-- 3. Habilitar RLS en scientific_guidelines
alter table public.scientific_guidelines enable row level security;
grant select on public.scientific_guidelines to anon, authenticated;

drop policy if exists "guidelines_read_all" on public.scientific_guidelines;
create policy "guidelines_read_all"
  on public.scientific_guidelines
  for select
  to anon, authenticated
  using (true);

-- 4. Semilla de Guías Clínicas de Referencia (ISSN, OMS, EFSA)
insert into public.scientific_guidelines 
  (target_profile, nutrient_or_ratio, min_value, max_value, unit, title, doi_reference, warning_message, severity)
values
  (
    'deportista',
    'proteina_kg',
    1.4,
    2.4,
    'g/kg',
    'International Society of Sports Nutrition (ISSN) Position Stand: protein and exercise',
    'https://doi.org/10.1186/s12970-017-0177-8',
    'Aporte proteico insuficiente para perfil activo/deportista (<1.4 g/kg peso corporal). Compromete síntesis proteica miofibrilar y recuperación.',
    'critical'
  ),
  (
    'general',
    'fibra_total',
    25.0,
    45.0,
    'g/día',
    'EFSA Panel on Dietetic Products: Scientific Opinion on Dietary Reference Values for fibre',
    'https://doi.org/10.2903/j.efsa.2010.1462',
    'Ingesta de fibra alimentaria inferior a la recomendación mínima de 25 g/día. Riesgo de alteración de microbiota intestinal y saciedad inadecuada.',
    'warning'
  ),
  (
    'general',
    'omega3_omega6_ratio',
    0.2,
    1.0,
    'ratio',
    'The importance of the ratio of omega-6/omega-3 essential fatty acids (Simopoulos)',
    'https://doi.org/10.1016/j.biopha.2006.07.080',
    'Ratio Omega-6 a Omega-3 desbalanceado (>5:1). Predispone a un perfil metabólico proinflamatorio.',
    'warning'
  ),
  (
    'general',
    'calcio_mg',
    950.0,
    2000.0,
    'mg/día',
    'EFSA Dietary Reference Values for calcium',
    'https://doi.org/10.2903/j.efsa.2015.4101',
    'Aporte de calcio por debajo del umbral mínimo de seguridad ósea y neuromuscular (950 mg/día).',
    'warning'
  ),
  (
    'general',
    'hierro_mg',
    11.0,
    45.0,
    'mg/día',
    'Scientific Opinion on Dietary Reference Values for iron (EFSA)',
    'https://doi.org/10.2903/j.efsa.2015.4254',
    'Aporte de hierro inferior al requerimiento medio fisiológico (11 mg/día). Riesgo de ferropenia subyacente.',
    'warning'
  ),
  (
    'sedentario',
    'proteina_kg',
    0.8,
    1.2,
    'g/kg',
    'WHO/FAO/UNU Expert Consultation on Protein and Amino Acid Requirements',
    'https://doi.org/10.1093/ajcn/87.5.1576S',
    'Aporte proteico por debajo de la ingesta dietética de referencia basal (0.8 g/kg) en población sedentaria.',
    'critical'
  )
on conflict do nothing;

-- 5. Actualizar catálogo básico de alimentos con valores de micronutrientes
update public.foods set 
  fiber_g = 10.6, calcium_mg = 54, iron_mg = 4.7, omega3_g = 0.1, omega6_g = 2.4 
where name ilike '%Avena%';

update public.foods set 
  fiber_g = 2.6, calcium_mg = 47, iron_mg = 0.7, omega3_g = 0.1, omega6_g = 0.05 
where name ilike '%Brócoli%';

update public.foods set 
  fiber_g = 6.7, calcium_mg = 12, iron_mg = 0.6, omega3_g = 0.1, omega6_g = 1.7 
where name ilike '%Aguacate%';

update public.foods set 
  fiber_g = 0.0, calcium_mg = 12, iron_mg = 0.8, omega3_g = 2.2, omega6_g = 0.6 
where name ilike '%Salmón%';

update public.foods set 
  fiber_g = 0.0, calcium_mg = 15, iron_mg = 1.0, omega3_g = 0.05, omega6_g = 0.3 
where name ilike '%Pollo%';

update public.foods set 
  fiber_g = 6.7, calcium_mg = 98, iron_mg = 2.9, omega3_g = 9.1, omega6_g = 38.1 
where name ilike '%Nueces%';

update public.foods set 
  fiber_g = 0.0, calcium_mg = 110, iron_mg = 0.1, omega3_g = 0.0, omega6_g = 0.05 
where name ilike '%Yogur%';
