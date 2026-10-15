import { create } from 'zustand';
import { DietItem, DayCyclingConfig } from '@/types/diet';

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

const STORAGE_KEY = 'nutriapp_saved_templates';

const DEFAULT_TEMPLATES: SavedTemplate[] = [
  {
    id: 't1',
    name: 'Déficit Calórico Moderado',
    description: 'Estructura equilibrada con alta saciedad, rica en proteínas y verduras fibrosas para mantenimiento muscular.',
    targetKcal: 1800,
    tags: ['Pérdida de Grasa', 'Alta Proteína'],
    version: 2,
    createdAt: '2026-10-01T10:00:00Z',
    items: [],
  },
  {
    id: 't2',
    name: 'Recomposición Normocalórica',
    description: 'Distribución ciclada de carbohidratos en días de entrenamiento de fuerza para máxima recuperación.',
    targetKcal: 2200,
    tags: ['Recomposición', 'Fuerza'],
    version: 3,
    createdAt: '2026-10-05T12:30:00Z',
    items: [],
  },
  {
    id: 't3',
    name: 'Superávit Hipertrofia Limpia',
    description: 'Enfoque denso nutricionalmente con grasas monoinsaturadas y carbohidratos de fácil asimilación.',
    targetKcal: 2750,
    tags: ['Volumen', 'Alta Proteína'],
    version: 1,
    createdAt: '2026-10-08T09:15:00Z',
    items: [],
  },
  {
    id: 't4',
    name: 'Pauta Antiinflamatoria FODMAP',
    description: 'Fase de eliminación de hidratos de carbono fermentables para sintomatología de disbiosis o colon irritable.',
    targetKcal: 1950,
    tags: ['Salud Intestinal', 'Bajo FODMAP', 'Sin Gluten'],
    version: 1,
    createdAt: '2026-10-10T16:45:00Z',
    items: [],
  },
  {
    id: 't5',
    name: 'Pauta Vegetariana Rendimiento',
    description: 'Combinaciones de legumbres, cereales y frutos secos para aminograma completo en deportistas.',
    targetKcal: 2100,
    tags: ['Vegetariano', 'Alta Proteína'],
    version: 2,
    createdAt: '2026-10-12T11:20:00Z',
    items: [],
  },
];

function getInitialTemplates(): SavedTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
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
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Error guardando plantilla en localStorage:', e);
        }
      }
      return { templates: updated };
    });

    return newTemplate;
  },

  deleteTemplate: (id: string) => {
    set((state) => {
      const updated = state.templates.filter((t) => t.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Error borrando plantilla de localStorage:', e);
        }
      }
      return { templates: updated };
    });
  },

  getTemplateById: (id: string) => {
    return get().templates.find((t) => t.id === id);
  },
}));
