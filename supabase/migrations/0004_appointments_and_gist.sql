-- ==============================================================================
-- 0004 · Sistema de Reservas, Prevención de Colisiones GiST y Políticas RLS
-- ==============================================================================

-- 1. Asegurar extensión btree_gist para tipos de rango e igualdad combinada
create extension if not exists btree_gist;

-- 2. Asegurar que la restricción de exclusión GiST esté activa en appointments
-- Evita solapamientos temporales de citas 'scheduled' para el mismo nutricionista
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointments_nutritionist_id_tstzrange_excl'
  ) then
    alter table public.appointments
      add constraint appointments_nutritionist_id_tstzrange_excl
      exclude using gist (
        nutritionist_id with =,
        tstzrange(starts_at, ends_at) with &&
      ) where (status = 'scheduled');
  end if;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- 3. Concesión de permisos a los roles de Supabase (anon y authenticated)
grant select, insert, update on public.nutritionists to anon, authenticated;
grant select, insert, update on public.appointments to anon, authenticated;
grant select, insert, update on public.booking_tokens to anon, authenticated;
grant select, insert, update on public.clients to anon, authenticated;

-- 4. Habilitar Row Level Security (RLS) en citas
alter table public.appointments enable row level security;
alter table public.booking_tokens enable row level security;
alter table public.nutritionists enable row level security;

-- 5. Políticas RLS para nutricionistas
drop policy if exists "nutritionists_read_public" on public.nutritionists;
create policy "nutritionists_read_public"
  on public.nutritionists
  for select
  to anon, authenticated
  using (true);

-- 6. Políticas RLS para citas (appointments)
drop policy if exists "nutritionist_manage_appointments" on public.appointments;
create policy "nutritionist_manage_appointments"
  on public.appointments
  for all
  to authenticated
  using (
    nutritionist_id = auth.uid()
  )
  with check (
    nutritionist_id = auth.uid()
  );

drop policy if exists "client_read_own_appointments" on public.appointments;
create policy "client_read_own_appointments"
  on public.appointments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = appointments.client_id
        and (c.profile_id = auth.uid() or c.id = auth.uid())
    )
  );

-- Permitir creación de reservas públicas o mediante token
drop policy if exists "allow_public_booking_insert" on public.appointments;
create policy "allow_public_booking_insert"
  on public.appointments
  for insert
  to anon, authenticated
  with check (
    status = 'scheduled'
  );

drop policy if exists "allow_public_booking_select" on public.appointments;
create policy "allow_public_booking_select"
  on public.appointments
  for select
  to anon, authenticated
  using (true);
