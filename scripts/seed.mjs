/**
 * Script de Ingesta y Seed de Alimentos y Plantillas Base
 * Uso: node scripts/seed.mjs [archivo_opcional.json o csv]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Archivo .env.local no encontrado.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = (serviceKeyMatch ? serviceKeyMatch[1].trim() : '') || (keyMatch ? keyMatch[1].trim() : '');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_FOODS = [
  { name: 'Pechuga de pollo a la plancha', category: 'Carnes y Aves', kcal: 165, protein_g: 31.0, carbs_g: 0.0, fat_g: 3.6, default_unit: 'g' },
  { name: 'Pechuga de pavo', category: 'Carnes y Aves', kcal: 135, protein_g: 29.0, carbs_g: 0.0, fat_g: 1.5, default_unit: 'g' },
  { name: 'Lomo de ternera magra', category: 'Carnes y Aves', kcal: 180, protein_g: 26.0, carbs_g: 0.0, fat_g: 7.5, default_unit: 'g' },
  { name: 'Salmón fresco al horno', category: 'Pescados', kcal: 208, protein_g: 20.0, carbs_g: 0.0, fat_g: 13.0, default_unit: 'g' },
  { name: 'Atún al natural (lata)', category: 'Pescados', kcal: 108, protein_g: 25.0, carbs_g: 0.0, fat_g: 0.8, default_unit: 'g' },
  { name: 'Merluza fresca', category: 'Pescados', kcal: 86, protein_g: 17.0, carbs_g: 0.0, fat_g: 1.8, default_unit: 'g' },
  { name: 'Huevos camperos (enteros)', category: 'Huevos y Lácteos', kcal: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5, default_unit: 'g' },
  { name: 'Claras de huevo pasteurizadas', category: 'Huevos y Lácteos', kcal: 52, protein_g: 11.0, carbs_g: 0.7, fat_g: 0.2, default_unit: 'g' },
  { name: 'Yogur griego 0% grasa natural', category: 'Huevos y Lácteos', kcal: 59, protein_g: 10.0, carbs_g: 3.6, fat_g: 0.0, default_unit: 'g' },
  { name: 'Queso fresco batido 0%', category: 'Huevos y Lácteos', kcal: 46, protein_g: 8.5, carbs_g: 3.5, fat_g: 0.1, default_unit: 'g' },
  { name: 'Avena en copos suaves', category: 'Cereales y Granos', kcal: 379, protein_g: 13.5, carbs_g: 68.0, fat_g: 6.5, default_unit: 'g' },
  { name: 'Arroz blanco basmati (pesado en crudo)', category: 'Cereales y Granos', kcal: 355, protein_g: 7.5, carbs_g: 79.0, fat_g: 0.6, default_unit: 'g' },
  { name: 'Pasta integral (pesado en crudo)', category: 'Cereales y Granos', kcal: 348, protein_g: 12.0, carbs_g: 71.0, fat_g: 1.5, default_unit: 'g' },
  { name: 'Pan de centeno 100% integral', category: 'Panes', kcal: 241, protein_g: 8.5, carbs_g: 48.0, fat_g: 1.5, default_unit: 'g' },
  { name: 'Plátano maduro', category: 'Frutas', kcal: 89, protein_g: 1.1, carbs_g: 23.0, fat_g: 0.3, default_unit: 'g' },
  { name: 'Manzana con piel', category: 'Frutas', kcal: 52, protein_g: 0.3, carbs_g: 14.0, fat_g: 0.2, default_unit: 'g' },
  { name: 'Aguacate Hass', category: 'Grasas Saludables', kcal: 160, protein_g: 2.0, carbs_g: 8.5, fat_g: 14.7, default_unit: 'g' },
  { name: 'Aceite de oliva virgen extra', category: 'Grasas Saludables', kcal: 884, protein_g: 0.0, carbs_g: 0.0, fat_g: 100.0, default_unit: 'ml' },
  { name: 'Nueces crudas', category: 'Frutos Secos', kcal: 654, protein_g: 15.2, carbs_g: 13.7, fat_g: 65.2, default_unit: 'g' },
  { name: 'Brócoli al vapor', category: 'Verduras', kcal: 34, protein_g: 2.8, carbs_g: 6.6, fat_g: 0.4, default_unit: 'g' },
  { name: 'Proteína de suero Whey isolate', category: 'Suplementos', kcal: 370, protein_g: 85.0, carbs_g: 3.0, fat_g: 1.5, default_unit: 'g' }
];

async function seed() {
  console.log('🚀 Iniciando ingesta de catálogo de alimentos en Supabase...');
  const { data, error } = await supabase.from('foods').upsert(DEFAULT_FOODS, { onConflict: 'name' }).select('id');
  if (error) {
    console.error('❌ Error en upsert de alimentos:', error.message);
    console.log('💡 Tip: Ejecuta supabase/migrations/0002_rls_policies.sql en el Supabase SQL Editor para habilitar RLS adecuada.');
    process.exit(1);
  }
  console.log(`✅ Ingesta completada con éxito. ${data?.length || DEFAULT_FOODS.length} alimentos sincronizados.`);
}

seed();
