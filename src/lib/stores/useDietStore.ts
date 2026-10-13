import { create } from 'zustand';
import { DietItem, MealSlotType, MacroTotals, CellCoordinate, SaveStatus, Food } from '@/types/diet';
import { persistDietItemsBatch } from '@/lib/services/dietService';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_SLOTS: MealSlotType[] = ['desayuno', 'media_manana', 'comida', 'merienda', 'cena'];

// Datos iniciales de demostración
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
  },
  {
    id: 'item-4',
    dietId: 'diet-demo-1',
    dayIndex: 1,
    mealSlot: 'comida',
    position: 1,
    foodId: 'f-10',
    foodName: 'Arroz blanco basmati (crudo)',
    quantity: 80,
    unit: 'g',
    kcal: 284,
    proteinG: 6.0,
    carbsG: 63.2,
    fatG: 0.5,
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
  },
];

interface DietStoreState {
  dietId: string;
  dietName: string;
  clientName: string;
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
  
  // Mutaciones optimistas de ítems
  updateItemQuantity: (id: string, quantity: number) => void;
  replaceItemFood: (id: string, food: Food, quantity?: number) => void;
  addItemToSlot: (dayIndex: number, mealSlot: MealSlotType, food: Food, quantity?: number) => void;
  removeItem: (id: string) => void;
  copyDayToAllDays: (sourceDayIndex: number) => void;
  
  // Selectores y cálculos
  getItemsForSlot: (dayIndex: number, mealSlot: MealSlotType) => DietItem[];
  getDayTotals: (dayIndex: number) => MacroTotals;
  getSlotTotals: (dayIndex: number, mealSlot: MealSlotType) => MacroTotals;
  getWeekAverageKcal: () => number;

  // Motor interno de guardado
  enqueueSaveMutation: (item: DietItem) => void;
  flushPendingMutations: () => Promise<void>;
}

export const useDietStore = create<DietStoreState>((set, get) => ({
  dietId: 'diet-demo-1',
  dietName: 'Definición Muscular 1900 kcal',
  clientName: 'Carlos Pérez',
  items: INITIAL_ITEMS,
  targetKcal: 1900,

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

  moveFocus: (direction) => {
    const current = get().focusedCell;
    if (!current) {
      set({ focusedCell: { dayIndex: 1, mealSlot: 'desayuno', itemIndex: 0, field: 'name' } });
      return;
    }

    let nextDay = current.dayIndex;
    let nextSlotIndex = MEAL_SLOTS.indexOf(current.mealSlot);

    switch (direction) {
      case 'left':
        nextDay = current.dayIndex > 1 ? current.dayIndex - 1 : 7;
        break;
      case 'right':
        nextDay = current.dayIndex < 7 ? current.dayIndex + 1 : 1;
        break;
      case 'up':
        nextSlotIndex = nextSlotIndex > 0 ? nextSlotIndex - 1 : MEAL_SLOTS.length - 1;
        break;
      case 'down':
        nextSlotIndex = nextSlotIndex < MEAL_SLOTS.length - 1 ? nextSlotIndex + 1 : 0;
        break;
      case 'tab':
        // Tab avanza secuencialmente: siguiente día, y al terminar la fila de días baja a la siguiente comida
        if (nextDay < 7) {
          nextDay += 1;
        } else {
          nextDay = 1;
          nextSlotIndex = (nextSlotIndex + 1) % MEAL_SLOTS.length;
        }
        break;
      case 'shift-tab':
        if (nextDay > 1) {
          nextDay -= 1;
        } else {
          nextDay = 7;
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
    
    // Recálculo dinámico de macros proporcional
    const updated: DietItem = {
      ...target,
      quantity: safeQty,
      kcal: Math.round(target.kcal * ratio),
      proteinG: Number((target.proteinG * ratio).toFixed(1)),
      carbsG: Number((target.carbsG * ratio).toFixed(1)),
      fatG: Number((target.fatG * ratio).toFixed(1)),
      isModified: true,
    };

    // Actualización visual optimista instantánea
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));

    // Encolar en el motor de autoguardado
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
    // Se registra como guardado o se sincroniza en batch
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
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
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
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  getWeekAverageKcal: () => {
    const items = get().items;
    const totalKcal = items.reduce((sum, item) => sum + (item.kcal || 0), 0);
    return Math.round(totalKcal / 7);
  },

  /**
   * Encola una modificación en el Map de mutaciones pendientes y reinicia el debounce de 500ms.
   */
  enqueueSaveMutation: (item) => {
    const state = get();
    // Guardamos siempre la versión más reciente del ítem en el mapa (clave: item.id)
    state.pendingMutations.set(item.id, item);

    // Cancelamos timer previo para aplicar el debounce de 500ms
    if (state.saveTimerId) {
      clearTimeout(state.saveTimerId);
    }

    const timerId = setTimeout(() => {
      get().flushPendingMutations();
    }, 500);

    set({
      saveStatus: 'unsaved',
      saveTimerId: timerId,
    });
  },

  /**
   * Ejecuta el guardado en bloque protegiendo contra Race Conditions mediante Mutex y Re-triggering.
   */
  flushPendingMutations: async () => {
    const { isSavingMutex, pendingMutations } = get();

    // PREVENCIÓN DE RACE CONDITION:
    // Si ya hay una petición HTTP en vuelo, no disparamos otra en paralelo para no generar colisiones.
    // Dejamos los ítems en pendingMutations; cuando la petición activa termine, procesará la cola acumulada.
    if (isSavingMutex) {
      console.log('[Autosave] Petición en curso. Cambios encolados a la espera de finalizar.');
      return;
    }

    if (pendingMutations.size === 0) {
      set({ saveStatus: 'saved' });
      return;
    }

    // Tomamos snapshot atómico de todos los ítems pendientes acumulados
    const batchToPersist = Array.from(pendingMutations.values());
    // Vaciamos la cola de mutaciones tomada
    pendingMutations.clear();

    const currentRevision = get().saveRevision + 1;

    set({
      isSavingMutex: true,
      saveStatus: 'saving',
      saveRevision: currentRevision,
      lastNetworkBatchSize: batchToPersist.length,
    });

    console.log(`[Autosave Network Call] Enviando 1 único POST/UPDATE en bloque para ${batchToPersist.length} ítems. Revisión #${currentRevision}`);

    try {
      const result = await persistDietItemsBatch(batchToPersist);
      
      set({
        isSavingMutex: false,
        lastSavedAt: new Date(),
        saveStatus: 'saved',
      });

      // Si el usuario modificó más celdas mientras la petición estaba en tránsito,
      // pendingMutations tendrá nuevos elementos. Disparamos de inmediato el siguiente batch.
      if (get().pendingMutations.size > 0) {
        console.log(`[Autosave Chain] Detectadas ${get().pendingMutations.size} modificaciones posteriores durante el vuelo. Procesando nuevo lote.`);
        get().flushPendingMutations();
      }
    } catch (error) {
      console.error('[Autosave Error] Error en persistencia:', error);
      // En caso de fallo de red, reinsertamos los ítems fallidos en la cola si no fueron sobreescritos
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
