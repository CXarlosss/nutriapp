-- =========================================================
-- 0002 · Políticas RLS y Permisos para el Catálogo y Dietas
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- 1. Catálogo de alimentos: lectura pública (anónima y autenticada)
-- Permite que el autocompletado y fuzzy search funcionen sin fricciones
alter table public.foods enable row level security;
grant select on public.foods to anon, authenticated;

drop policy if exists "allow_public_read_foods" on public.foods;
create policy "allow_public_read_foods"
  on public.foods
  for select
  using (true);

-- 2. Plantillas de dietas y elementos: lectura para usuarios autenticados y anónimos en desarrollo
grant select, insert, update, delete on public.diet_templates to anon, authenticated;
grant select, insert, update, delete on public.template_items to anon, authenticated;

drop policy if exists "allow_read_templates" on public.diet_templates;
create policy "allow_read_templates"
  on public.diet_templates
  for all
  using (true)
  with check (true);

drop policy if exists "allow_read_template_items" on public.template_items;
create policy "allow_read_template_items"
  on public.template_items
  for all
  using (true)
  with check (true);

-- 3. Dietas asignadas y elementos de dieta asignada (autoguardado del Diet Builder)
grant select, insert, update, delete on public.assigned_diets to anon, authenticated;
grant select, insert, update, delete on public.assigned_diet_items to anon, authenticated;

drop policy if exists "allow_crud_assigned_diets" on public.assigned_diets;
create policy "allow_crud_assigned_diets"
  on public.assigned_diets
  for all
  using (true)
  with check (true);

drop policy if exists "allow_crud_assigned_diet_items" on public.assigned_diet_items;
create policy "allow_crud_assigned_diet_items"
  on public.assigned_diet_items
  for all
  using (true)
  with check (true);

-- 4. Clientes y suscripciones
grant select, insert, update on public.clients to anon, authenticated;
grant select, insert, update on public.subscriptions to anon, authenticated;

drop policy if exists "allow_read_clients" on public.clients;
create policy "allow_read_clients"
  on public.clients
  for all
  using (true)
  with check (true);
