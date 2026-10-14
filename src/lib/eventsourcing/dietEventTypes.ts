import { DietItem, MealSlotType, DayDemandType } from '@/types/diet';

export type DietEventType =
  | 'DietAssigned'
  | 'FoodSwapped'
  | 'ItemQuantityUpdated'
  | 'ItemAdded'
  | 'ItemRemoved'
  | 'TargetMacrosAdjusted'
  | 'DayDemandConfigured';

export interface BaseDietEvent<TType extends DietEventType, TPayload> {
  id: string;
  streamId: string;
  version: number;
  eventType: TType;
  payload: TPayload;
  metadata?: {
    author?: string;
    role?: 'nutricionista' | 'paciente' | 'ia';
    reason?: string;
    timestamp?: string;
  };
  createdAt: string;
}

// 1. Asignación inicial de dieta
export type DietAssignedEvent = BaseDietEvent<'DietAssigned', {
  dietId: string;
  dietName: string;
  clientId: string;
  clientName: string;
  targetKcal: number;
  items: DietItem[];
}>;

// 2. Intercambio de alimentos (Food Swap)
export type FoodSwappedEvent = BaseDietEvent<'FoodSwapped', {
  itemId: string;
  dayIndex: number;
  mealSlot: MealSlotType;
  oldFood: {
    id?: string | null;
    name: string;
    quantity: number;
    unit: string;
    kcal: number;
  };
  newFood: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  reason?: string;
}>;

// 3. Modificación de cantidad (gramos/porción)
export type ItemQuantityUpdatedEvent = BaseDietEvent<'ItemQuantityUpdated', {
  itemId: string;
  oldQuantity: number;
  newQuantity: number;
  newKcal: number;
  newProteinG: number;
  newCarbsG: number;
  newFatG: number;
}>;

// 4. Inserción de alimento en una comida
export type ItemAddedEvent = BaseDietEvent<'ItemAdded', {
  item: DietItem;
}>;

// 5. Eliminación de alimento
export type ItemRemovedEvent = BaseDietEvent<'ItemRemoved', {
  itemId: string;
  removedItemName: string;
  mealSlot: MealSlotType;
  dayIndex: number;
}>;

// 6. Ajuste de objetivos calóricos/macros
export type TargetMacrosAdjustedEvent = BaseDietEvent<'TargetMacrosAdjusted', {
  oldTargetKcal: number;
  newTargetKcal: number;
  reason?: string;
}>;

// 7. Ciclado de nutrientes por día
export type DayDemandConfiguredEvent = BaseDietEvent<'DayDemandConfigured', {
  dayIndex: number;
  demandType: DayDemandType;
}>;

export type DietEvent =
  | DietAssignedEvent
  | FoodSwappedEvent
  | ItemQuantityUpdatedEvent
  | ItemAddedEvent
  | ItemRemovedEvent
  | TargetMacrosAdjustedEvent
  | DayDemandConfiguredEvent;
