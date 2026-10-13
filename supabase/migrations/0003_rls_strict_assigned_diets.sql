-- =========================================================
-- 0003 · Políticas RLS estrictas para Asignación y Aislamiento de Dietas
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- 1. Habilitar RLS en las tablas críticas de dietas
alter table public.assigned_diets enable row level security;
alter table public.assigned_diet_items enable row level security;

-- Limpieza de políticas previas si existían
drop policy if exists "nutritionist_manage_assigned_diets" on public.assigned_diets;
drop policy if exists "client_read_own_assigned_diets" on public.assigned_diets;
drop policy if exists "nutritionist_manage_assigned_diet_items" on public.assigned_diet_items;
drop policy if exists "client_read_own_assigned_diet_items" on public.assigned_diet_items;

-- ==============================================================================
-- POLÍTICA 1: Nutricionistas (Rol 'admin' / profesional)
-- Pueden hacer SELECT, INSERT, UPDATE, DELETE sobre las dietas de sus propios clientes
-- ==============================================================================
create policy "nutritionist_manage_assigned_diets"
  on public.assigned_diets
  for all
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = assigned_diets.client_id
        and c.nutritionist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = assigned_diets.client_id
        and c.nutritionist_id = auth.uid()
    )
  );

-- ==============================================================================
-- POLÍTICA 2: Pacientes (Rol 'client')
-- Únicamente pueden hacer SELECT de la dieta donde el client_id coincida con su auth.uid()
-- (bien por profile_id vinculado a auth.users o por client_id directo)
-- ==============================================================================
create policy "client_read_own_assigned_diets"
  on public.assigned_diets
  for select
  to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = assigned_diets.client_id
        and (c.profile_id = auth.uid() or c.id = auth.uid())
    )
  );

-- ==============================================================================
-- POLÍTICAS CASCADA PARA ITEMS (assigned_diet_items)
-- Aislamiento estricto de alimentos y cantidades
-- ==============================================================================
create policy "nutritionist_manage_assigned_diet_items"
  on public.assigned_diet_items
  for all
  to authenticated
  using (
    exists (
      select 1 from public.assigned_diets ad
      join public.clients c on c.id = ad.client_id
      where ad.id = assigned_diet_items.diet_id
        and c.nutritionist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assigned_diets ad
      join public.clients c on c.id = ad.client_id
      where ad.id = assigned_diet_items.diet_id
        and c.nutritionist_id = auth.uid()
    )
  );

create policy "client_read_own_assigned_diet_items"
  on public.assigned_diet_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.assigned_diets ad
      join public.clients c on c.id = ad.client_id
      where ad.id = assigned_diet_items.diet_id
        and (c.profile_id = auth.uid() or c.id = auth.uid())
    )
  );
