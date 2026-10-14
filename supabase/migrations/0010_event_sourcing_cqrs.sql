-- ==============================================================================
-- 0010 · Event Sourcing y CQRS (Historial Clínico Inmutable y Time Travel)
-- Almacén de eventos Append-Only para trazabilidad médico-legal de dietas
-- ==============================================================================

-- 1. Tabla diet_events: Event Store inmutable por agregados (stream_id)
create table if not exists public.diet_events (
  id uuid primary key default gen_random_uuid(),
  stream_id text not null,                       -- Identificador de la dieta (agregado clínico)
  version int not null,                          -- Secuencia incremental (1, 2, 3...)
  event_type text not null,                      -- Ej: 'DietAssigned', 'FoodSwapped', 'TargetMacrosAdjusted'
  payload jsonb not null,                        -- Contenido del evento (cambios, alimentos, cantidades)
  metadata jsonb default '{}'::jsonb,            -- Autor, motivo clínico, IP, timestamp
  created_at timestamptz not null default now(),
  constraint uq_diet_stream_version unique (stream_id, version),
  constraint chk_version_positive check (version > 0)
);

-- Índices B-Tree optimizados para reconstrucción secuencial y auditoría
create index if not exists idx_diet_events_stream_version 
  on public.diet_events(stream_id, version asc);

create index if not exists idx_diet_events_type 
  on public.diet_events(event_type);

create index if not exists idx_diet_events_created 
  on public.diet_events(created_at desc);

-- 2. Garantía de Inmutabilidad Clínica Absoluta (Append-Only)
-- Ningún usuario ni administrador puede alterar o borrar eventos una vez registrados.
create or replace function public.prevent_diet_events_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Violación de Inmutabilidad Clínica: Los eventos en diet_events son estrictamente Append-Only y no pueden ser modificados ni eliminados (Stream: %, Versión: %).', old.stream_id, old.version;
end;
$$;

drop trigger if exists trg_prevent_diet_events_mutation on public.diet_events;
create trigger trg_prevent_diet_events_mutation
  before update or delete on public.diet_events
  for each row
  execute function public.prevent_diet_events_mutation();

-- 3. Inserción Atómica con Control de Concurrencia Optimista (OCC)
create or replace function public.append_diet_event(
  p_stream_id text,
  p_expected_version int,
  p_event_type text,
  p_payload jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_version int;
  v_new_version int;
  v_event_id uuid;
  v_created_at timestamptz;
begin
  -- Obtener la versión más alta actual del stream
  select coalesce(max(version), 0) into v_current_version
  from public.diet_events
  where stream_id = p_stream_id;

  -- Comprobar concurrencia optimista si se especificó expected_version >= 0
  if p_expected_version is not null and p_expected_version >= 0 and v_current_version != p_expected_version then
    return jsonb_build_object(
      'success', false,
      'error', 'ConcurrencyConflict: La versión esperada (' || p_expected_version || ') no coincide con la versión actual (' || v_current_version || ').',
      'current_version', v_current_version,
      'expected_version', p_expected_version
    );
  end if;

  v_new_version := v_current_version + 1;

  insert into public.diet_events (
    stream_id,
    version,
    event_type,
    payload,
    metadata,
    created_at
  ) values (
    p_stream_id,
    v_new_version,
    p_event_type,
    p_payload,
    p_metadata,
    now()
  )
  returning id, created_at into v_event_id, v_created_at;

  return jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'stream_id', p_stream_id,
    'version', v_new_version,
    'event_type', p_event_type,
    'created_at', v_created_at
  );
end;
$$;

-- 4. Proyector CQRS en Base de Datos (Función SQL de lectura histórica)
create or replace function public.get_diet_event_stream(
  p_stream_id text,
  p_target_version int default null
)
returns table (
  id uuid,
  stream_id text,
  version int,
  event_type text,
  payload jsonb,
  metadata jsonb,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.id,
    e.stream_id,
    e.version,
    e.event_type,
    e.payload,
    e.metadata,
    e.created_at
  from public.diet_events e
  where e.stream_id = p_stream_id
    and (p_target_version is null or e.version <= p_target_version)
  order by e.version asc;
$$;

-- 5. Tabla de proyección desnormalizada para lectura ultrarrápida (Read Model)
create table if not exists public.diet_projections (
  stream_id text primary key,
  current_version int not null,
  diet_name text,
  client_id text,
  target_kcal int,
  items_count int default 0,
  snapshot jsonb not null,
  last_event_at timestamptz not null default now()
);

create index if not exists idx_diet_projections_version on public.diet_projections(stream_id, current_version);

-- 6. Conceder permisos de ejecución
alter table public.diet_events enable row level security;
alter table public.diet_projections enable row level security;

drop policy if exists "allow_diet_events_access" on public.diet_events;
create policy "allow_diet_events_access"
  on public.diet_events
  for all
  using (true)
  with check (true);

drop policy if exists "allow_diet_projections_access" on public.diet_projections;
create policy "allow_diet_projections_access"
  on public.diet_projections
  for all
  using (true)
  with check (true);

grant select, insert on public.diet_events to anon, authenticated, service_role;
grant select, insert, update on public.diet_projections to anon, authenticated, service_role;
grant execute on function public.append_diet_event to anon, authenticated, service_role;
grant execute on function public.get_diet_event_stream to anon, authenticated, service_role;
