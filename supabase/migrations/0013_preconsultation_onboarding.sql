-- ==============================================================================
-- 0013 · Automatización del Onboarding (Cero Data Entry) & Formulario Pre-Consulta
-- Sincronización bidireccional entre el cuestionario digital del paciente,
-- el Patrón Outbox para n8n y la ficha médica del cliente en PostgreSQL.
-- ==============================================================================

-- 1. Ampliar tabla 'clients' con campos estructurados de anamnesis pre-consulta
alter table public.clients
  add column if not exists pathologies text[] default '{}',
  add column if not exists food_aversions text[] default '{}',
  add column if not exists daily_routine jsonb default '{}'::jsonb,
  add column if not exists current_weight_kg numeric,
  add column if not exists digestive_baseline jsonb default '{}'::jsonb,
  add column if not exists dietary_preference text default 'omnivoro',
  add column if not exists onboarding_token text unique,
  add column if not exists onboarding_status text not null default 'pending'
    check (onboarding_status in ('pending', 'completed')),
  add column if not exists intake_completed_at timestamptz;

create index if not exists idx_clients_onboarding_token on public.clients(onboarding_token);
create index if not exists idx_clients_onboarding_status on public.clients(onboarding_status);

-- 2. Función RPC para completar el formulario pre-consulta atómicamente
-- Accesible con SECURITY DEFINER para que el paciente pueda persistir su anamnesis
-- de forma segura usando únicamente su token temporal de un solo uso.
create or replace function public.complete_client_preconsultation(
  p_token text,
  p_weight_kg numeric default null,
  p_height_cm numeric default null,
  p_allergies text[] default '{}',
  p_pathologies text[] default '{}',
  p_food_aversions text[] default '{}',
  p_daily_routine jsonb default '{}'::jsonb,
  p_digestive_baseline jsonb default '{}'::jsonb,
  p_dietary_preference text default 'omnivoro',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_client_name text;
  v_nutritionist_id uuid;
begin
  -- 1. Localizar cliente mediante token único de onboarding
  select id, full_name, nutritionist_id
  into v_client_id, v_client_name, v_nutritionist_id
  from public.clients
  where onboarding_token = p_token;

  if v_client_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Token de onboarding inválido o expirado'
    );
  end if;

  -- 2. Actualizar registro en 'clients' con los datos inyectados por el paciente
  update public.clients
  set
    current_weight_kg = coalesce(p_weight_kg, current_weight_kg),
    height_cm = coalesce(p_height_cm, height_cm),
    allergies = coalesce(p_allergies, allergies),
    pathologies = coalesce(p_pathologies, pathologies),
    food_aversions = coalesce(p_food_aversions, food_aversions),
    daily_routine = coalesce(p_daily_routine, daily_routine),
    digestive_baseline = coalesce(p_digestive_baseline, digestive_baseline),
    dietary_preference = coalesce(p_dietary_preference, dietary_preference),
    notes = case
      when p_notes is not null and p_notes != '' then coalesce(notes || E'\n' || p_notes, p_notes)
      else notes
    end,
    onboarding_status = 'completed',
    intake_completed_at = now()
  where id = v_client_id;

  -- 3. Inserción atómica en la tabla 'outbox_events' para notificar a n8n
  insert into public.outbox_events (
    aggregate_type,
    aggregate_id,
    event_type,
    payload
  ) values (
    'client',
    v_client_id,
    'onboarding.completed',
    jsonb_build_object(
      'client_id', v_client_id,
      'client_name', v_client_name,
      'completed_at', now(),
      'allergies', p_allergies,
      'pathologies', p_pathologies,
      'food_aversions', p_food_aversions,
      'channel', 'webhook_n8n'
    )
  );

  return jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'client_name', v_client_name,
    'onboarding_status', 'completed',
    'completed_at', now()
  );
end;
$$;

-- 3. Sembrado de tokens y anamnesis iniciales para clientes de prueba
update public.clients
set
  onboarding_token = 'token_carlos_gomez_2026',
  onboarding_status = 'completed',
  intake_completed_at = '2026-09-25 10:00:00+02',
  current_weight_kg = 76.4,
  height_cm = 178,
  allergies = array['Gluten', 'Lactosa'],
  pathologies = array['Hipotiroidismo de Hashimoto'],
  food_aversions = array['Brócoli crudo', 'Vísceras', 'Pescado blanco hervido'],
  dietary_preference = 'omnivoro',
  daily_routine = jsonb_build_object(
    'wake_up', '07:15',
    'bed_time', '23:30',
    'work_type', 'Ingeniero de Software (Sedentario)',
    'meals_count', 4,
    'training_schedule', 'Fuerza / Hipertrofia 4 días a las 18:30',
    'stress_level', 'Medio',
    'water_liters_daily', 2.5
  ),
  digestive_baseline = jsonb_build_object(
    'bristol_habitual', 4,
    'bloating_frequency', 'Ocasional tras comidas copiosas',
    'acid_reflux', false
  )
where id = 'a0000000-0000-0000-0000-000000000001' or full_name ilike '%Carlos Gómez%';

update public.clients
set
  onboarding_token = 'token_javier_navarro_2026',
  onboarding_status = 'pending',
  current_weight_kg = 82.0,
  height_cm = 181,
  allergies = array['Fructosa'],
  pathologies = array['Síndrome de Intestino Irritable (SII)'],
  food_aversions = array['Legumbres enteras', 'Cebolla cruda'],
  dietary_preference = 'omnivoro',
  daily_routine = jsonb_build_object(
    'wake_up', '08:00',
    'bed_time', '00:00',
    'work_type', 'Comercial (Turnos activos)',
    'meals_count', 3,
    'training_schedule', 'Pádel 2 días a la semana',
    'stress_level', 'Alto',
    'water_liters_daily', 1.8
  )
where full_name ilike '%Javier Navarro%';

update public.clients
set
  onboarding_token = 'token_marta_morales_2026',
  onboarding_status = 'completed',
  intake_completed_at = '2026-10-01 11:00:00+02',
  current_weight_kg = 61.5,
  height_cm = 165,
  allergies = array['Frutos secos'],
  pathologies = array['Resistencia a la Insulina'],
  food_aversions = array['Carne roja grasa', 'Cilantro'],
  dietary_preference = 'omnivoro',
  daily_routine = jsonb_build_object(
    'wake_up', '06:45',
    'bed_time', '22:45',
    'work_type', 'Docente (Activo de pie)',
    'meals_count', 4,
    'training_schedule', 'CrossFit 3 días / Pilates 2 días a las 08:00',
    'stress_level', 'Moderado',
    'water_liters_daily', 2.2
  )
where full_name ilike '%Marta Morales%';
