import type { DietItem, MealSlotType, DayDemandType } from '@/types/diet';
import type { DietEvent } from './dietEventTypes';

export interface AuditTimelineEntry {
  version: number;
  eventType: string;
  badge: {
    label: string;
    variant: 'neutral' | 'success' | 'warning' | 'purple' | 'danger';
  };
  title: string;
  description: string;
  author: string;
  role: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProjectedDietState {
  streamId: string;
  dietName: string;
  clientId: string;
  clientName: string;
  targetKcal: number;
  items: DietItem[];
  dayDemands: Record<number, DayDemandType>;
  version: number;
  maxVersionAvailable: number;
  isHistoricalSnapshot: boolean;
  appliedEventsCount: number;
  timeline: AuditTimelineEntry[];
}

const INITIAL_PROJECTED_STATE: ProjectedDietState = {
  streamId: '',
  dietName: '',
  clientId: '',
  clientName: '',
  targetKcal: 2000,
  items: [],
  dayDemands: {},
  version: 0,
  maxVersionAvailable: 0,
  isHistoricalSnapshot: false,
  appliedEventsCount: 0,
  timeline: [],
};

/**
 * Proyector CQRS de Estado de Dieta (Read Model)
 * 
 * Reconstruye el estado exacto de la dieta aplicando secuencialmente su stream de eventos inmutables.
 * Soporta Time Travel: si se especifica `targetVersion`, ignora los eventos posteriores
 * y devuelve el estado congelado en ese momento histórico.
 */
export function projectDietState(
  events: DietEvent[],
  targetVersion?: number
): ProjectedDietState {
  if (!events || events.length === 0) {
    return { ...INITIAL_PROJECTED_STATE };
  }

  // Ordenar eventos de forma ascendente por versión
  const sortedEvents = [...events].sort((a, b) => a.version - b.version);
  const maxVersion = sortedEvents[sortedEvents.length - 1].version;
  const effectiveTargetVersion =
    targetVersion !== undefined && targetVersion > 0 ? targetVersion : maxVersion;

  // Filtrar para Time Travel si se solicita una versión previa
  const eventsToApply = sortedEvents.filter((e) => e.version <= effectiveTargetVersion);

  let state: ProjectedDietState = {
    ...INITIAL_PROJECTED_STATE,
    streamId: sortedEvents[0].streamId,
    maxVersionAvailable: maxVersion,
    isHistoricalSnapshot: effectiveTargetVersion < maxVersion,
  };

  for (const event of eventsToApply) {
    state = applyEvent(state, event);
  }

  return state;
}

/**
 * Función reductora pura: aplica un evento al estado previo
 */
function applyEvent(state: ProjectedDietState, event: DietEvent): ProjectedDietState {
  const author = event.metadata?.author || 'Dra. Nutricionista';
  const role = event.metadata?.role || 'nutricionista';
  const timestamp = event.createdAt || new Date().toISOString();

  let timelineEntry: AuditTimelineEntry;

  switch (event.eventType) {
    case 'DietAssigned': {
      const p = event.payload;
      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Creación', variant: 'purple' },
        title: `Plan nutricional asignado: ${p.dietName}`,
        description: `Plan clínico inicial con objetivo de ${p.targetKcal} kcal y ${p.items.length} alimentos pautados.`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        dietName: p.dietName,
        clientId: p.clientId,
        clientName: p.clientName,
        targetKcal: p.targetKcal,
        items: [...p.items],
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'FoodSwapped': {
      const p = event.payload;
      const updatedItems = state.items.map((item) => {
        if (item.id === p.itemId) {
          return {
            ...item,
            foodId: p.newFood.id,
            foodName: p.newFood.name,
            quantity: p.newFood.quantity,
            unit: p.newFood.unit,
            kcal: p.newFood.kcal,
            proteinG: p.newFood.proteinG,
            carbsG: p.newFood.carbsG,
            fatG: p.newFood.fatG,
          };
        }
        return item;
      });

      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Intercambio', variant: 'success' },
        title: `Intercambio: ${p.oldFood.name} → ${p.newFood.name}`,
        description: `Se sustituyeron ${p.oldFood.quantity}${p.oldFood.unit} de ${p.oldFood.name} por ${p.newFood.quantity}${p.newFood.unit} de ${p.newFood.name} (${p.newFood.kcal} kcal). ${p.reason ? `Motivo: ${p.reason}` : ''}`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        items: updatedItems,
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'ItemQuantityUpdated': {
      const p = event.payload;
      const updatedItems = state.items.map((item) => {
        if (item.id === p.itemId) {
          return {
            ...item,
            quantity: p.newQuantity,
            kcal: p.newKcal,
            proteinG: p.newProteinG,
            carbsG: p.newCarbsG,
            fatG: p.newFatG,
          };
        }
        return item;
      });

      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Ajuste Porción', variant: 'warning' },
        title: `Ajuste de gramaje: ${p.oldQuantity}g → ${p.newQuantity}g`,
        description: `Porción recalculada a ${p.newQuantity}g (${p.newKcal} kcal, ${p.newProteinG}g P, ${p.newCarbsG}g C, ${p.newFatG}g G).`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        items: updatedItems,
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'ItemAdded': {
      const p = event.payload;
      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Alimento Añadido', variant: 'neutral' },
        title: `Nuevo alimento: ${p.item.foodName}`,
        description: `Añadido a ${p.item.mealSlot} (Día ${p.item.dayIndex}) con ${p.item.quantity}${p.item.unit} (${p.item.kcal} kcal).`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        items: [...state.items, p.item],
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'ItemRemoved': {
      const p = event.payload;
      const filteredItems = state.items.filter((item) => item.id !== p.itemId);

      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Eliminado', variant: 'danger' },
        title: `Alimento retirado: ${p.removedItemName}`,
        description: `Retirado de ${p.mealSlot} (Día ${p.dayIndex}).`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        items: filteredItems,
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'ItemReassigned': {
      const p = event.payload;
      const updatedItems = state.items.map((item) => {
        if (item.id === p.itemId) {
          return {
            ...item,
            dayIndex: p.newDayIndex,
            mealSlot: p.newMealSlot,
          };
        }
        return item;
      });

      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Reubicado', variant: 'purple' },
        title: `Alimento reubicado con Snap Magnético`,
        description: `Reasignado de ${p.previousMealSlot} (Día ${p.previousDayIndex}) a ${p.newMealSlot} (Día ${p.newDayIndex}).`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        items: updatedItems,
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'TargetMacrosAdjusted': {
      const p = event.payload;
      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Meta Calórica', variant: 'warning' },
        title: `Objetivo calórico: ${p.oldTargetKcal} kcal → ${p.newTargetKcal} kcal`,
        description: `Ajuste del objetivo clínico global. ${p.reason ? `Causa: ${p.reason}` : ''}`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        targetKcal: p.newTargetKcal,
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    case 'DayDemandConfigured': {
      const p = event.payload;
      timelineEntry = {
        version: event.version,
        eventType: event.eventType,
        badge: { label: 'Ciclado', variant: 'neutral' },
        title: `Día ${p.dayIndex} configurado como ${p.demandType}`,
        description: `Asignada demanda metabólica estratégica para el día de la semana.`,
        author,
        role,
        timestamp,
      };

      return {
        ...state,
        dayDemands: {
          ...state.dayDemands,
          [p.dayIndex]: p.demandType,
        },
        version: event.version,
        appliedEventsCount: state.appliedEventsCount + 1,
        timeline: [timelineEntry, ...state.timeline],
      };
    }

    default:
      return state;
  }
}
