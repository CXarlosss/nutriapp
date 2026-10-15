-- ==============================================================================
-- 0016 · Banco de Recetas, Platos Clínicos y Desempaquetado Atómico en PostgreSQL
-- ==============================================================================

-- 1. Tabla de Recetas de la Consulta (Platos del Nutricionista)
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references nutritionists(id) on delete cascade,
  name text not null,
  category text check (category in ('desayuno', 'media_manana', 'comida', 'merienda', 'cena', 'snack', 'general')) default 'general',
  prep_time_minutes int default 15,
  tags text[] default array[]::text[],
  notes text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_recipes_nutritionist on recipes(nutritionist_id);
create index if not exists idx_recipes_category on recipes(category);

-- 2. Tabla de Ingredientes Atómicos de la Receta
create table if not exists recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  quantity numeric not null default 100,
  unit text default 'g',
  notes text,
  position smallint default 0
);

create index if not exists idx_recipe_items_recipe on recipe_items(recipe_id);
create index if not exists idx_recipe_items_food on recipe_items(food_id);

-- 3. Políticas RLS para aislamiento Multi-Tenant de Recetas
alter table recipes enable row level security;
alter table recipe_items enable row level security;

-- Política lectura: nutricionista propietario o recetas públicas base
create policy "recipes_select_policy" on recipes
  for select using (
    is_public = true or
    nutritionist_id = auth.uid() or
    nutritionist_id is null
  );

create policy "recipes_insert_policy" on recipes
  for insert with check (
    nutritionist_id = auth.uid()
  );

create policy "recipes_update_policy" on recipes
  for update using (
    nutritionist_id = auth.uid()
  );

create policy "recipes_delete_policy" on recipes
  for delete using (
    nutritionist_id = auth.uid()
  );

-- RLS para items de la receta vinculado a la receta padre
create policy "recipe_items_select_policy" on recipe_items
  for select using (
    exists (
      select 1 from recipes r
      where r.id = recipe_items.recipe_id
        and (r.is_public = true or r.nutritionist_id = auth.uid() or r.nutritionist_id is null)
    )
  );

create policy "recipe_items_all_policy" on recipe_items
  for all using (
    exists (
      select 1 from recipes r
      where r.id = recipe_items.recipe_id
        and r.nutritionist_id = auth.uid()
    )
  );

-- 4. Función de utilidad RPC para desempaquetar receta a una dieta (desempaquetado atómico en base de datos)
create or replace function unpack_recipe_to_assigned_diet(
  p_diet_id uuid,
  p_recipe_id uuid,
  p_day_index smallint,
  p_meal_slot text
) returns setof assigned_diet_items language plpgsql security definer as $$
declare
  v_recipe_name text;
  v_current_pos smallint;
begin
  select name into v_recipe_name from recipes where id = p_recipe_id;
  
  select coalesce(max(position), -1) + 1 into v_current_pos
  from assigned_diet_items
  where diet_id = p_diet_id and day_index = p_day_index and meal_slot = p_meal_slot;

  return query
  insert into assigned_diet_items (
    diet_id,
    day_index,
    meal_slot,
    position,
    food_id,
    free_text,
    quantity,
    unit,
    notes,
    is_modified
  )
  select
    p_diet_id,
    p_day_index,
    p_meal_slot,
    v_current_pos + row_number() over (order by ri.position),
    ri.food_id,
    f.name,
    ri.quantity,
    ri.unit,
    coalesce(ri.notes, '[De receta: ' || v_recipe_name || ']'),
    true
  from recipe_items ri
  join foods f on f.id = ri.food_id
  where ri.recipe_id = p_recipe_id
  returning *;
end;
$$;
