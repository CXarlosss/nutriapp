import { create } from 'zustand';
import { DietItem, DayCyclingConfig } from '@/types/diet';
import {
  safeLocalStorageGet,
  resilientSave,
  resilientSyncWithIndexedDb,
} from '@/lib/storage/resilientStorage';

import { DEFAULT_CLINICAL_TEMPLATES } from '@/lib/data/defaultTemplates';

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  targetKcal: number;
  kcal?: number;
  tags: string[];
  version: number;
  createdAt: string;
  items: DietItem[];
  days?: any[];
  dayCyclingConfigs?: Record<number, DayCyclingConfig>;
}

interface TemplateStoreState {
  templates: SavedTemplate[];
  saveAsTemplate: (data: {
    name: string;
    description: string;
    targetKcal?: number;
    tags: string[];
    items: DietItem[];
    dayCyclingConfigs?: Record<number, DayCyclingConfig>;
  }) => SavedTemplate;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => SavedTemplate | undefined;
}

const STORAGE_KEY = 'nutriapp_custom_templates';

function getInitialTemplates(): SavedTemplate[] {
  const baseTemplates = DEFAULT_CLINICAL_TEMPLATES as unknown as SavedTemplate[];
  const parsed = safeLocalStorageGet<SavedTemplate[]>(STORAGE_KEY, baseTemplates);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return baseTemplates;
  }
  // Garantizar que las 6 plantillas clínicas maestras estén siempre disponibles (fusión inteligente)
  const existingIds = new Set(parsed.map((t) => t.id));
  const merged = [...parsed];
  for (const defTmpl of baseTemplates) {
    if (!existingIds.has(defTmpl.id)) {
      merged.push(defTmpl);
      existingIds.add(defTmpl.id);
    }
  }
  return merged;
}

export const useTemplateStore = create<TemplateStoreState>((set, get) => ({
  templates: getInitialTemplates(),

  saveAsTemplate: ({ name, description, targetKcal, tags, items, dayCyclingConfigs }) => {
    // Clonación profunda de los items para desacoplarlos del estado activo de la dieta
    const clonedItems: DietItem[] = JSON.parse(JSON.stringify(items)).map((item: DietItem, index: number) => ({
      ...item,
      id: `tmpl-item-${Date.now()}-${index}`,
      dietId: 'template',
    }));

    // Calcular kcal media si no se proporciona
    const calculatedKcal =
      targetKcal ||
      (clonedItems.length > 0
        ? Math.round(
            clonedItems.reduce((acc, curr) => acc + (curr.kcal || 0), 0) /
              Math.max(1, new Set(clonedItems.map((i) => i.dayIndex)).size)
          )
        : 1800);

    const newTemplate: SavedTemplate = {
      id: `tmpl-${Date.now()}`,
      name: name.trim() || 'Plantilla Nutricional',
      description: description.trim() || 'Estructura nutricional calculada de 7 días.',
      targetKcal: calculatedKcal,
      tags: tags.length > 0 ? tags : ['Personalizada'],
      version: 1,
      createdAt: new Date().toISOString(),
      items: clonedItems,
      dayCyclingConfigs: dayCyclingConfigs ? JSON.parse(JSON.stringify(dayCyclingConfigs)) : undefined,
    };

    set((state) => {
      const updated = [newTemplate, ...state.templates];
      // Persistencia híbrida a prueba de QuotaExceededError (IndexedDB + localStorage)
      resilientSave(STORAGE_KEY, updated);
      return { templates: updated };
    });

    return newTemplate;
  },

  deleteTemplate: (id: string) => {
    set((state) => {
      const updated = state.templates.filter((t) => t.id !== id);
      // Persistencia híbrida a prueba de QuotaExceededError (IndexedDB + localStorage)
      resilientSave(STORAGE_KEY, updated);
      return { templates: updated };
    });
  },

  getTemplateById: (id: string) => {
    return get().templates.find((t) => t.id === id);
  },
}));

// Sincronización transparente con IndexedDB (capacidad ilimitada) en cliente
if (typeof window !== 'undefined') {
  resilientSyncWithIndexedDb<SavedTemplate[]>(
    STORAGE_KEY,
    getInitialTemplates(),
    (idbTemplates) => {
      if (Array.isArray(idbTemplates) && idbTemplates.length > 0) {
        useTemplateStore.setState({ templates: idbTemplates });
      }
    }
  );
}
