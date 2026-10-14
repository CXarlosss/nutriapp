import {
  DietItem,
  ShoppingCategory,
  ShoppingItem,
  ShoppingListSummary,
  MealSlotType,
} from '@/types/diet';

// ─────────────────────────────────────────────────────────────────────────────
// TAXONOMÍA DE PASILLOS DE SUPERMERCADO
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryRule {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

const SUPERMARKET_CATEGORIES: CategoryRule[] = [
  {
    id: 'carnes_pescados',
    name: 'Carnes, Aves y Pescados',
    icon: '🥩',
    keywords: [
      'pollo',
      'pavo',
      'ternera',
      'lomo',
      'cerdo',
      'salmon',
      'salmón',
      'atun',
      'atún',
      'merluza',
      'bacalao',
      'pescado',
      'carne',
      'tofu',
      'seitan',
      'seitán',
      'gambas',
      'langostinos',
    ],
  },
  {
    id: 'frutas_verduras',
    name: 'Frutas, Verduras y Hortalizas',
    icon: '🥦',
    keywords: [
      'platano',
      'plátano',
      'manzana',
      'pera',
      'naranja',
      'arandano',
      'arándano',
      'fresa',
      'aguacate',
      'brocoli',
      'brócoli',
      'espinaca',
      'lechuga',
      'rucula',
      'rúcula',
      'tomate',
      'zanahoria',
      'calabacin',
      'calabacín',
      'pimiento',
      'cebolla',
      'patata',
      'boniato',
      'pepino',
      'esparrago',
      'espárrago',
    ],
  },
  {
    id: 'lacteos_huevos',
    name: 'Lácteos y Huevos',
    icon: '🥛',
    keywords: [
      'huevo',
      'claras',
      'yogur',
      'leche',
      'queso',
      'requeson',
      'requesón',
      'mozzarella',
      'parmesano',
      'kefir',
      'kéfir',
      'cottage',
    ],
  },
  {
    id: 'cereales_granos',
    name: 'Cereales, Granos y Legumbres',
    icon: '🌾',
    keywords: [
      'avena',
      'arroz',
      'pan',
      'pasta',
      'quinoa',
      'couscous',
      'lenteja',
      'garbanzo',
      'alubia',
      'frijol',
      'chia',
      'chía',
      'centeno',
      'harina',
      'fideos',
      'tortilla',
    ],
  },
  {
    id: 'frutos_secos_aceites',
    name: 'Aceites, Frutos Secos y Semillas',
    icon: '🫒',
    keywords: [
      'aceite',
      'aove',
      'oliva',
      'nuez',
      'nueces',
      'almendra',
      'cacahuete',
      'anacardo',
      'semilla',
      'lino',
      'sesamo',
      'sésamo',
      'crema de cacahuete',
    ],
  },
  {
    id: 'especias_otros',
    name: 'Especias, Condimentos y Varios',
    icon: '🧂',
    keywords: [
      'sal',
      'pimienta',
      'canela',
      'oregano',
      'orégano',
      'curcuma',
      'cúrcuma',
      'cafe',
      'café',
      'te',
      'té',
      'vinagre',
      'mostaza',
      'cacao',
      'proteina whey',
      'creatina',
    ],
  },
];

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN DE INGREDIENTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza nombres de ingredientes culinarios para agrupar cantidades idénticas
 * (ej. "Pechuga de pollo a la plancha" y "Pechuga de pollo al horno" -> "Pechuga de Pollo")
 */
export function normalizeFoodName(rawName: string): string {
  if (!rawName) return 'Ingrediente';

  let name = rawName.trim();

  // Limpieza de técnicas culinarias que no alteran la compra en el supermercado
  const cookingTechniques = [
    /\b(a la plancha|al horno|al vapor|hervid[oa]s?|cocid[oa]s?|crud[oa]s?|fresc[oa]s?|asado|saltead[oa]s?)\b/gi,
    /\b(en copos suaves|en copos|en grano|al natural \(lata\)|al natural|en lata)\b/gi,
    /\b(madur[oa]s?|con piel|sin piel|desgrasado|0% grasa natural|0% natural|0%)\b/gi,
    /\b(de canarias|entero[s]?|blanco[s]?|integrales?)\b/gi,
  ];

  cookingTechniques.forEach((regex) => {
    name = name.replace(regex, '');
  });

  // Limpiar espacios duplicados
  name = name.replace(/\s+/g, ' ').trim();

  // Capitalización limpia
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Determina la categoría del supermercado para un alimento
 */
export function categorizeFood(foodName: string): CategoryRule {
  const normalized = foodName.toLowerCase();

  for (const cat of SUPERMARKET_CATEGORIES) {
    if (cat.keywords.some((kw) => normalized.includes(kw))) {
      return cat;
    }
  }

  // Fallback a "Especias, Condimentos y Varios"
  return SUPERMARKET_CATEGORIES[SUPERMARKET_CATEGORIES.length - 1];
}

/**
 * Formatea cantidades sumadas de forma legible para el paciente:
 * - 1200g -> "1.2 kg"
 * - 250g -> "250g"
 * - 1500ml -> "1.5 L"
 * - 4 piezas -> "4 ud"
 */
export function formatQuantityDisplay(quantity: number, unit: string, cleanName: string): string {
  const lowerUnit = (unit || 'g').toLowerCase().trim();

  if (lowerUnit === 'g' || lowerUnit === 'gr' || lowerUnit === 'gramos') {
    if (quantity >= 1000) {
      const kg = quantity / 1000;
      // Si es entero (ej. 2.0 kg -> "2 kg", si no "1.2 kg")
      const formatted = kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
      return `${formatted} kg`;
    }
    return `${Math.round(quantity)}g`;
  }

  if (lowerUnit === 'ml' || lowerUnit === 'mililitros') {
    if (quantity >= 1000) {
      const liters = quantity / 1000;
      const formatted = liters % 1 === 0 ? liters.toFixed(0) : liters.toFixed(1);
      return `${formatted} L`;
    }
    return `${Math.round(quantity)} ml`;
  }

  if (['ud', 'uds', 'unidad', 'unidades', 'pieza', 'piezas'].includes(lowerUnit)) {
    return `${Math.round(quantity)} ud`;
  }

  return `${Math.round(quantity)} ${unit}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR PRINCIPAL DE CONSOLIDACIÓN SEMANAL
// ─────────────────────────────────────────────────────────────────────────────

export interface RawDietItemInput {
  id?: string;
  dayIndex?: number;
  day_index?: number;
  mealSlot?: MealSlotType;
  meal_slot?: string;
  foodName?: string;
  free_text?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  mealPrepNotes?: string;
}

/**
 * Consolida todos los ingredientes de la semana planificada por el Diet Builder
 * agrupando por alimento normalizado, sumando cantidades y reuniendo notas de Meal Prep.
 */
export function generateWeeklyShoppingList(items: RawDietItemInput[]): ShoppingListSummary {
  const itemMap = new Map<
    string,
    {
      cleanName: string;
      originalNames: Set<string>;
      category: CategoryRule;
      totalQuantity: number;
      unit: string;
      frequency: number;
      mealPrepTips: Set<string>;
    }
  >();

  const allPrepNotes: Array<{
    foodName: string;
    note: string;
    dayName: string;
    mealSlot: MealSlotType;
  }> = [];

  items.forEach((item) => {
    const rawName = item.foodName || item.free_text || '';
    if (!rawName.trim()) return;

    const cleanName = normalizeFoodName(rawName);
    const key = cleanName.toLowerCase();
    const qty = Number(item.quantity) || 0;
    const unit = item.unit || 'g';
    const dayIdx = item.dayIndex || item.day_index || 1;
    const dayName = DAY_NAMES[dayIdx] || `Día ${dayIdx}`;
    const mealSlot = (item.mealSlot || item.meal_slot || 'comida') as MealSlotType;
    const prepNote = item.mealPrepNotes || item.notes;

    // Registrar nota de preparación si existe
    if (prepNote && prepNote.trim()) {
      allPrepNotes.push({
        foodName: cleanName,
        note: prepNote.trim(),
        dayName,
        mealSlot,
      });
    }

    if (!itemMap.has(key)) {
      const category = categorizeFood(cleanName);
      itemMap.set(key, {
        cleanName,
        originalNames: new Set([rawName]),
        category,
        totalQuantity: qty,
        unit,
        frequency: 1,
        mealPrepTips: prepNote ? new Set([prepNote.trim()]) : new Set(),
      });
    } else {
      const existing = itemMap.get(key)!;
      existing.totalQuantity += qty;
      existing.frequency += 1;
      existing.originalNames.add(rawName);
      if (prepNote) {
        existing.mealPrepTips.add(prepNote.trim());
      }
    }
  });

  // Convertir mapa a categorías estructuradas
  const categoriesMap = new Map<string, ShoppingItem[]>();
  SUPERMARKET_CATEGORIES.forEach((cat) => {
    categoriesMap.set(cat.id, []);
  });

  itemMap.forEach((entry, key) => {
    const formattedDisplay = formatQuantityDisplay(entry.totalQuantity, entry.unit, entry.cleanName);
    const shoppingItem: ShoppingItem = {
      id: `shop-${key.replace(/\s+/g, '-')}`,
      foodName: Array.from(entry.originalNames)[0],
      cleanName: entry.cleanName,
      category: entry.category.name,
      totalQuantity: entry.totalQuantity,
      unit: entry.unit,
      formattedDisplay,
      checked: false,
      frequencyPerWeek: entry.frequency,
      mealPrepTips: Array.from(entry.mealPrepTips),
    };

    const targetList = categoriesMap.get(entry.category.id) || [];
    targetList.push(shoppingItem);
    categoriesMap.set(entry.category.id, targetList);
  });

  // Filtrar categorías que tengan al menos 1 alimento
  const categories: ShoppingCategory[] = SUPERMARKET_CATEGORIES.filter(
    (cat) => (categoriesMap.get(cat.id) || []).length > 0
  ).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    items: (categoriesMap.get(cat.id) || []).sort((a, b) => a.cleanName.localeCompare(b.cleanName)),
  }));

  const totalItemsCount = Array.from(itemMap.values()).length;

  return {
    totalItemsCount,
    checkedItemsCount: 0,
    categories,
    allPrepNotes,
  };
}

/**
 * Genera texto plano optimizado para compartir la lista de la compra por WhatsApp
 */
export function formatShoppingListForWhatsApp(
  summary: ShoppingListSummary,
  patientName = 'Paciente'
): string {
  const lines: string[] = [];
  lines.push(`🛒 *Lista de la Compra Semanal · NutriApp*`);
  lines.push(`👤 Plan de: *${patientName}*`);
  lines.push(`📦 Total de ingredientes: *${summary.totalItemsCount}*`);
  lines.push(``);

  summary.categories.forEach((cat) => {
    lines.push(`${cat.icon} *${cat.name.toUpperCase()}*`);
    cat.items.forEach((item) => {
      lines.push(`  ◻ ${item.formattedDisplay} · ${item.cleanName}`);
      if (item.mealPrepTips.length > 0) {
        lines.push(`    💡 _Meal prep: ${item.mealPrepTips[0]}_`);
      }
    });
    lines.push(``);
  });

  if (summary.allPrepNotes.length > 0) {
    lines.push(`🥣 *NOTAS DE MEAL PREP DE LA SEMANA:*`);
    summary.allPrepNotes.forEach((note) => {
      lines.push(`• *${note.dayName} (${note.mealSlot})*: ${note.foodName} ➔ _${note.note}_`);
    });
    lines.push(``);
  }

  lines.push(`✨ _Generado automáticamente para máxima adherencia nutricional._`);
  return lines.join('\n');
}
