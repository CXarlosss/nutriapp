import { createClient } from '@/lib/supabase/client';
import { Food } from '@/types/diet';

// Catálogo base de fallback para pruebas offline / sin conexión activa de red
const FALLBACK_FOODS: Food[] = [
  { id: 'f-1', name: 'Pechuga de pollo a la plancha', category: 'Carnes y Aves', kcal: 165, protein_g: 31.0, carbs_g: 0.0, fat_g: 3.6, default_unit: 'g' },
  { id: 'f-2', name: 'Pechuga de pavo', category: 'Carnes y Aves', kcal: 135, protein_g: 29.0, carbs_g: 0.0, fat_g: 1.5, default_unit: 'g' },
  { id: 'f-3', name: 'Lomo de ternera magra', category: 'Carnes y Aves', kcal: 180, protein_g: 26.0, carbs_g: 0.0, fat_g: 7.5, default_unit: 'g' },
  { id: 'f-4', name: 'Salmón fresco al horno', category: 'Pescados', kcal: 208, protein_g: 20.0, carbs_g: 0.0, fat_g: 13.0, default_unit: 'g' },
  { id: 'f-5', name: 'Atún al natural (lata)', category: 'Pescados', kcal: 108, protein_g: 25.0, carbs_g: 0.0, fat_g: 0.8, default_unit: 'g' },
  { id: 'f-6', name: 'Huevos camperos (enteros)', category: 'Huevos y Lácteos', kcal: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5, default_unit: 'g' },
  { id: 'f-7', name: 'Claras de huevo pasteurizadas', category: 'Huevos y Lácteos', kcal: 52, protein_g: 11.0, carbs_g: 0.7, fat_g: 0.2, default_unit: 'g' },
  { id: 'f-8', name: 'Yogur griego 0% grasa natural', category: 'Huevos y Lácteos', kcal: 59, protein_g: 10.0, carbs_g: 3.6, fat_g: 0.0, default_unit: 'g' },
  { id: 'f-9', name: 'Avena en copos suaves', category: 'Cereales y Granos', kcal: 379, protein_g: 13.5, carbs_g: 68.0, fat_g: 6.5, default_unit: 'g' },
  { id: 'f-10', name: 'Arroz blanco basmati (crudo)', category: 'Cereales y Granos', kcal: 355, protein_g: 7.5, carbs_g: 79.0, fat_g: 0.6, default_unit: 'g' },
  { id: 'f-11', name: 'Pasta integral (cruda)', category: 'Cereales y Granos', kcal: 348, protein_g: 12.0, carbs_g: 71.0, fat_g: 1.5, default_unit: 'g' },
  { id: 'f-12', name: 'Pan de centeno 100% integral', category: 'Panes', kcal: 241, protein_g: 8.5, carbs_g: 48.0, fat_g: 1.5, default_unit: 'g' },
  { id: 'f-13', name: 'Plátano maduro', category: 'Frutas', kcal: 89, protein_g: 1.1, carbs_g: 23.0, fat_g: 0.3, default_unit: 'g' },
  { id: 'f-14', name: 'Manzana con piel', category: 'Frutas', kcal: 52, protein_g: 0.3, carbs_g: 14.0, fat_g: 0.2, default_unit: 'g' },
  { id: 'f-15', name: 'Aguacate Hass', category: 'Grasas Saludables', kcal: 160, protein_g: 2.0, carbs_g: 8.5, fat_g: 14.7, default_unit: 'g' },
  { id: 'f-16', name: 'Aceite de oliva virgen extra', category: 'Grasas Saludables', kcal: 884, protein_g: 0.0, carbs_g: 0.0, fat_g: 100.0, default_unit: 'ml' },
  { id: 'f-17', name: 'Nueces crudas', category: 'Frutos Secos', kcal: 654, protein_g: 15.2, carbs_g: 13.7, fat_g: 65.2, default_unit: 'g' },
  { id: 'f-18', name: 'Brócoli al vapor', category: 'Verduras', kcal: 34, protein_g: 2.8, carbs_g: 6.6, fat_g: 0.4, default_unit: 'g' },
  { id: 'f-19', name: 'Proteína de suero Whey isolate', category: 'Suplementos', kcal: 370, protein_g: 85.0, carbs_g: 3.0, fat_g: 1.5, default_unit: 'g' }
];

export interface SearchFoodsResult {
  foods: Food[];
  fromDatabase: boolean;
  query: string;
}

export async function searchFoodsInSupabase(query: string): Promise<SearchFoodsResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { foods: [], fromDatabase: false, query };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, category, kcal, protein_g, carbs_g, fat_g, default_unit')
      .ilike('name', `%${trimmed}%`)
      .limit(10);

    if (error || !data || data.length === 0) {
      // Fallback local fuzzy filter
      const qLower = trimmed.toLowerCase();
      const localMatches = FALLBACK_FOODS.filter((f) =>
        f.name.toLowerCase().includes(qLower) || f.category.toLowerCase().includes(qLower)
      );
      return { foods: localMatches, fromDatabase: false, query: trimmed };
    }

    return { foods: data as Food[], fromDatabase: true, query: trimmed };
  } catch (err) {
    console.warn('[searchFoods] Usando fallback local por error de conexión:', err);
    const qLower = trimmed.toLowerCase();
    const localMatches = FALLBACK_FOODS.filter((f) =>
      f.name.toLowerCase().includes(qLower) || f.category.toLowerCase().includes(qLower)
    );
    return { foods: localMatches, fromDatabase: false, query: trimmed };
  }
}
