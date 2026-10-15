import { create } from 'zustand';
import { DietItem, DayCyclingConfig } from '@/types/diet';
import {
  safeLocalStorageGet,
  resilientSave,
  resilientSyncWithIndexedDb,
} from '@/lib/storage/resilientStorage';

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  targetKcal: number;
  tags: string[];
  version: number;
  createdAt: string;
  items: DietItem[];
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

// Plantillas clínicas base de alta adherencia
const DEFAULT_TEMPLATES: SavedTemplate[] = [
  {
    id: 'tmpl-hipertrofia-2400',
    name: 'Hipertrofia Limpia 2.400 kcal',
    description: 'Protocolo de superávit controlado (+250 kcal) con 2.0g/kg de proteína y ciclado de carbohidratos en días de pierna/espalda.',
    targetKcal: 2400,
    tags: ['Deportiva', 'Hipertrofia', 'Ciclado Carbs'],
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    items: [],
  },
  {
    id: 'tmpl-fodmap-antiinflamatoria',
    name: 'Baja en FODMAPs (Fase Eliminación)',
    description: 'Pauta clínica estricta de 4 semanas para SIBO y colon irritable. Exclusión de fructanos, GOS, lactosa y polioles.',
    targetKcal: 1900,
    tags: ['Clínica', 'Salud Intestinal', 'FODMAP', 'SIBO'],
    version: 1,
    createdAt: '2026-10-11T09:30:00Z',
    items: [],
  },
  {
    id: 'tmpl-recomposicion-1800',
    name: 'Recomposición Corporal Femenina 1.800 kcal',
    description: 'Enfoque metabólico para pérdida de grasa preservando masa magra. Alta saciedad con almidón resistente y grasas saludables.',
    targetKcal: 1800,
    tags: ['Pérdida Grasa', 'Recomposición', 'Mujer'],
    version: 1,
    createdAt: '2026-10-12T11:20:00Z',
    items: [],
  },
];

function getInitialTemplates(): SavedTemplate[] {
  const parsed = safeLocalStorageGet<SavedTemplate[]>(STORAGE_KEY, DEFAULT_TEMPLATES);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
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
