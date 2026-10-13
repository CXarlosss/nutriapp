import { create } from 'zustand';
import {
  DietItem,
  MealSlotType,
  MacroTotals,
  CellCoordinate,
  SaveStatus,
  Food,
  ClinicalAuditState,
  DayDemandType,
  DayCyclingConfig,
  CyclingPreset,
} from '@/types/diet';
import { persistDietItemsBatch } from '@/lib/services/dietService';
import { evaluateClinicalRules } from '@/lib/clinical/clinicalDecisionEngine';
import {
  getDefaultDayConfigs,
  evaluateDayCompliance,
  CYCLING_PRESETS,
  DayComplianceResult,
  DEMAND_CONFIGS,
} from '@/lib/clinical/nutrientCyclingEngine';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_SLOTS: MealSlotType[] = ['desayuno', 'media_manana', 'comida', 'merienda', 'cena'];

// Datos iniciales de demostración con micronutrientes
const INITIAL_ITEMS: DietItem[] = [
  {
    id: 'item-1',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'desayuno',
    position: 0,
    foodId: 'f-9',
    foodName: 'Avena en copos suaves',
    quantity: 60,
    unit: 'g',
    kcal: 227,
    proteinG: 8.1,
    carbsG: 40.8,
    fatG: 3.9,
    fiberG: 6.4,
    calciumMg: 32,
    ironMg: 2.8,
    omega3G: 0.1,
    omega6G: 1.4,
  },
  {
    id: 'item-2',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'desayuno',
    position: 1,
    foodId: 'f-8',
    foodName: 'Yogur griego 0% grasa natural',
    quantity: 150,
    unit: 'g',
    kcal: 89,
    proteinG: 15.0,
    carbsG: 5.4,
    fatG: 0.0,
    fiberG: 0.0,
    calciumMg: 165,
    ironMg: 0.1,
    omega3G: 0.0,
    omega6G: 0.05,
  },
  {
    id: 'item-3',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'comida',
    position: 0,
    foodId: 'f-1',
    foodName: 'Pechuga de pollo a la plancha',
    quantity: 180,
    unit: 'g',
    kcal: 297,
    proteinG: 55.8,
    carbsG: 0.0,
    fatG: 6.5,
    fiberG: 0.0,
    calciumMg: 27,
    ironMg: 1.8,
    omega3G: 0.1,
    omega6G: 0.5,
  },
  {
    id: 'item-4',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'comida',
    position: 1,
    foodId: 'f-12',
    foodName: 'Arroz blanco basmati',
    quantity: 70,
    unit: 'g',
    kcal: 248,
    proteinG: 5.2,
    carbsG: 55.3,
    fatG: 0.4,
    fiberG: 0.8,
    calciumMg: 10,
    ironMg: 0.6,
    omega3G: 0.0,
    omega6G: 0.15,
  },
  {
    id: 'item-5',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'cena',
    position: 0,
    foodId: 'f-4',
    foodName: 'Salmón fresco al horno',
    quantity: 160,
    unit: 'g',
    kcal: 333,
    proteinG: 32.0,
    carbsG: 0.0,
    fatG: 20.8,
    fiberG: 0.0,
    calciumMg: 20,
    ironMg: 1.3,
    omega3G: 3.5,
    omega6G: 1.0,
  },
];

interface DietStoreState {
  dietId: string;
  dietName: string;
  clientName: string;
  clientWeightKg: number;
  clientProfileType: 'deportista' | 'sedentario' | 'general';
  items: DietItem[];
  targetKcal: number;
  
  // Navegación por teclado
  focusedCell: CellCoordinate | null;
  isEditingCell: boolean;

  // Motor de Autoguardado y Concurrencia
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  saveRevision: number;
  pendingMutations: Map<string, DietItem>;
  isSavingMutex: boolean;
  saveTimerId: NodeJS.Timeout | null;
  lastNetworkBatchSize: number;

  // Acciones
  setFocusedCell: (cell: CellCoordinate | null) => void;
  startEditing: () => void;
  stopEditing: () => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => void;
  setClientWeightKg: (weight: number) => void;
  setClientProfileType: (profile: 'deportista' | 'sedentario' | 'general') => void;
  
  // Mutaciones optimistas de ítems
  updateItemQuantity: (id: string, quantity: number) => void;
  replaceItemFood: (id: string, food: Food, quantity?: number) => void;
  addItemToSlot: (dayIndex: number, mealSlot: MealSlotType, food: Food, quantity?: number) => void;
  removeItem: (id: string) => void;
  copyDayToAllDays: (sourceDayIndex: number) => void;
  
  // Selectores y cálculos CDSS
  getItemsForSlot: (dayIndex: number, mealSlot: MealSlotType) => DietItem[];
  getDayTotals: (dayIndex: number) => MacroTotals;
  getSlotTotals: (dayIndex: number, mealSlot: MealSlotType) => MacroTotals;
  getWeekAverageKcal: () => number;
  getClinicalAudit: () => ClinicalAuditState;

  // Ciclado Estratégico de Nutrientes
  dayCyclingConfigs: Record<number, DayCyclingConfig>;
  activeCyclingPresetId: string | null;
  setDayDemandType: (dayIndex: number, demandType: DayDemandType) => void;
  updateDayCyclingTarget: (dayIndex: number, targets: Partial<DayCyclingConfig>) => void;
  applyCyclingPreset: (presetId: string) => void;
  getDayCyclingConfig: (dayIndex: number) => DayCyclingConfig;
  getDayCompliance: (dayIndex: number) => DayComplianceResult;

  // Motor interno de guardado
  enqueueSaveMutation: (item: DietItem) => void;
  flushPendingMutations: () => Promise<void>;
}

export type DietState = DietStoreState;

export const useDietStore = create<DietStoreState>((set, get) => ({
  dietId: 'diet-demo-1',
  dietName: 'Definición Muscular 1900 kcal',
  clientName: 'Carlos Gómez Pardo',
  clientWeightKg: 76.4,
  clientProfileType: 'deportista',
  items: INITIAL_ITEMS,
  targetKcal: 1900,

  // Ciclado Estratégico de Nutrientes Inicial (Hipertrofia 4:3)
  dayCyclingConfigs: getDefaultDayConfigs(),
  activeCyclingPresetId: 'hipertrofia_4_3',

  focusedCell: { dayIndex: 1, mealSlot: 'desayuno', itemIndex: 0, field: 'quantity' },
  isEditingCell: false,

  saveStatus: 'saved',
  lastSavedAt: new Date(),
  saveRevision: 0,
  pendingMutations: new Map<string, DietItem>(),
  isSavingMutex: false,
  saveTimerId: null,
  lastNetworkBatchSize: 0,

  setFocusedCell: (cell) => set({ focusedCell: cell }),
  startEditing: () => set({ isEditingCell: true }),
  stopEditing: () => set({ isEditingCell: false }),

  setClientWeightKg: (weight) => set({ clientWeightKg: weight }),
  setClientProfileType: (profile) => set({ clientProfileType: profile }),

  moveFocus: (direction) => {
    const current = get().focusedCell;
    if (!current) {
      set({ focusedCell: { dayIndex: 1, mealSlot: 'desayuno', itemIndex: 0, field: 'name' } });
      return;
    }

    let nextDay = current.dayIndex;
    let nextSlotIndex = MEAL_SLOTS.indexOf(current.mealSlot);

    switch (direction) {
      case 'right':
        nextDay = nextDay >= 7 ? 1 : nextDay + 1;
        break;
      case 'left':
        nextDay = nextDay <= 1 ? 7 : nextDay - 1;
        break;
      case 'down':
        nextSlotIndex = (nextSlotIndex + 1) % MEAL_SLOTS.length;
        break;
      case 'up':
        nextSlotIndex = (nextSlotIndex - 1 + MEAL_SLOTS.length) % MEAL_SLOTS.length;
        break;
      case 'tab':
        nextDay = nextDay >= 7 ? 1 : nextDay + 1;
        if (nextDay === 1) {
          nextSlotIndex = (nextSlotIndex + 1) % MEAL_SLOTS.length;
        }
        break;
      case 'shift-tab':
        nextDay = nextDay <= 1 ? 7 : nextDay - 1;
        if (nextDay === 7) {
          nextSlotIndex = (nextSlotIndex - 1 + MEAL_SLOTS.length) % MEAL_SLOTS.length;
        }
        break;
    }

    const nextSlot = MEAL_SLOTS[nextSlotIndex];
    set({
      focusedCell: {
        dayIndex: nextDay,
        mealSlot: nextSlot,
        itemIndex: 0,
        field: 'name',
      },
    });
  },

  updateItemQuantity: (id, quantity) => {
    const items = get().items;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const safeQty = Math.max(1, quantity);
    const ratio = safeQty / (target.quantity || 1);
    
    // Recálculo dinámico proporcional de macronutrientes y micronutrientes
    const updated: DietItem = {
      ...target,
      quantity: safeQty,
      kcal: Math.round(target.kcal * ratio),
      proteinG: Number((target.proteinG * ratio).toFixed(1)),
      carbsG: Number((target.carbsG * ratio).toFixed(1)),
      fatG: Number((target.fatG * ratio).toFixed(1)),
      fiberG: target.fiberG !== undefined ? Number((target.fiberG * ratio).toFixed(1)) : undefined,
      calciumMg: target.calciumMg !== undefined ? Number((target.calciumMg * ratio).toFixed(1)) : undefined,
      ironMg: target.ironMg !== undefined ? Number((target.ironMg * ratio).toFixed(1)) : undefined,
      omega3G: target.omega3G !== undefined ? Number((target.omega3G * ratio).toFixed(2)) : undefined,
      omega6G: target.omega6G !== undefined ? Number((target.omega6G * ratio).toFixed(2)) : undefined,
      isModified: true,
    };

    // Actualización visual optimista instantánea (60 FPS)
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));

    // Encolar en el motor de autoguardado con mutex
    get().enqueueSaveMutation(updated);
  },

  replaceItemFood: (id, food, quantity = 100) => {
    const items = get().items;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const ratio = quantity / 100;
    const updated: DietItem = {
      ...target,
      foodId: food.id,
      foodName: food.name,
      quantity,
      unit: food.default_unit || 'g',
      kcal: Math.round(food.kcal * ratio),
      proteinG: Number((food.protein_g * ratio).toFixed(1)),
      carbsG: Number((food.carbs_g * ratio).toFixed(1)),
      fatG: Number((food.fat_g * ratio).toFixed(1)),
      fiberG: Number(((food.fiber_g || 0) * ratio).toFixed(1)),
      calciumMg: Number(((food.calcium_mg || 0) * ratio).toFixed(1)),
      ironMg: Number(((food.iron_mg || 0) * ratio).toFixed(1)),
      omega3G: Number(((food.omega3_g || 0) * ratio).toFixed(2)),
      omega6G: Number(((food.omega6_g || 0) * ratio).toFixed(2)),
      isModified: true,
    };

    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
      isEditingCell: false,
    }));

    get().enqueueSaveMutation(updated);
  },

  addItemToSlot: (dayIndex, mealSlot, food, quantity = 100) => {
    const ratio = quantity / 100;
    const currentSlotItems = get().items.filter(
      (i) => i.dayIndex === dayIndex && i.mealSlot === mealSlot
    );

    const newItem: DietItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dietId: get().dietId,
      dayIndex,
      mealSlot,
      position: currentSlotItems.length,
      foodId: food.id,
      foodName: food.name,
      quantity,
      unit: food.default_unit || 'g',
      kcal: Math.round(food.kcal * ratio),
      proteinG: Number((food.protein_g * ratio).toFixed(1)),
      carbsG: Number((food.carbs_g * ratio).toFixed(1)),
      fatG: Number((food.fat_g * ratio).toFixed(1)),
      fiberG: Number(((food.fiber_g || 0) * ratio).toFixed(1)),
      calciumMg: Number(((food.calcium_mg || 0) * ratio).toFixed(1)),
      ironMg: Number(((food.iron_mg || 0) * ratio).toFixed(1)),
      omega3G: Number(((food.omega3_g || 0) * ratio).toFixed(2)),
      omega6G: Number(((food.omega6_g || 0) * ratio).toFixed(2)),
      isModified: true,
    };

    set((state) => ({
      items: [...state.items, newItem],
    }));

    get().enqueueSaveMutation(newItem);
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  copyDayToAllDays: (sourceDayIndex) => {
    const sourceItems = get().items.filter((i) => i.dayIndex === sourceDayIndex);
    if (sourceItems.length === 0) return;

    const newItems: DietItem[] = [];
    const queue = get().pendingMutations;

    for (let day = 1; day <= 7; day++) {
      if (day === sourceDayIndex) {
        newItems.push(...sourceItems);
      } else {
        sourceItems.forEach((item, idx) => {
          const cloned: DietItem = {
            ...item,
            id: `temp-d${day}-${idx}-${Date.now()}`,
            dayIndex: day,
            isModified: true,
          };
          newItems.push(cloned);
          queue.set(cloned.id, cloned);
        });
      }
    }

    set({ items: newItems, saveStatus: 'unsaved' });
    get().enqueueSaveMutation(newItems[0]);
  },

  getItemsForSlot: (dayIndex, mealSlot) => {
    return get().items.filter((i) => i.dayIndex === dayIndex && i.mealSlot === mealSlot);
  },

  getDayTotals: (dayIndex) => {
    const dayItems = get().items.filter((i) => i.dayIndex === dayIndex);
    return dayItems.reduce<MacroTotals>(
      (acc, item) => ({
        kcal: acc.kcal + (item.kcal || 0),
        protein: Number((acc.protein + (item.proteinG || 0)).toFixed(1)),
        carbs: Number((acc.carbs + (item.carbsG || 0)).toFixed(1)),
        fat: Number((acc.fat + (item.fatG || 0)).toFixed(1)),
        fiber: Number((acc.fiber + (item.fiberG || 0)).toFixed(1)),
        calcium: Number((acc.calcium + (item.calciumMg || 0)).toFixed(1)),
        iron: Number((acc.iron + (item.ironMg || 0)).toFixed(1)),
        omega3: Number((acc.omega3 + (item.omega3G || 0)).toFixed(2)),
        omega6: Number((acc.omega6 + (item.omega6G || 0)).toFixed(2)),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, omega3: 0, omega6: 0 }
    );
  },

  getSlotTotals: (dayIndex, mealSlot) => {
    const slotItems = get().items.filter(
      (i) => i.dayIndex === dayIndex && i.mealSlot === mealSlot
    );
    return slotItems.reduce<MacroTotals>(
      (acc, item) => ({
        kcal: acc.kcal + (item.kcal || 0),
        protein: Number((acc.protein + (item.proteinG || 0)).toFixed(1)),
        carbs: Number((acc.carbs + (item.carbsG || 0)).toFixed(1)),
        fat: Number((acc.fat + (item.fatG || 0)).toFixed(1)),
        fiber: Number((acc.fiber + (item.fiberG || 0)).toFixed(1)),
        calcium: Number((acc.calcium + (item.calciumMg || 0)).toFixed(1)),
        iron: Number((acc.iron + (item.ironMg || 0)).toFixed(1)),
        omega3: Number((acc.omega3 + (item.omega3G || 0)).toFixed(2)),
        omega6: Number((acc.omega6 + (item.omega6G || 0)).toFixed(2)),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, omega3: 0, omega6: 0 }
    );
  },

  getWeekAverageKcal: () => {
    const items = get().items;
    const totalKcal = items.reduce((sum, item) => sum + (item.kcal || 0), 0);
    return Math.round(totalKcal / 7);
  },

  /**
   * Selector Puro del Motor CDSS:
   * Calcula ratios clínicos y audita contra guías de evidencia en tiempo real (60 FPS)
   */
  getClinicalAudit: () => {
    const state = get();
    return evaluateClinicalRules(state.items, state.clientWeightKg, state.clientProfileType);
  },

  /**
   * Ciclado Estratégico de Nutrientes:
   * Ajusta reactivamente la demanda energética y de carbos por día.
   */
  setDayDemandType: (dayIndex, demandType) => {
    set((state) => {
      const current = state.dayCyclingConfigs[dayIndex];
      if (!current) return state;

      const demandMeta = DEMAND_CONFIGS[demandType];
      let targetKcal = current.targetKcal;
      let targetCarbsG = current.targetCarbsG;
      let targetFatG = current.targetFatG;

      if (demandType === 'entrenamiento_pesado') {
        targetKcal = 2250;
        targetCarbsG = 260;
        targetFatG = 60;
      } else if (demandType === 'descanso') {
        targetKcal = 1700;
        targetCarbsG = 120;
        targetFatG = 65;
      } else if (demandType === 'refeed') {
        targetKcal = 2450;
        targetCarbsG = 360;
        targetFatG = 40;
      } else {
        targetKcal = 1900;
        targetCarbsG = 190;
        targetFatG = 50;
      }

      return {
        dayCyclingConfigs: {
          ...state.dayCyclingConfigs,
          [dayIndex]: {
            ...current,
            demandType,
            targetKcal,
            targetCarbsG,
            targetFatG,
            icon: demandMeta.icon,
          },
        },
      };
    });
  },

  updateDayCyclingTarget: (dayIndex, targets) => {
    set((state) => {
      const current = state.dayCyclingConfigs[dayIndex];
      if (!current) return state;
      return {
        dayCyclingConfigs: {
          ...state.dayCyclingConfigs,
          [dayIndex]: {
            ...current,
            ...targets,
          },
        },
      };
    });
  },

  applyCyclingPreset: (presetId) => {
    const preset = CYCLING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newConfigs: Record<number, DayCyclingConfig> = {};
    for (let d = 1; d <= 7; d++) {
      const pDay = preset.days[d];
      newConfigs[d] = {
        dayIndex: d,
        demandType: pDay.demandType,
        label: pDay.label,
        targetKcal: pDay.targetKcal,
        targetProteinG: pDay.targetProteinG,
        targetCarbsG: pDay.targetCarbsG,
        targetFatG: pDay.targetFatG,
        trainingFocus: pDay.trainingFocus,
        icon: DEMAND_CONFIGS[pDay.demandType].icon,
      };
    }

    set({
      dayCyclingConfigs: newConfigs,
      activeCyclingPresetId: presetId,
    });
  },

  getDayCyclingConfig: (dayIndex) => {
    const configs = get().dayCyclingConfigs;
    return configs[dayIndex] || getDefaultDayConfigs()[dayIndex];
  },

  getDayCompliance: (dayIndex) => {
    const totals = get().getDayTotals(dayIndex);
    const config = get().getDayCyclingConfig(dayIndex);
    return evaluateDayCompliance(totals, config);
  },

  /**
   * Encola una modificación en el Map de mutaciones pendientes y reinicia el debounce de 500ms.
   */
  enqueueSaveMutation: (item) => {
    const state = get();
    state.pendingMutations.set(item.id, item);

    if (state.saveTimerId) {
      clearTimeout(state.saveTimerId);
    }

    const timerId = setTimeout(() => {
      get().flushPendingMutations();
    }, 500);

    set({
      saveTimerId: timerId,
      saveStatus: 'unsaved',
    });
  },

  flushPendingMutations: async () => {
    const { isSavingMutex, pendingMutations } = get();

    if (isSavingMutex) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Autosave] Petición en curso. Cambios encolados a la espera de finalizar.');
      }
      return;
    }

    if (pendingMutations.size === 0) {
      set({ saveStatus: 'saved' });
      return;
    }

    const batchToPersist = Array.from(pendingMutations.values());
    pendingMutations.clear();

    const currentRevision = get().saveRevision + 1;

    set({
      isSavingMutex: true,
      saveStatus: 'saving',
      saveRevision: currentRevision,
      lastNetworkBatchSize: batchToPersist.length,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Autosave Network Call] Enviando 1 único POST/UPDATE en bloque para ${batchToPersist.length} ítems. Revisión #${currentRevision}`);
    }

    try {
      await persistDietItemsBatch(batchToPersist);
      
      set({
        isSavingMutex: false,
        lastSavedAt: new Date(),
        saveStatus: 'saved',
      });

      if (get().pendingMutations.size > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Autosave Chain] Detectadas ${get().pendingMutations.size} modificaciones posteriores durante el vuelo. Procesando nuevo lote.`);
        }
        get().flushPendingMutations();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Autosave Error] Error en persistencia:', error);
      }
      batchToPersist.forEach((item) => {
        if (!get().pendingMutations.has(item.id)) {
          get().pendingMutations.set(item.id, item);
        }
      });
      set({
        isSavingMutex: false,
        saveStatus: 'error',
      });
    }
  },
}));

/**
 * Selector puro de Zustand:
 * Cruza los datos de la cuadrícula semanal con el peso del perfil del cliente
 * para calcular los gramos de proteína por kilogramo de peso corporal (g/kg/día).
 */
export const selectProteinPerKg = (state: DietState): number => {
  const safeWeight = Math.max(30, state.clientWeightKg || 70);
  let totalProteinWeekly = 0;
  for (let i = 0; i < state.items.length; i++) {
    totalProteinWeekly += state.items[i].proteinG || 0;
  }
  const proteinDailyAvg = totalProteinWeekly / 7;
  return Number((proteinDailyAvg / safeWeight).toFixed(2));
};

/**
 * Selector puro para la auditoría clínica completa (CDSS)
 */
export const selectClinicalAudit = (state: DietState): ClinicalAuditState => {
  return evaluateClinicalRules(state.items, state.clientWeightKg, state.clientProfileType);
};
