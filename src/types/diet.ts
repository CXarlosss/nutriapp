export type MealSlotType = 'desayuno' | 'media_manana' | 'comida' | 'merienda' | 'cena';

export interface Food {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  default_unit: string;
  // Micronutrientes y ácidos grasos críticos (CDSS)
  fiber_g?: number;
  calcium_mg?: number;
  iron_mg?: number;
  omega3_g?: number;
  omega6_g?: number;
  // Sistema de Intercambios Dinámicos
  exchange_group?: ExchangeGroupType;
  pivot_nutrient?: PivotNutrientType;
  serving_default_g?: number;
}

export interface DietItem {
  id: string;
  dietId: string;
  dayIndex: number; // 1 = Lunes, 7 = Domingo
  mealSlot: MealSlotType;
  position: number;
  foodId: string | null;
  foodName: string;
  quantity: number;
  unit: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  // Micronutrientes calculados proporcionales a quantity
  fiberG?: number;
  calciumMg?: number;
  ironMg?: number;
  omega3G?: number;
  omega6G?: number;
  notes?: string;
  isModified?: boolean;
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calcium: number;
  iron: number;
  omega3: number;
  omega6: number;
}

export interface DaySchedule {
  dayIndex: number;
  dayName: string;
  slots: Record<MealSlotType, DietItem[]>;
  totals: MacroTotals;
}

export interface CellCoordinate {
  dayIndex: number;
  mealSlot: MealSlotType;
  itemIndex: number;
  field: 'name' | 'quantity';
}

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

// ==============================================================================
// CDSS (Clinical Decision Support System) - Tipos de Soporte Clínico y Evidencia
// ==============================================================================

export interface ScientificGuideline {
  id: string;
  target_profile: string; // 'deportista' | 'sedentario' | 'general'
  nutrient_or_ratio: string; // 'proteina_kg' | 'fibra_total' | 'omega3_omega6_ratio' | 'calcio_mg' | 'hierro_mg'
  min_value: number | null;
  max_value: number | null;
  unit: string;
  title: string;
  doi_reference: string;
  warning_message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface ClinicalValidationResult {
  guideline: ScientificGuideline;
  currentValue: number;
  passed: boolean;
  status: 'optimal' | 'warning' | 'critical';
  difference: number;
  deficientNutrient?: string;
}

export interface SuggestedSupplement {
  nutrient: string;
  foodName: string;
  category: string;
  richnessLabel: string;
  defaultGrams: number;
}

export interface ClinicalAuditState {
  proteinPerKg: number;
  totalFiberAvg: number;
  omega3_6_ratio: number;
  totalCalciumAvg: number;
  totalIronAvg: number;
  evaluations: ClinicalValidationResult[];
  criticalViolationsCount: number;
  hasCriticalBlocker: boolean;
  suggestedFoods: SuggestedSupplement[];
}

// ==============================================================================
// FOOD SWAPS (Sistema de Intercambios Dinámicos y Equivalencias Matemáticas)
// ==============================================================================

export type ExchangeGroupType =
  | 'proteina_magra'
  | 'proteina_grasa'
  | 'carbohidrato_complejo'
  | 'fruta'
  | 'grasa_saludable'
  | 'lacteo_proteico'
  | 'verdura_libre'
  | 'general';

export type PivotNutrientType = 'protein' | 'carbs' | 'fat' | 'kcal';

export interface FoodSwapAlternative {
  foodId: string;
  foodName: string;
  category: string;
  exchangeGroup: ExchangeGroupType;
  pivotNutrient: PivotNutrientType;
  calculatedGrams: number;
  unit: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  deltaKcal: number;
  deltaPivot: number;
  similarityScore: number; // 0 a 100%
  description?: string;
}

export interface FoodSwapResult {
  originalFoodName: string;
  originalQuantity: number;
  originalUnit: string;
  originalKcal: number;
  originalPivotValue: number;
  exchangeGroup: ExchangeGroupType;
  pivotNutrient: PivotNutrientType;
  alternatives: FoodSwapAlternative[];
}
