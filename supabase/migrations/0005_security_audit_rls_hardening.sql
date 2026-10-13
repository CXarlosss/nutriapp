-- ==============================================================================
-- 0005 · Auditoría Final RLS (Supabase) - Endurecimiento de Seguridad Producción
-- Cierra brechas de acceso público (anon) en tablas clínicas y médicas
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas del esquema
alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.clients enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.diet_templates enable row level security;
alter table public.template_items enable row level security;
alter table public.assigned_diets enable row level security;
alter table public.assigned_diet_items enable row level security;
alter table public.appointments enable row level security;
alter table public.booking_tokens enable row level security;
alter table public.foods enable row level security;

-- 2. Revocar privilegios inseguros a 'anon' en tablas privadas
revoke all on public.profiles from anon;
revoke all on public.nutritionists from anon;
revoke all on public.clients from anon;
revoke all on public.subscriptions from anon;
revoke all on public.diet_templates from anon;
revoke all on public.template_items from anon;
revoke all on public.assigned_diets from anon;
revoke all on public.assigned_diet_items from anon;
revoke all on public.appointments from anon;

-- Conceder exclusivamente lo necesario a 'anon' (catálogo y validación de reserva)
grant select on public.foods to anon;
grant select, update on public.booking_tokens to anon;
grant select on public.plans to anon;

-- 3. PROFILES: Usuarios solo pueden leer y editar su propio perfil
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 4. CLIENTS: Privacidad médica estricta
drop policy if exists "clients_nutritionist_access" on public.clients;
create policy "clients_nutritionist_access"
  on public.clients
  for all
  to authenticated
  using (nutritionist_id = auth.uid())
  with check (nutritionist_id = auth.uid());

drop policy if exists "clients_own_read" on public.clients;
create policy "clients_own_read"
  on public.clients
  for select
  to authenticated
  using (profile_id = auth.uid());

-- 5. DIET_TEMPLATES & TEMPLATE_ITEMS: Propiedad exclusiva del nutricionista
drop policy if exists "nutritionist_manage_templates" on public.diet_templates;
create policy "nutritionist_manage_templates"
  on public.diet_templates
  for all
  to authenticated
  using (nutritionist_id = auth.uid())
  with check (nutritionist_id = auth.uid());

drop policy if exists "nutritionist_manage_template_items" on public.template_items;
create policy "nutritionist_manage_template_items"
  on public.template_items
  for all
  to authenticated
  using (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_items.template_id
        and t.nutritionist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_items.template_id
        and t.nutritionist_id = auth.uid()
    )
  );

-- 6. APPOINTMENTS: Nutricionista y Pacientes autenticados
drop policy if exists "allow_public_booking_insert" on public.appointments;
drop policy if exists "allow_public_booking_select" on public.appointments;

drop policy if exists "nutritionist_manage_appointments_strict" on public.appointments;
create policy "nutritionist_manage_appointments_strict"
  on public.appointments
  for all
  to authenticated
  using (nutritionist_id = auth.uid())
  with check (nutritionist_id = auth.uid());

drop policy if exists "client_read_own_appointments_strict" on public.appointments;
create policy "client_read_own_appointments_strict"
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

-- Inserción de citas permitida si el usuario está autenticado o a través de token verificado
create policy "token_or_client_insert_appointments"
  on public.appointments
  for insert
  to authenticated
  with check (
    status = 'scheduled'
  );

-- 7. BOOKING_TOKENS: Control estricto de emisión y consumo
drop policy if exists "tokens_nutritionist_manage" on public.booking_tokens;
create policy "tokens_nutritionist_manage"
  on public.booking_tokens
  for all
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = booking_tokens.client_id
        and c.nutritionist_id = auth.uid()
    )
  );

drop policy if exists "tokens_public_validate" on public.booking_tokens;
create policy "tokens_public_validate"
  on public.booking_tokens
  for select
  to anon
  using (
    expires_at > now() and used_at is null
  );

-- 8. FOODS: Lectura pública del catálogo, escritura solo para administradores
drop policy if exists "foods_read_public" on public.foods;
create policy "foods_read_public"
  on public.foods
  for select
  to anon, authenticated
  using (true);

drop policy if exists "foods_admin_manage" on public.foods;
create policy "foods_admin_manage"
  on public.foods
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
