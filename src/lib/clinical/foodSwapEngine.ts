import type {
  Food,
  FoodSwapAlternative,
  FoodSwapResult,
  ExchangeGroupType,
  PivotNutrientType,
} from '../../types/diet';

/**
 * Catálogo maestro de alimentos enriquecidos con grupos de intercambio y macro pivote.
 * Se utiliza para cálculo local a 0ms de latencia y como fallback offline.
 */
export const SWAP_FOOD_CATALOG: Food[] = [
  // --- PROTEÍNA MAGRA (Pivote: Proteína) ---
  {
    id: 'f-p-1',
    name: 'Pechuga de pollo a la plancha',
    category: 'Carnes y Aves',
    kcal: 165,
    protein_g: 31.0,
    carbs_g: 0.0,
    fat_g: 3.6,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-2',
    name: 'Pechuga de pavo',
    category: 'Carnes y Aves',
    kcal: 135,
    protein_g: 29.0,
    carbs_g: 0.0,
    fat_g: 1.5,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-3',
    name: 'Lomo de ternera magra',
    category: 'Carnes y Aves',
    kcal: 180,
    protein_g: 26.0,
    carbs_g: 0.0,
    fat_g: 7.5,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-4',
    name: 'Lomo de cerdo magro a la plancha',
    category: 'Carnes y Aves',
    kcal: 143,
    protein_g: 27.0,
    carbs_g: 0.0,
    fat_g: 3.8,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-5',
    name: 'Atún al natural (lata)',
    category: 'Pescados',
    kcal: 108,
    protein_g: 25.0,
    carbs_g: 0.0,
    fat_g: 0.8,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-6',
    name: 'Merluza fresca al vapor',
    category: 'Pescados',
    kcal: 86,
    protein_g: 17.0,
    carbs_g: 0.0,
    fat_g: 1.8,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-7',
    name: 'Tofu firme natural',
    category: 'Legumbres y Derivados',
    kcal: 125,
    protein_g: 14.0,
    carbs_g: 1.9,
    fat_g: 7.0,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 2.3,
  },
  {
    id: 'f-p-8',
    name: 'Seitán artesanal a la plancha',
    category: 'Cereales y Granos',
    kcal: 140,
    protein_g: 28.0,
    carbs_g: 4.0,
    fat_g: 1.5,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.5,
  },
  {
    id: 'f-p-9',
    name: 'Claras de huevo pasteurizadas',
    category: 'Huevos y Lácteos',
    kcal: 52,
    protein_g: 11.0,
    carbs_g: 0.7,
    fat_g: 0.2,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-p-10',
    name: 'Proteína de suero Whey isolate',
    category: 'Suplementos',
    kcal: 370,
    protein_g: 85.0,
    carbs_g: 3.0,
    fat_g: 1.5,
    default_unit: 'g',
    exchange_group: 'proteina_magra',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },

  // --- PROTEÍNA GRASA (Pivote: Proteína) ---
  {
    id: 'f-pg-1',
    name: 'Salmón fresco al horno',
    category: 'Pescados',
    kcal: 208,
    protein_g: 20.0,
    carbs_g: 0.0,
    fat_g: 13.0,
    default_unit: 'g',
    exchange_group: 'proteina_grasa',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-pg-2',
    name: 'Huevos camperos (enteros)',
    category: 'Huevos y Lácteos',
    kcal: 143,
    protein_g: 12.6,
    carbs_g: 0.7,
    fat_g: 9.5,
    default_unit: 'g',
    exchange_group: 'proteina_grasa',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },

  // --- CARBOHIDRATOS COMPLEJOS (Pivote: Carbohidratos) ---
  {
    id: 'f-c-1',
    name: 'Avena en copos suaves',
    category: 'Cereales y Granos',
    kcal: 379,
    protein_g: 13.5,
    carbs_g: 68.0,
    fat_g: 6.5,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 10.6,
  },
  {
    id: 'f-c-2',
    name: 'Arroz blanco basmati (en crudo)',
    category: 'Cereales y Granos',
    kcal: 355,
    protein_g: 7.5,
    carbs_g: 79.0,
    fat_g: 0.6,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 1.4,
  },
  {
    id: 'f-c-3',
    name: 'Pasta integral (en crudo)',
    category: 'Cereales y Granos',
    kcal: 348,
    protein_g: 12.0,
    carbs_g: 71.0,
    fat_g: 1.5,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 8.0,
  },
  {
    id: 'f-c-4',
    name: 'Pan de centeno 100% integral',
    category: 'Panes',
    kcal: 241,
    protein_g: 8.5,
    carbs_g: 48.0,
    fat_g: 1.5,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 6.5,
  },
  {
    id: 'f-c-5',
    name: 'Boniato / Batata al horno',
    category: 'Tubérculos',
    kcal: 90,
    protein_g: 2.0,
    carbs_g: 20.7,
    fat_g: 0.1,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 3.3,
  },
  {
    id: 'f-c-6',
    name: 'Copos de espelta integral',
    category: 'Cereales y Granos',
    kcal: 360,
    protein_g: 14.5,
    carbs_g: 63.0,
    fat_g: 2.7,
    default_unit: 'g',
    exchange_group: 'carbohidrato_complejo',
    pivot_nutrient: 'carbs',
    fiber_g: 8.4,
  },

  // --- FRUTAS (Pivote: Carbohidratos) ---
  {
    id: 'f-fr-1',
    name: 'Plátano maduro',
    category: 'Frutas',
    kcal: 89,
    protein_g: 1.1,
    carbs_g: 23.0,
    fat_g: 0.3,
    default_unit: 'g',
    exchange_group: 'fruta',
    pivot_nutrient: 'carbs',
    fiber_g: 2.6,
  },
  {
    id: 'f-fr-2',
    name: 'Manzana con piel',
    category: 'Frutas',
    kcal: 52,
    protein_g: 0.3,
    carbs_g: 14.0,
    fat_g: 0.2,
    default_unit: 'g',
    exchange_group: 'fruta',
    pivot_nutrient: 'carbs',
    fiber_g: 2.4,
  },

  // --- GRASAS SALUDABLES (Pivote: Grasas) ---
  {
    id: 'f-g-1',
    name: 'Aceite de oliva virgen extra',
    category: 'Grasas Saludables',
    kcal: 884,
    protein_g: 0.0,
    carbs_g: 0.0,
    fat_g: 100.0,
    default_unit: 'ml',
    exchange_group: 'grasa_saludable',
    pivot_nutrient: 'fat',
    fiber_g: 0.0,
  },
  {
    id: 'f-g-2',
    name: 'Aguacate Hass',
    category: 'Grasas Saludables',
    kcal: 160,
    protein_g: 2.0,
    carbs_g: 8.5,
    fat_g: 14.7,
    default_unit: 'g',
    exchange_group: 'grasa_saludable',
    pivot_nutrient: 'fat',
    fiber_g: 6.7,
  },
  {
    id: 'f-g-3',
    name: 'Nueces crudas',
    category: 'Frutos Secos',
    kcal: 654,
    protein_g: 15.2,
    carbs_g: 13.7,
    fat_g: 65.2,
    default_unit: 'g',
    exchange_group: 'grasa_saludable',
    pivot_nutrient: 'fat',
    fiber_g: 6.7,
  },
  {
    id: 'f-g-4',
    name: 'Crema de cacahuete 100% natural',
    category: 'Frutos Secos',
    kcal: 618,
    protein_g: 25.0,
    carbs_g: 12.0,
    fat_g: 50.0,
    default_unit: 'g',
    exchange_group: 'grasa_saludable',
    pivot_nutrient: 'fat',
    fiber_g: 7.5,
  },

  // --- LÁCTEOS PROTEICOS (Pivote: Proteína) ---
  {
    id: 'f-l-1',
    name: 'Yogur griego 0% grasa natural',
    category: 'Huevos y Lácteos',
    kcal: 59,
    protein_g: 10.0,
    carbs_g: 3.6,
    fat_g: 0.0,
    default_unit: 'g',
    exchange_group: 'lacteo_proteico',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-l-2',
    name: 'Queso fresco batido 0%',
    category: 'Huevos y Lácteos',
    kcal: 46,
    protein_g: 8.5,
    carbs_g: 3.5,
    fat_g: 0.1,
    default_unit: 'g',
    exchange_group: 'lacteo_proteico',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
  {
    id: 'f-l-3',
    name: 'Queso cottage desnatado 0.5%',
    category: 'Huevos y Lácteos',
    kcal: 72,
    protein_g: 12.5,
    carbs_g: 3.0,
    fat_g: 1.0,
    default_unit: 'g',
    exchange_group: 'lacteo_proteico',
    pivot_nutrient: 'protein',
    fiber_g: 0.0,
  },
];

/**
 * Encuentra el alimento del catálogo más afín a un nombre libre
 */
export function findFoodInCatalog(foodName: string, catalog: Food[] = SWAP_FOOD_CATALOG): Food | null {
  const normalized = foodName.toLowerCase().trim();
  
  // Coincidencia exacta
  let match = catalog.find((f) => f.name.toLowerCase() === normalized);
  if (match) return match;

  // Coincidencia por subcadena
  match = catalog.find((f) => normalized.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(normalized));
  if (match) return match;

  // Búsqueda por palabras clave clave
  if (normalized.includes('pollo')) return catalog.find((f) => f.name.includes('pollo')) || null;
  if (normalized.includes('pavo')) return catalog.find((f) => f.name.includes('pavo')) || null;
  if (normalized.includes('ternera')) return catalog.find((f) => f.name.includes('ternera')) || null;
  if (normalized.includes('salmón') || normalized.includes('salmon')) return catalog.find((f) => f.name.includes('Salmón')) || null;
  if (normalized.includes('atún') || normalized.includes('atun')) return catalog.find((f) => f.name.includes('Atún')) || null;
  if (normalized.includes('tofu')) return catalog.find((f) => f.name.includes('Tofu')) || null;
  if (normalized.includes('avena')) return catalog.find((f) => f.name.includes('Avena')) || null;
  if (normalized.includes('arroz')) return catalog.find((f) => f.name.includes('Arroz')) || null;
  if (normalized.includes('pasta')) return catalog.find((f) => f.name.includes('Pasta')) || null;
  if (normalized.includes('plátano') || normalized.includes('platano')) return catalog.find((f) => f.name.includes('Plátano')) || null;
  if (normalized.includes('manzana')) return catalog.find((f) => f.name.includes('Manzana')) || null;
  if (normalized.includes('aguacate')) return catalog.find((f) => f.name.includes('Aguacate')) || null;
  if (normalized.includes('aceite')) return catalog.find((f) => f.name.includes('Aceite')) || null;
  if (normalized.includes('yogur')) return catalog.find((f) => f.name.includes('Yogur')) || null;
  if (normalized.includes('queso') || normalized.includes('cottage')) return catalog.find((f) => f.name.includes('Queso')) || null;
  if (normalized.includes('huevo')) return catalog.find((f) => f.name.includes('Huevos')) || null;

  return null;
}

/**
 * Función matemática pura:
 * Calcula las opciones de intercambio equivalente manteniendo el macro pivote.
 */
export function calculateFoodSwaps(
  foodName: string,
  quantityGrams: number,
  customCatalog?: Food[]
): FoodSwapResult | null {
  const catalog = customCatalog && customCatalog.length > 0 ? customCatalog : SWAP_FOOD_CATALOG;
  const originalFood = findFoodInCatalog(foodName, catalog);

  if (!originalFood || !originalFood.exchange_group || originalFood.exchange_group === 'general') {
    return null;
  }

  const exchangeGroup = originalFood.exchange_group as ExchangeGroupType;
  const pivot = (originalFood.pivot_nutrient || 'protein') as PivotNutrientType;
  const origQty = Math.max(1, quantityGrams);

  // Valor total del nutriente pivote en la porción original
  let origPivotDensity = 0;
  switch (pivot) {
    case 'protein':
      origPivotDensity = originalFood.protein_g;
      break;
    case 'carbs':
      origPivotDensity = originalFood.carbs_g;
      break;
    case 'fat':
      origPivotDensity = originalFood.fat_g;
      break;
    case 'kcal':
      origPivotDensity = originalFood.kcal;
      break;
  }

  const origPivotTotal = (origQty / 100) * origPivotDensity;
  const origKcalTotal = (origQty / 100) * originalFood.kcal;

  // Filtrar alternativas del mismo grupo (excluyendo el alimento de origen)
  const peerFoods = catalog.filter(
    (f) => f.exchange_group === exchangeGroup && f.id !== originalFood.id && f.name.toLowerCase() !== originalFood.name.toLowerCase()
  );

  const alternatives: FoodSwapAlternative[] = [];

  for (const target of peerFoods) {
    let targetPivotDensity = 0;
    switch (pivot) {
      case 'protein':
        targetPivotDensity = target.protein_g;
        break;
      case 'carbs':
        targetPivotDensity = target.carbs_g;
        break;
      case 'fat':
        targetPivotDensity = target.fat_g;
        break;
      case 'kcal':
        targetPivotDensity = target.kcal;
        break;
    }

    if (targetPivotDensity <= 0) continue;

    // Cantidad exacta al gramo para igualar el macro pivote
    const calculatedGrams = Math.round((origPivotTotal / targetPivotDensity) * 100);
    const ratio = calculatedGrams / 100;

    const newKcal = Math.round(target.kcal * ratio);
    const newProtein = Number((target.protein_g * ratio).toFixed(1));
    const newCarbs = Number((target.carbs_g * ratio).toFixed(1));
    const newFat = Number((target.fat_g * ratio).toFixed(1));
    const newFiber = target.fiber_g !== undefined ? Number((target.fiber_g * ratio).toFixed(1)) : undefined;

    const deltaKcal = newKcal - Math.round(origKcalTotal);
    let newPivotTotal = 0;
    switch (pivot) {
      case 'protein':
        newPivotTotal = newProtein;
        break;
      case 'carbs':
        newPivotTotal = newCarbs;
        break;
      case 'fat':
        newPivotTotal = newFat;
        break;
      default:
        newPivotTotal = newKcal;
    }
    const deltaPivot = Number((newPivotTotal - origPivotTotal).toFixed(1));

    // Puntuación de similitud: penaliza diferencias calóricas elevadas
    const similarityScore = Math.max(20, Math.min(100, Math.round(100 - Math.abs(deltaKcal) * 0.4)));

    alternatives.push({
      foodId: target.id,
      foodName: target.name,
      category: target.category,
      exchangeGroup,
      pivotNutrient: pivot,
      calculatedGrams,
      unit: target.default_unit || 'g',
      kcal: newKcal,
      proteinG: newProtein,
      carbsG: newCarbs,
      fatG: newFat,
      fiberG: newFiber,
      deltaKcal,
      deltaPivot,
      similarityScore,
      description: `Aporta ${newPivotTotal}g de ${pivot === 'protein' ? 'proteína' : pivot === 'carbs' ? 'carbohidratos' : 'grasas'} igualando la ración original.`,
    });
  }

  alternatives.sort((a, b) => Math.abs(a.deltaKcal) - Math.abs(b.deltaKcal));

  return {
    originalFoodName: originalFood.name,
    originalQuantity: origQty,
    originalUnit: originalFood.default_unit || 'g',
    originalKcal: Math.round(origKcalTotal),
    originalPivotValue: Number(origPivotTotal.toFixed(1)),
    exchangeGroup,
    pivotNutrient: pivot,
    alternatives,
  };
}
