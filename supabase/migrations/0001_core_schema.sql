-- =========================================================
-- 0001 · Esquema core plataforma nutricionista
-- Ejecutar en Supabase SQL Editor (proyecto en región UE)
-- =========================================================
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- Perfiles (vinculados a auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin','client')),
  full_name text, email text, phone text,
  created_at timestamptz default now()
);

create table nutritionists (
  id uuid primary key references profiles(id) on delete cascade,
  timezone text default 'Europe/Madrid',
  google_calendar_id text,
  google_refresh_token_enc text,          -- cifrado (Vault)
  slot_minutes int default 30,
  buffer_minutes int default 10,
  working_hours jsonb                     -- {"mon":[["09:00","14:00"],["16:00","19:00"]],...}
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references nutritionists(id),
  profile_id uuid unique references profiles(id),   -- null hasta aceptar invitación
  full_name text not null, email text, phone text,
  birth_date date, height_cm numeric, goal text,
  allergies text[], notes text,
  status text not null default 'pending_review'
    check (status in ('active','pending_review','inactive')),
  consent_at timestamptz,                 -- consentimiento RGPD
  created_at timestamptz default now()
);
create index on clients(nutritionist_id);

create table plans (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references nutritionists(id),
  name text not null, duration_days int, price_cents int,
  review_interval_days int default 15,
  stripe_price_id text, active boolean default true
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  plan_id uuid not null references plans(id),
  starts_on date, ends_on date,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','active','expired','cancelled')),
  stripe_session_id text,
  created_at timestamptz default now()
);
create index on subscriptions(client_id);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  nutritionist_id uuid not null references nutritionists(id),
  subscription_id uuid references subscriptions(id),
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','cancelled','no_show')),
  google_event_id text, meet_url text, notes text,
  check (ends_at > starts_at),
  exclude using gist (
    nutritionist_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'scheduled')
);
create index on appointments(client_id);

create table booking_tokens (
  token text primary key,
  client_id uuid not null references clients(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  expires_at timestamptz not null,
  used_at timestamptz
);

-- Catálogo de alimentos (macros por 100 g)
create table foods (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text,
  kcal numeric, protein_g numeric, carbs_g numeric, fat_g numeric,
  default_unit text default 'g'
);
create index on foods (lower(name));

create table diet_templates (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references nutritionists(id),
  name text not null, description text, target_kcal int, tags text[],
  version int default 1, archived boolean default false,
  created_at timestamptz default now()
);

create table template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references diet_templates(id) on delete cascade,
  day_index smallint not null,
  meal_slot text not null
    check (meal_slot in ('desayuno','media_manana','comida','merienda','cena')),
  position smallint default 0,
  food_id uuid references foods(id),
  free_text text,
  quantity numeric, unit text default 'g', notes text
);
create index on template_items(template_id);

create table assigned_diets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  template_id uuid references diet_templates(id) on delete set null,
  template_version int,
  name text, valid_from date, valid_to date,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz default now()
);
create index on assigned_diets(client_id);

create table assigned_diet_items (
  id uuid primary key default gen_random_uuid(),
  diet_id uuid not null references assigned_diets(id) on delete cascade,
  day_index smallint not null,
  meal_slot text not null
    check (meal_slot in ('desayuno','media_manana','comida','merienda','cena')),
  position smallint default 0,
  food_id uuid references foods(id), free_text text,
  quantity numeric, unit text default 'g', notes text,
  source_item_id uuid references template_items(id) on delete set null,
  is_modified boolean default false
);
create index on assigned_diet_items(diet_id);

-- Copy-on-assign: clona la plantilla en una dieta draft independiente
create or replace function assign_template(p_client_id uuid, p_template_id uuid)
returns uuid language plpgsql as $$
declare v_diet_id uuid;
begin
  insert into assigned_diets (client_id, template_id, template_version, name)
  select p_client_id, t.id, t.version, t.name
  from diet_templates t where t.id = p_template_id
  returning id into v_diet_id;

  if v_diet_id is null then
    raise exception 'Plantilla % no encontrada', p_template_id;
  end if;

  insert into assigned_diet_items
    (diet_id, day_index, meal_slot, position, food_id, free_text,
     quantity, unit, notes, source_item_id)
  select v_diet_id, day_index, meal_slot, position, food_id, free_text,
         quantity, unit, notes, id
  from template_items where template_id = p_template_id;

  return v_diet_id;
end $$;

-- Alertas de revisión (group by corregido)
create or replace view review_alerts as
select c.id, c.full_name, c.nutritionist_id,
       max(a.starts_at) as last_visit,
       now()::date - coalesce(max(a.starts_at)::date, s.starts_on) as days_since
from clients c
join subscriptions s on s.client_id = c.id and s.status = 'active'
join plans p on p.id = s.plan_id
left join appointments a on a.client_id = c.id and a.status = 'completed'
group by c.id, c.full_name, c.nutritionist_id, s.starts_on, p.review_interval_days
having now()::date - coalesce(max(a.starts_at)::date, s.starts_on) >= p.review_interval_days;

-- NOTA: RLS se añade en 0002. Hasta entonces, permitir lectura de profiles
-- para la "prueba de fuego" (eliminar en 0002):
alter table profiles enable row level security;
create policy "tmp_read_profiles" on profiles for select using (true);
