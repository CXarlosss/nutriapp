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
  mealPrepNotes?: string;
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
  drugNutrientAlerts?: DrugNutrientInteractionAlert[];
}

// ==============================================================================
// HISTORIA CLÍNICA, ANALÍTICAS SANGUÍNEAS Y FARMACOTERAPIA (CORE MÉDICO)
// ==============================================================================

export interface BloodMarkerValue {
  value: number;
  unit: string;
  minRef: number;
  maxRef: number;
  status: 'optimal' | 'warning' | 'critical';
  label: string;
  category: 'hierro' | 'vitaminas' | 'glucemia' | 'lipidos' | 'tiroides';
}

export interface BloodTestReport {
  id: string;
  clientId: string;
  testDate: string;
  laboratoryName: string;
  notes?: string;
  markers: {
    // Hierro
    ferritina?: BloodMarkerValue;
    hierro_serico?: BloodMarkerValue;
    // Vitaminas
    vitamina_d?: BloodMarkerValue;
    vitamina_b12?: BloodMarkerValue;
    // Glucemia
    hba1c?: BloodMarkerValue;
    glucosa_basal?: BloodMarkerValue;
    // Perfil Lipídico
    colesterol_total?: BloodMarkerValue;
    colesterol_ldl?: BloodMarkerValue;
    colesterol_hdl?: BloodMarkerValue;
    trigliceridos?: BloodMarkerValue;
    // Tiroides
    tsh?: BloodMarkerValue;
    t4_libre?: BloodMarkerValue;
    t3_libre?: BloodMarkerValue;
  };
}

export type BristolStoolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DigestiveSymptomLog {
  id: string;
  clientId: string;
  weekStartDate: string;
  evaluationDate: string;
  bloatingScore: number; // 0 a 5
  refluxScore: number; // 0 a 5
  bristolStoolType: BristolStoolType; // 1 a 7
  chronicFatigueScore: number; // 0 a 5
  notes?: string;
  correlationTags: string[];
}

export interface PatientMedication {
  id: string;
  clientId: string;
  drugName: string; // ej. "Levotiroxina"
  activeIngredient: string; // ej. "Levothyroxine Sodium"
  dosage: string; // ej. "75 mcg"
  timingSlot: MealSlotType | 'ayunas_manana' | 'noche';
  indication: string; // ej. "Hipotiroidismo autoinmune"
  interactionsNotes?: string;
  active: boolean;
}

export interface DrugNutrientInteractionAlert {
  id: string;
  drugName: string;
  conflictingFoodName: string;
  conflictingSlot: MealSlotType;
  dayIndex: number;
  dayName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  biologicalMechanism: string;
  clinicalRecommendation: string;
  doiReference: string;
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

// ==============================================================================
// STRATEGIC NUTRIENT CYCLING (Ciclado Estratégico de Nutrientes y Días Ondulantes)
// ==============================================================================

export type DayDemandType =
  | 'entrenamiento_pesado'
  | 'entrenamiento_moderado'
  | 'descanso'
  | 'refeed';

export interface DayCyclingConfig {
  dayIndex: number;
  demandType: DayDemandType;
  label: string;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  trainingFocus?: string;
  icon?: string;
}

export interface CyclingPreset {
  id: string;
  name: string;
  description: string;
  trainingDaysCount: number;
  restDaysCount: number;
  days: Record<number, {
    demandType: DayDemandType;
    label: string;
    targetKcal: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
    trainingFocus?: string;
  }>;
}

// ==============================================================================
// ONBOARDING Y FORMULARIO PRE-CONSULTA SINCRONIZADO (CERO DATA ENTRY)
// ==============================================================================

export interface DailyRoutine {
  wakeUpTime?: string;
  bedTime?: string;
  workType?: string;
  mealsCount?: number;
  trainingSchedule?: string;
  stressLevel?: 'Bajo' | 'Medio' | 'Alto';
  waterLitersDaily?: number;
}

export interface DigestiveBaseline {
  habitualBristol?: BristolStoolType;
  bloatingFrequency?: string;
  acidReflux?: boolean;
  digestionNotes?: string;
}

export interface PreConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  age?: number;
  heightCm: number;
  currentWeightKg: number;
  goal: string;
  dietaryPreference: 'omnivoro' | 'vegetariano' | 'vegano' | 'pescetariano' | 'keto' | 'otro';
  allergies: string[];
  pathologies: string[];
  foodAversions: string[];
  dailyRoutine: DailyRoutine;
  digestiveBaseline: DigestiveBaseline;
  medications: Array<{
    drugName: string;
    dosage: string;
    timingSlot: MealSlotType | 'ayunas_manana' | 'noche';
    indication: string;
  }>;
  generalNotes?: string;
}

export interface ClientOnboardingProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  planName?: string;
  onboardingToken: string;
  onboardingStatus: 'pending' | 'completed';
  intakeCompletedAt?: string;
  formData: PreConsultationFormData;
}

// ==============================================================================
// USABILIDAD EXTREMA: LISTA DE LA COMPRA AUTOMATIZADA Y MEAL PREP
// ==============================================================================

export interface ShoppingItem {
  id: string;
  foodName: string;
  cleanName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  formattedDisplay: string; // ej. "1.2 kg", "250g", "4 ud"
  checked: boolean;
  frequencyPerWeek: number; // Número de veces que aparece en la semana
  mealPrepTips: string[];   // Instrucciones de preparación asociadas
}

export interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
  items: ShoppingItem[];
}

export interface ShoppingListSummary {
  totalItemsCount: number;
  checkedItemsCount: number;
  categories: ShoppingCategory[];
  allPrepNotes: Array<{
    foodName: string;
    note: string;
    dayName: string;
    mealSlot: MealSlotType;
  }>;
}

// ==============================================================================
// BANCO DE RECETAS Y DESEMPAQUETADO MÁGICO (DRAG & DROP ATÓMICO)
// ==============================================================================

export type RecipeDragPayload = {
  type: 'RECIPE';
  recipeId: string;
  name: string;
  items: Array<{
    foodId: string;
    foodName?: string;
    grams: number;
    unit?: string;
    kcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    notes?: string;
  }>;
};

export type FoodDragPayload = {
  type: 'FOOD';
  foodId: string;
  foodName?: string;
  quantity?: number;
};

export interface RecipeIngredient {
  foodId: string;
  foodName?: string;
  grams: number;
  unit?: string;
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena' | 'snack' | 'general';
  prepTimeMinutes?: number;
  totalKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  macros?: {
    kcal: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  tags: string[];
  notes?: string;
  ingredients: RecipeIngredient[];
}




