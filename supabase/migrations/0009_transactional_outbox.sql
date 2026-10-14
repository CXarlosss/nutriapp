-- ==============================================================================
-- 0009 · Patrón Transactional Outbox y Eventos Asíncronos (CDC + n8n)
-- Desacopla el envío de notificaciones y emails de la ruta crítica de Next.js
-- ==============================================================================

-- 1. Tabla outbox_events para el patrón Transactional Outbox
create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,                       -- Ej: 'billing.payment_requested', 'appointment.scheduled'
  aggregate_type text not null,                   -- Ej: 'client', 'appointment', 'diet'
  aggregate_id text not null,                     -- ID de la entidad relacionada
  payload jsonb not null,                         -- Datos estructurados del evento (emails, URLs, importes)
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'published', 'failed')),
  attempts int not null default 0,                -- Contador de reintentos
  max_attempts int not null default 5,            -- Límite antes de pasar a 'failed'
  last_error text,                                -- Detalle del último fallo si existió
  published_at timestamptz,                       -- Momento exacto de entrega confirmada
  created_at timestamptz not null default now()   -- Momento de inserción atómica
);

-- Índices estratégicos para escaneo de alta velocidad por el worker/CDC
create index if not exists idx_outbox_events_status_created 
  on public.outbox_events(status, created_at);

create index if not exists idx_outbox_events_aggregate 
  on public.outbox_events(aggregate_type, aggregate_id);

-- 2. Notificación en tiempo real mediante pg_notify (CDC nativo de PostgreSQL)
create or replace function public.notify_outbox_event()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify(
    'outbox_events_channel',
    jsonb_build_object(
      'id', new.id,
      'event_type', new.event_type,
      'aggregate_type', new.aggregate_type,
      'aggregate_id', new.aggregate_id,
      'status', new.status,
      'created_at', new.created_at
    )::text
  );
  return new;
end;
$$;

drop trigger if exists trg_outbox_notify on public.outbox_events;
create trigger trg_outbox_notify
  after insert on public.outbox_events
  for each row
  execute function public.notify_outbox_event();

-- 3. Función RPC atómica para inserción en Outbox con SECURITY DEFINER
create or replace function public.enqueue_outbox_event(
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id text,
  p_payload jsonb,
  p_max_attempts int default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_created_at timestamptz;
begin
  insert into public.outbox_events (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    status,
    attempts,
    max_attempts,
    created_at
  ) values (
    p_event_type,
    p_aggregate_type,
    p_aggregate_id,
    p_payload,
    'pending',
    0,
    coalesce(p_max_attempts, 5),
    now()
  )
  returning id, created_at into v_event_id, v_created_at;

  return jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'event_type', p_event_type,
    'aggregate_type', p_aggregate_type,
    'aggregate_id', p_aggregate_id,
    'status', 'pending',
    'created_at', v_created_at
  );
end;
$$;

-- 4. Función RPC para marcar evento como publicado tras entrega a n8n
create or replace function public.mark_outbox_event_published(
  p_event_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.outbox_events
  set
    status = 'published',
    published_at = now()
  where id = p_event_id;

  return found;
end;
$$;

-- 5. Concesión de permisos
alter table public.outbox_events enable row level security;

-- Política de lectura y escritura para el servicio de backend y roles autenticados
drop policy if exists "outbox_service_access" on public.outbox_events;
create policy "outbox_service_access"
  on public.outbox_events
  for all
  using (true)
  with check (true);

grant select, insert, update on public.outbox_events to anon, authenticated, service_role;
grant execute on function public.enqueue_outbox_event(text, text, text, jsonb, int) to anon, authenticated, service_role;
grant execute on function public.mark_outbox_event_published(uuid) to anon, authenticated, service_role;
