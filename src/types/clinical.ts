import { DietItem, DayCyclingConfig } from '@/types/diet';

export interface DietTemplate {
  id: string;
  name: string;
  description: string;
  kcal?: number;
  targetKcal?: number;
  tags: string[];
  createdAt: string;
  version?: number;
  days?: any[];
  items?: DietItem[];
  dayCyclingConfigs?: Record<number, DayCyclingConfig>;
}

export type { SavedTemplate } from '@/lib/stores/useTemplateStore';
