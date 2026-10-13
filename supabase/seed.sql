-- =========================================================
-- Seed Data: Catálogo de Alimentos y Plantilla Inicial
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- Inserción del Catálogo de Alimentos (Valores por 100g)
insert into public.foods (name, category, kcal, protein_g, carbs_g, fat_g, default_unit) values
  ('Pechuga de pollo a la plancha', 'Carnes y Aves', 165, 31.0, 0.0, 3.6, 'g'),
  ('Pechuga de pavo', 'Carnes y Aves', 135, 29.0, 0.0, 1.5, 'g'),
  ('Lomo de ternera magra', 'Carnes y Aves', 180, 26.0, 0.0, 7.5, 'g'),
  ('Salmón fresco al horno', 'Pescados', 208, 20.0, 0.0, 13.0, 'g'),
  ('Atún al natural (lata)', 'Pescados', 108, 25.0, 0.0, 0.8, 'g'),
  ('Merluza fresca', 'Pescados', 86, 17.0, 0.0, 1.8, 'g'),
  ('Huevos camperos (enteros)', 'Huevos y Lácteos', 143, 12.6, 0.7, 9.5, 'g'),
  ('Claras de huevo pasteurizadas', 'Huevos y Lácteos', 52, 11.0, 0.7, 0.2, 'g'),
  ('Yogur griego 0% grasa natural', 'Huevos y Lácteos', 59, 10.0, 3.6, 0.0, 'g'),
  ('Queso fresco batido 0%', 'Huevos y Lácteos', 46, 8.5, 3.5, 0.1, 'g'),
  ('Queso cottage bajo en grasa', 'Huevos y Lácteos', 82, 11.5, 3.0, 2.5, 'g'),
  ('Leche desnatada', 'Huevos y Lácteos', 35, 3.4, 4.8, 0.1, 'ml'),
  ('Avena en copos suaves', 'Cereales y Granos', 379, 13.5, 68.0, 6.5, 'g'),
  ('Arroz blanco basmati (pesado en crudo)', 'Cereales y Granos', 355, 7.5, 79.0, 0.6, 'g'),
  ('Arroz integral', 'Cereales y Granos', 362, 7.5, 76.0, 2.7, 'g'),
  ('Pasta integral (pesado en crudo)', 'Cereales y Granos', 348, 12.0, 71.0, 1.5, 'g'),
  ('Pan de centeno 100% integral', 'Panes', 241, 8.5, 48.0, 1.5, 'g'),
  ('Tortitas de arroz simple', 'Snacks', 387, 8.0, 81.0, 2.8, 'g'),
  ('Plátano maduro', 'Frutas', 89, 1.1, 23.0, 0.3, 'g'),
  ('Manzana con piel', 'Frutas', 52, 0.3, 14.0, 0.2, 'g'),
  ('Arándanos frescos', 'Frutas', 57, 0.7, 14.5, 0.3, 'g'),
  ('Fresas', 'Frutas', 32, 0.7, 7.7, 0.3, 'g'),
  ('Aguacate Hass', 'Grasas Saludables', 160, 2.0, 8.5, 14.7, 'g'),
  ('Aceite de oliva virgen extra', 'Grasas Saludables', 884, 0.0, 0.0, 100.0, 'ml'),
  ('Nueces crudas', 'Frutos Secos', 654, 15.2, 13.7, 65.2, 'g'),
  ('Almendras naturales sin tostar', 'Frutos Secos', 579, 21.2, 21.6, 49.9, 'g'),
  ('Crema de cacahuete 100% natural', 'Frutos Secos', 588, 25.0, 20.0, 50.0, 'g'),
  ('Brócoli al vapor', 'Verduras', 34, 2.8, 6.6, 0.4, 'g'),
  ('Espinacas frescas', 'Verduras', 23, 2.9, 3.6, 0.4, 'g'),
  ('Tomate cherry', 'Verduras', 18, 0.9, 3.9, 0.2, 'g'),
  ('Zanahoria cruda', 'Verduras', 41, 0.9, 9.6, 0.2, 'g'),
  ('Lentejas cocidas', 'Legumbres', 116, 9.0, 20.0, 0.4, 'g'),
  ('Garbanzos cocidos en conserva', 'Legumbres', 164, 8.9, 27.4, 2.6, 'g'),
  ('Proteína de suero Whey isolate', 'Suplementos', 370, 85.0, 3.0, 1.5, 'g')
on conflict do nothing;

-- Crear Nutricionista si no existe
insert into public.nutritionists (id, timezone, slot_minutes, buffer_minutes, working_hours)
select 
  id, 
  'Europe/Madrid', 
  30, 
  10, 
  '{"mon":[["09:00","14:00"],["16:00","19:00"]],"tue":[["09:00","14:00"],["16:00","19:00"]],"wed":[["09:00","14:00"],["16:00","19:00"]],"thu":[["09:00","14:00"],["16:00","19:00"]],"fri":[["09:00","14:00"]]}'::jsonb
from public.profiles 
where role = 'admin' 
limit 1
on conflict (id) do nothing;

-- Crear Cliente de prueba
do $$
declare v_nutri_id uuid;
begin
  select id into v_nutri_id from public.nutritionists limit 1;
  if v_nutri_id is not null then
    insert into public.clients (id, nutritionist_id, full_name, email, phone, height_cm, goal, allergies, status)
    values (
      'a0000000-0000-0000-0000-000000000001',
      v_nutri_id,
      'Carlos Pérez (Cliente Demo)',
      'cliente.demo@nutriplatform.local',
      '+34 600 000 001',
      178,
      'Pérdida de grasa manteniendo masa muscular',
      array['Marisco'],
      'active'
    )
    on conflict (id) do nothing;
  end if;
end $$;
