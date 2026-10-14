import type {
  DietItem,
  ScientificGuideline,
  ClinicalValidationResult,
  ClinicalAuditState,
  SuggestedSupplement,
  PatientMedication,
} from '@/types/diet';
import { auditDrugNutrientInteractions } from '../services/clinicalRecordsService';

/**
 * Catálogo base de Guías Científicas de Referencia (ISSN, OMS, EFSA).
 * Sincronizado con la tabla public.scientific_guidelines en Supabase.
 */
export const DEFAULT_SCIENTIFIC_GUIDELINES: ScientificGuideline[] = [
  {
    id: 'sg-issn-protein',
    target_profile: 'deportista',
    nutrient_or_ratio: 'proteina_kg',
    min_value: 1.4,
    max_value: 2.4,
    unit: 'g/kg',
    title: 'ISSN Position Stand: protein and exercise',
    doi_reference: 'https://doi.org/10.1186/s12970-017-0177-8',
    warning_message:
      'Aporte proteico insuficiente para perfil activo/deportista (<1.4 g/kg peso corporal). Compromete la síntesis proteica miofibrilar y la adaptación al entrenamiento de fuerza.',
    severity: 'critical',
  },
  {
    id: 'sg-efsa-fiber',
    target_profile: 'general',
    nutrient_or_ratio: 'fibra_total',
    min_value: 25.0,
    max_value: 45.0,
    unit: 'g/día',
    title: 'EFSA Scientific Opinion on Dietary Reference Values for fibre',
    doi_reference: 'https://doi.org/10.2903/j.efsa.2010.1462',
    warning_message:
      'Ingesta de fibra alimentaria inferior al umbral mínimo de 25 g/día. Riesgo de motilidad gastrointestinal reducida y disbiosis de la microbiota.',
    severity: 'warning',
  },
  {
    id: 'sg-omega-ratio',
    target_profile: 'general',
    nutrient_or_ratio: 'omega3_omega6_ratio',
    min_value: 0.25, // Equivalente a ratio Omega6:Omega3 de máximo 4:1
    max_value: 1.0,
    unit: 'ratio',
    title: 'Importance of the Omega-6/Omega-3 ratio in health and disease (Simopoulos)',
    doi_reference: 'https://doi.org/10.1016/j.biopha.2006.07.080',
    warning_message:
      'Desbalance acentuado entre ácidos grasos poliinsaturados Omega-6 y Omega-3 (>4:1). Favorece una cascada de eicosanoides proinflamatoria.',
    severity: 'warning',
  },
  {
    id: 'sg-efsa-calcium',
    target_profile: 'general',
    nutrient_or_ratio: 'calcio_mg',
    min_value: 950.0,
    max_value: 2000.0,
    unit: 'mg/día',
    title: 'EFSA Dietary Reference Values for calcium',
    doi_reference: 'https://doi.org/10.2903/j.efsa.2015.4101',
    warning_message:
      'Aporte de calcio inferior al requerimiento diario mínimo (950 mg/día). Puede comprometer la homeostasis de mineralización ósea.',
    severity: 'warning',
  },
  {
    id: 'sg-who-sedentary-protein',
    target_profile: 'sedentario',
    nutrient_or_ratio: 'proteina_kg',
    min_value: 0.8,
    max_value: 1.2,
    unit: 'g/kg',
    title: 'WHO/FAO/UNU Protein and Amino Acid Requirements in Human Nutrition',
    doi_reference: 'https://doi.org/10.1093/ajcn/87.5.1576S',
    warning_message:
      'Aporte proteico por debajo del requerimiento basal mínimo de la OMS (0.8 g/kg) para mantenimiento de masa magra.',
    severity: 'critical',
  },
];

/**
 * Catálogo de alimentos de alta densidad de nutrientes para complementos sugeridos
 */
const RICH_FOOD_SOURCES: Record<string, SuggestedSupplement[]> = {
  proteina_kg: [
    {
      nutrient: 'Proteína',
      foodName: 'Proteína de suero Whey isolate',
      category: 'Suplementos',
      richnessLabel: '85g proteína / 100g',
      defaultGrams: 30,
    },
    {
      nutrient: 'Proteína',
      foodName: 'Claras de huevo pasteurizadas',
      category: 'Huevos y Lácteos',
      richnessLabel: '11g proteína / 100g (0% grasa)',
      defaultGrams: 150,
    },
    {
      nutrient: 'Proteína',
      foodName: 'Pechuga de pavo',
      category: 'Carnes y Aves',
      richnessLabel: '29g proteína / 100g',
      defaultGrams: 150,
    },
  ],
  fibra_total: [
    {
      nutrient: 'Fibra',
      foodName: 'Avena en copos suaves',
      category: 'Cereales',
      richnessLabel: '10.6g fibra / 100g (betaglucanos)',
      defaultGrams: 50,
    },
    {
      nutrient: 'Fibra',
      foodName: 'Brócoli al vapor',
      category: 'Verduras',
      richnessLabel: '2.8g fibra / 100g',
      defaultGrams: 200,
    },
    {
      nutrient: 'Fibra',
      foodName: 'Manzana con piel',
      category: 'Frutas',
      richnessLabel: 'Pectina prebiótica',
      defaultGrams: 150,
    },
  ],
  omega3_omega6_ratio: [
    {
      nutrient: 'Omega 3',
      foodName: 'Nueces crudas',
      category: 'Frutos Secos',
      richnessLabel: '9.1g ALA / 100g',
      defaultGrams: 25,
    },
    {
      nutrient: 'Omega 3',
      foodName: 'Salmón fresco al horno',
      category: 'Pescados',
      richnessLabel: '2.2g EPA/DHA / 100g',
      defaultGrams: 150,
    },
  ],
  calcio_mg: [
    {
      nutrient: 'Calcio',
      foodName: 'Queso fresco batido 0%',
      category: 'Huevos y Lácteos',
      richnessLabel: '120mg calcio / 100g',
      defaultGrams: 200,
    },
    {
      nutrient: 'Calcio',
      foodName: 'Yogur griego 0% grasa natural',
      category: 'Huevos y Lácteos',
      richnessLabel: '110mg calcio / 100g',
      defaultGrams: 150,
    },
  ],
};

/**
 * Función pura memorizada: Evalúa la dieta en tiempo real cruzando los datos
 * del grid semanal con el peso y perfil del cliente.
 * Diseñada para mantener 60 FPS en el cliente sin operaciones asíncronas pesadas.
 */
export function evaluateClinicalRules(
  items: DietItem[],
  clientWeightKg: number,
  targetProfile: string = 'deportista',
  guidelines: ScientificGuideline[] = DEFAULT_SCIENTIFIC_GUIDELINES,
  medications?: PatientMedication[]
): ClinicalAuditState {
  const safeWeight = Math.max(30, clientWeightKg || 70);

  // 1. Acumuladores de toda la semana (7 días)
  let totalProteinWeekly = 0;
  let totalFiberWeekly = 0;
  let totalCalciumWeekly = 0;
  let totalIronWeekly = 0;
  let totalOmega3Weekly = 0;
  let totalOmega6Weekly = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = item.quantity || 100;
    const ratio = qty / 100;

    totalProteinWeekly += item.proteinG || 0;

    // Si el ítem no tiene micronutrientes precalculados, los estimamos a partir del nombre/categoría
    const fiber = item.fiberG !== undefined ? item.fiberG : estimateFiber(item.foodName, ratio);
    const calcium = item.calciumMg !== undefined ? item.calciumMg : estimateCalcium(item.foodName, ratio);
    const iron = item.ironMg !== undefined ? item.ironMg : estimateIron(item.foodName, ratio);
    const o3 = item.omega3G !== undefined ? item.omega3G : estimateOmega3(item.foodName, ratio);
    const o6 = item.omega6G !== undefined ? item.omega6G : estimateOmega6(item.foodName, ratio);

    totalFiberWeekly += fiber;
    totalCalciumWeekly += calcium;
    totalIronWeekly += iron;
    totalOmega3Weekly += o3;
    totalOmega6Weekly += o6;
  }

  // 2. Medias diarias (dividido entre 7 días)
  const proteinDailyAvg = totalProteinWeekly / 7;
  const fiberDailyAvg = totalFiberWeekly / 7;
  const calciumDailyAvg = totalCalciumWeekly / 7;
  const ironDailyAvg = totalIronWeekly / 7;
  const omega3DailyAvg = totalOmega3Weekly / 7;
  const omega6DailyAvg = totalOmega6Weekly / 7;

  // 3. Ratios Clínicos Clave
  const proteinPerKg = Number((proteinDailyAvg / safeWeight).toFixed(2));
  const totalFiberAvg = Number(fiberDailyAvg.toFixed(1));
  const totalCalciumAvg = Math.round(calciumDailyAvg);
  const totalIronAvg = Number(ironDailyAvg.toFixed(1));
  const omega3_6_ratio =
    omega3DailyAvg > 0
      ? Number((omega3DailyAvg / Math.max(0.1, omega6DailyAvg)).toFixed(2))
      : 0.1;

  // 4. Evaluación de Guías Clínicas
  const evaluations: ClinicalValidationResult[] = [];
  let criticalViolationsCount = 0;
  const suggestedFoodsMap = new Map<string, SuggestedSupplement>();

  for (let g = 0; g < guidelines.length; g++) {
    const rule = guidelines[g];
    // Filtro por perfil objetivo o reglas generales
    if (rule.target_profile !== 'general' && rule.target_profile !== targetProfile) {
      continue;
    }

    let currentValue = 0;
    let passed = true;

    switch (rule.nutrient_or_ratio) {
      case 'proteina_kg':
        currentValue = proteinPerKg;
        break;
      case 'fibra_total':
        currentValue = totalFiberAvg;
        break;
      case 'omega3_omega6_ratio':
        currentValue = omega3_6_ratio;
        break;
      case 'calcio_mg':
        currentValue = totalCalciumAvg;
        break;
      case 'hierro_mg':
        currentValue = totalIronAvg;
        break;
      default:
        continue;
    }

    // Comprobación de límites min / max
    if (rule.min_value !== null && currentValue < rule.min_value) {
      passed = false;
    }
    if (rule.max_value !== null && currentValue > rule.max_value) {
      passed = false;
    }

    const difference = rule.min_value ? Number((currentValue - rule.min_value).toFixed(2)) : 0;
    const status: 'optimal' | 'warning' | 'critical' = passed
      ? 'optimal'
      : rule.severity === 'critical'
      ? 'critical'
      : 'warning';

    if (!passed && status === 'critical') {
      criticalViolationsCount++;
    }

    // Si falla, agregamos sugerencias de complementos
    if (!passed && RICH_FOOD_SOURCES[rule.nutrient_or_ratio]) {
      RICH_FOOD_SOURCES[rule.nutrient_or_ratio].forEach((s) => {
        suggestedFoodsMap.set(s.foodName, s);
      });
    }

    evaluations.push({
      guideline: rule,
      currentValue,
      passed,
      status,
      difference,
      deficientNutrient: rule.nutrient_or_ratio,
    });
  }

  // 5. Evaluación de Interacciones Fármaco-Nutriente
  const drugNutrientAlerts = auditDrugNutrientInteractions(items, medications || []);
  const hasCriticalDrugAlert = drugNutrientAlerts.some((a) => a.severity === 'critical');

  return {
    proteinPerKg,
    totalFiberAvg,
    omega3_6_ratio,
    totalCalciumAvg,
    totalIronAvg,
    evaluations,
    criticalViolationsCount,
    hasCriticalBlocker: criticalViolationsCount > 0 || hasCriticalDrugAlert,
    suggestedFoods: Array.from(suggestedFoodsMap.values()),
    drugNutrientAlerts,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Estimadores de micronutrientes para alimentos comunes (cuando no están en DB)
// ────────────────────────────────────────────────────────────────────────────
function estimateFiber(name: string, ratio: number): number {
  const n = name.toLowerCase();
  if (n.includes('avena')) return 10.6 * ratio;
  if (n.includes('brócoli') || n.includes('brocoli')) return 2.8 * ratio;
  if (n.includes('manzana')) return 2.4 * ratio;
  if (n.includes('plátano') || n.includes('platano')) return 2.6 * ratio;
  if (n.includes('arroz')) return 1.2 * ratio;
  if (n.includes('nueces')) return 6.7 * ratio;
  if (n.includes('aguacate')) return 6.7 * ratio;
  if (n.includes('pan')) return 4.5 * ratio;
  return 0;
}

function estimateCalcium(name: string, ratio: number): number {
  const n = name.toLowerCase();
  if (n.includes('yogur')) return 110 * ratio;
  if (n.includes('queso')) return 120 * ratio;
  if (n.includes('avena')) return 54 * ratio;
  if (n.includes('nueces')) return 98 * ratio;
  if (n.includes('brócoli')) return 47 * ratio;
  return 15 * ratio;
}

function estimateIron(name: string, ratio: number): number {
  const n = name.toLowerCase();
  if (n.includes('avena')) return 4.7 * ratio;
  if (n.includes('pollo')) return 1.3 * ratio;
  if (n.includes('ternera')) return 2.6 * ratio;
  if (n.includes('nueces')) return 2.9 * ratio;
  if (n.includes('huevo')) return 1.8 * ratio;
  return 0.5 * ratio;
}

function estimateOmega3(name: string, ratio: number): number {
  const n = name.toLowerCase();
  if (n.includes('salmón') || n.includes('salmon')) return 2.2 * ratio;
  if (n.includes('nueces')) return 9.1 * ratio;
  if (n.includes('atún') || n.includes('atun')) return 0.5 * ratio;
  return 0.05 * ratio;
}

function estimateOmega6(name: string, ratio: number): number {
  const n = name.toLowerCase();
  if (n.includes('nueces')) return 38.1 * ratio;
  if (n.includes('avena')) return 2.4 * ratio;
  if (n.includes('aguacate')) return 1.7 * ratio;
  if (n.includes('aceite')) return 9.8 * ratio;
  return 0.3 * ratio;
}
