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
  notes?: string;
  isModified?: boolean;
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
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
