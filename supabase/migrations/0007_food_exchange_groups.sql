-- ============================================================================
-- MIGRACIÓN 0007: GRUPOS DE INTERCAMBIO DINÁMICO Y EQUIVALENCIAS MATEMÁTICAS (FOOD SWAPS)
-- ============================================================================

-- 1. Ampliar catálogo de alimentos con campos de grupo de intercambio y nutriente pivote
alter table public.foods
  add column if not exists exchange_group text default 'general',
  add column if not exists pivot_nutrient text default 'protein',
  add column if not exists serving_default_g numeric default 100;

create index if not exists idx_foods_exchange_group on public.foods(exchange_group);
create index if not exists idx_foods_pivot_nutrient on public.foods(pivot_nutrient);

-- 2. Insertar alimentos adicionales clave para ampliar las opciones de intercambio clínico
insert into public.foods (name, category, kcal, protein_g, carbs_g, fat_g, default_unit, exchange_group, pivot_nutrient, fiber_g, calcium_mg, iron_mg, omega3_g, omega6_g)
values
  ('Lomo de cerdo magro a la plancha', 'Carnes y Aves', 143, 27.0, 0.0, 3.8, 'g', 'proteina_magra', 'protein', 0.0, 10, 1.2, 0.05, 0.4),
  ('Tofu firme natural', 'Legumbres y Derivados', 125, 14.0, 1.9, 7.0, 'g', 'proteina_magra', 'protein', 2.3, 350, 5.4, 0.6, 3.8),
  ('Seitán artesanal a la plancha', 'Cereales y Granos', 140, 28.0, 4.0, 1.5, 'g', 'proteina_magra', 'protein', 0.5, 30, 2.1, 0.0, 0.2),
  ('Copos de espelta integral', 'Cereales y Granos', 360, 14.5, 63.0, 2.7, 'g', 'carbohidrato_complejo', 'carbs', 8.4, 40, 4.2, 0.1, 1.2),
  ('Quinoa real hervida', 'Cereales y Granos', 120, 4.4, 21.3, 1.9, 'g', 'carbohidrato_complejo', 'carbs', 2.8, 17, 1.5, 0.1, 0.8),
  ('Boniato / Batata al horno', 'Tubérculos', 90, 2.0, 20.7, 0.1, 'g', 'carbohidrato_complejo', 'carbs', 3.3, 38, 0.7, 0.0, 0.05),
  ('Crema de cacahuete 100% natural', 'Frutos Secos', 618, 25.0, 12.0, 50.0, 'g', 'grasa_saludable', 'fat', 7.5, 60, 2.2, 0.0, 15.0),
  ('Aceite de coco virgen extra', 'Grasas Saludables', 890, 0.0, 0.0, 99.0, 'ml', 'grasa_saludable', 'fat', 0.0, 0, 0.0, 0.0, 1.8),
  ('Queso cottage desnatado 0.5%', 'Huevos y Lácteos', 72, 12.5, 3.0, 1.0, 'g', 'lacteo_proteico', 'protein', 0.0, 83, 0.2, 0.0, 0.05)
on conflict do nothing;

-- 3. Actualizar catálogo base con sus grupos de equivalencia y nutrientes pivote
update public.foods set exchange_group = 'proteina_magra', pivot_nutrient = 'protein'
where name ilike '%Pollo%' or name ilike '%Pavo%' or name ilike '%Ternera magra%' or name ilike '%Merluza%' or name ilike '%Atún%' or name ilike '%Claras de huevo%' or name ilike '%Whey%';

update public.foods set exchange_group = 'proteina_grasa', pivot_nutrient = 'protein'
where name ilike '%Salmón%' or name ilike '%Huevos camperos%';

update public.foods set exchange_group = 'carbohidrato_complejo', pivot_nutrient = 'carbs'
where name ilike '%Avena%' or name ilike '%Arroz%' or name ilike '%Pasta%' or name ilike '%Pan de centeno%';

update public.foods set exchange_group = 'fruta', pivot_nutrient = 'carbs'
where name ilike '%Plátano%' or name ilike '%Manzana%' or name ilike '%Fruta%';

update public.foods set exchange_group = 'grasa_saludable', pivot_nutrient = 'fat'
where name ilike '%Aguacate%' or name ilike '%Aceite de oliva%' or name ilike '%Nueces%';

update public.foods set exchange_group = 'lacteo_proteico', pivot_nutrient = 'protein'
where name ilike '%Yogur%' or name ilike '%Queso fresco batido%';

update public.foods set exchange_group = 'verdura_libre', pivot_nutrient = 'kcal'
where name ilike '%Brócoli%' or name ilike '%Espinaca%';

-- 4. Función RPC en PostgreSQL: Cálculo dinámico de alternativas de intercambio equivalente
create or replace function public.get_food_swaps(
  p_food_id uuid,
  p_grams numeric
)
returns table (
  target_food_id uuid,
  target_food_name text,
  target_category text,
  exchange_group text,
  pivot_nutrient text,
  calculated_grams numeric,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  delta_kcal numeric,
  delta_pivot numeric
)
language plpgsql
security definer
as $$
declare
  v_orig record;
  v_orig_pivot_total numeric;
  v_orig_kcal_total numeric;
begin
  -- Obtener alimento original
  select * into v_orig from public.foods where id = p_food_id;
  if not found then
    return;
  end if;

  -- Calcular total del macro pivote en la porción original
  case v_orig.pivot_nutrient
    when 'protein' then
      v_orig_pivot_total := (p_grams / 100.0) * coalesce(v_orig.protein_g, 0);
    when 'carbs' then
      v_orig_pivot_total := (p_grams / 100.0) * coalesce(v_orig.carbs_g, 0);
    when 'fat' then
      v_orig_pivot_total := (p_grams / 100.0) * coalesce(v_orig.fat_g, 0);
    else
      v_orig_pivot_total := (p_grams / 100.0) * coalesce(v_orig.kcal, 0);
  end case;

  v_orig_kcal_total := (p_grams / 100.0) * coalesce(v_orig.kcal, 0);

  -- Retornar alternativas del mismo grupo de intercambio
  return query
  select 
    f.id as target_food_id,
    f.name as target_food_name,
    f.category as target_category,
    f.exchange_group,
    f.pivot_nutrient,
    -- Gramos calculados matemáticamente para igualar el macro pivote
    case f.pivot_nutrient
      when 'protein' then
        round((v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0)
      when 'carbs' then
        round((v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0)
      when 'fat' then
        round((v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0)
      else
        round((v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0)
    end as calculated_grams,
    -- Nuevas calorías estimadas
    round(
      (case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.kcal, 0)
    ) as kcal,
    -- Proteína calculada
    round(
      (case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.protein_g, 0),
      1
    ) as protein_g,
    -- Carbohidratos calculados
    round(
      (case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.carbs_g, 0),
      1
    ) as carbs_g,
    -- Grasa calculada
    round(
      (case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.fat_g, 0),
      1
    ) as fat_g,
    -- Fibra calculada
    round(
      (case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.fiber_g, 0),
      1
    ) as fiber_g,
    -- Delta de Kcal respecto a la porción original
    round(
      ((case f.pivot_nutrient
        when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
        when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
        when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
        else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
      end / 100.0) * coalesce(f.kcal, 0)) - v_orig_kcal_total
    ) as delta_kcal,
    0.0 as delta_pivot
  from public.foods f
  where f.exchange_group = v_orig.exchange_group
    and f.id <> v_orig.id
    and f.exchange_group <> 'general'
  order by abs(
    ((case f.pivot_nutrient
      when 'protein' then (v_orig_pivot_total / nullif(f.protein_g, 0)) * 100.0
      when 'carbs' then (v_orig_pivot_total / nullif(f.carbs_g, 0)) * 100.0
      when 'fat' then (v_orig_pivot_total / nullif(f.fat_g, 0)) * 100.0
      else (v_orig_pivot_total / nullif(f.kcal, 0)) * 100.0
    end / 100.0) * coalesce(f.kcal, 0)) - v_orig_kcal_total
  ) asc;
end;
$$;

-- Otorgar permiso de ejecución a los roles anon y authenticated
grant execute on function public.get_food_swaps(uuid, numeric) to anon, authenticated;
