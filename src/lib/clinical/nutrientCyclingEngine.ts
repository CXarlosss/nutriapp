import type { DayDemandType, DayCyclingConfig, CyclingPreset, MacroTotals } from '@/types/diet';

export const DEMAND_CONFIGS: Record<
  DayDemandType,
  { label: string; icon: string; badgeColor: string; description: string }
> = {
  entrenamiento_pesado: {
    label: 'Entrenamiento Pesado',
    icon: '🏋️‍♂️',
    badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
    description: 'High Carb / Normocalórica para repletar glucógeno y sostener la fuerza',
  },
  entrenamiento_moderado: {
    label: 'Entrenamiento Moderado',
    icon: '⚡',
    badgeColor: 'bg-teal-950/80 text-teal-400 border-teal-500/30',
    description: 'Carbos moderados para sesiones estándar de acondicionamiento',
  },
  descanso: {
    label: 'Descanso / Recuperación',
    icon: '🛌',
    badgeColor: 'bg-slate-900 text-slate-400 border-slate-700/60',
    description: 'Low Carb / Mayor densidad lipídica para sensibilidad a la insulina',
  },
  refeed: {
    label: 'Refeed Glucogénico',
    icon: '🔄',
    badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
    description: 'Superávit estratégico en carbohidratos para reactivar leptina y tiroides',
  },
};

export const CYCLING_PRESETS: CyclingPreset[] = [
  {
    id: 'hipertrofia_4_3',
    name: 'Hipertrofia 4:3 (Torso / Pierna)',
    description: '4 días de esfuerzo máximo con altos carbos (2.250 kcal) y 3 días de descanso bajo en carbos (1.700 kcal).',
    trainingDaysCount: 4,
    restDaysCount: 3,
    days: {
      1: {
        demandType: 'entrenamiento_pesado',
        label: 'Pierna (Sentadilla)',
        targetKcal: 2250,
        targetProteinG: 165,
        targetCarbsG: 260,
        targetFatG: 60,
        trainingFocus: 'Sentadilla y femoral',
      },
      2: {
        demandType: 'entrenamiento_pesado',
        label: 'Torso (Press banca)',
        targetKcal: 2250,
        targetProteinG: 165,
        targetCarbsG: 260,
        targetFatG: 60,
        trainingFocus: 'Empuje y pecho',
      },
      3: {
        demandType: 'descanso',
        label: 'Descanso activo',
        targetKcal: 1700,
        targetProteinG: 165,
        targetCarbsG: 120,
        targetFatG: 65,
        trainingFocus: 'Movilidad y caminata',
      },
      4: {
        demandType: 'entrenamiento_pesado',
        label: 'Pierna (Peso muerto)',
        targetKcal: 2250,
        targetProteinG: 165,
        targetCarbsG: 260,
        targetFatG: 60,
        trainingFocus: 'Cadena posterior',
      },
      5: {
        demandType: 'entrenamiento_pesado',
        label: 'Torso (Tracciones)',
        targetKcal: 2250,
        targetProteinG: 165,
        targetCarbsG: 260,
        targetFatG: 60,
        trainingFocus: 'Espalda y bíceps',
      },
      6: {
        demandType: 'descanso',
        label: 'Descanso total',
        targetKcal: 1700,
        targetProteinG: 165,
        targetCarbsG: 120,
        targetFatG: 65,
        trainingFocus: 'Recuperación SNC',
      },
      7: {
        demandType: 'descanso',
        label: 'Descanso total',
        targetKcal: 1700,
        targetProteinG: 165,
        targetCarbsG: 120,
        targetFatG: 65,
        trainingFocus: 'Preparación ciclo',
      },
    },
  },
  {
    id: 'definicion_refeed',
    name: 'Definición con Refeed (5:1:1)',
    description: 'Déficit calórico ondulante entre semana con 1 día de descanso estricto y 1 refeed glucogénico en fin de semana.',
    trainingDaysCount: 4,
    restDaysCount: 3,
    days: {
      1: {
        demandType: 'entrenamiento_moderado',
        label: 'Entreno Fuerza A',
        targetKcal: 1900,
        targetProteinG: 175,
        targetCarbsG: 190,
        targetFatG: 50,
        trainingFocus: 'Pierna fuerza',
      },
      2: {
        demandType: 'entrenamiento_moderado',
        label: 'Entreno Fuerza B',
        targetKcal: 1900,
        targetProteinG: 175,
        targetCarbsG: 190,
        targetFatG: 50,
        trainingFocus: 'Torso fuerza',
      },
      3: {
        demandType: 'descanso',
        label: 'Déficit bajo en carbos',
        targetKcal: 1600,
        targetProteinG: 175,
        targetCarbsG: 100,
        targetFatG: 55,
        trainingFocus: 'Recuperación',
      },
      4: {
        demandType: 'entrenamiento_moderado',
        label: 'Entreno Fuerza C',
        targetKcal: 1900,
        targetProteinG: 175,
        targetCarbsG: 190,
        targetFatG: 50,
        trainingFocus: 'Pierna volumen',
      },
      5: {
        demandType: 'entrenamiento_moderado',
        label: 'Entreno Fuerza D',
        targetKcal: 1900,
        targetProteinG: 175,
        targetCarbsG: 190,
        targetFatG: 50,
        trainingFocus: 'Torso volumen',
      },
      6: {
        demandType: 'descanso',
        label: 'Descanso profundo',
        targetKcal: 1600,
        targetProteinG: 175,
        targetCarbsG: 100,
        targetFatG: 55,
        trainingFocus: 'Descanso',
      },
      7: {
        demandType: 'refeed',
        label: 'Refeed dominical',
        targetKcal: 2450,
        targetProteinG: 155,
        targetCarbsG: 360,
        targetFatG: 40,
        trainingFocus: 'Carga glucógeno',
      },
    },
  },
  {
    id: 'fuerza_3_dias',
    name: 'Fuerza 3 Días (Fullbody Clásico)',
    description: '3 días intensos de cuerpo completo (Lunes, Miércoles, Viernes) y 4 días de descanso/cardio suave.',
    trainingDaysCount: 3,
    restDaysCount: 4,
    days: {
      1: {
        demandType: 'entrenamiento_pesado',
        label: 'Fullbody 1 (Sentadilla/Banca)',
        targetKcal: 2200,
        targetProteinG: 165,
        targetCarbsG: 245,
        targetFatG: 60,
        trainingFocus: 'Fullbody A',
      },
      2: {
        demandType: 'descanso',
        label: 'Descanso',
        targetKcal: 1750,
        targetProteinG: 165,
        targetCarbsG: 130,
        targetFatG: 65,
      },
      3: {
        demandType: 'entrenamiento_pesado',
        label: 'Fullbody 2 (Peso Muerto/Press Militar)',
        targetKcal: 2200,
        targetProteinG: 165,
        targetCarbsG: 245,
        targetFatG: 60,
        trainingFocus: 'Fullbody B',
      },
      4: {
        demandType: 'descanso',
        label: 'Descanso',
        targetKcal: 1750,
        targetProteinG: 165,
        targetCarbsG: 130,
        targetFatG: 65,
      },
      5: {
        demandType: 'entrenamiento_pesado',
        label: 'Fullbody 3 (Sentadilla Frontal/Dominadas)',
        targetKcal: 2200,
        targetProteinG: 165,
        targetCarbsG: 245,
        targetFatG: 60,
        trainingFocus: 'Fullbody C',
      },
      6: {
        demandType: 'descanso',
        label: 'Descanso',
        targetKcal: 1750,
        targetProteinG: 165,
        targetCarbsG: 130,
        targetFatG: 65,
      },
      7: {
        demandType: 'descanso',
        label: 'Descanso',
        targetKcal: 1750,
        targetProteinG: 165,
        targetCarbsG: 130,
        targetFatG: 65,
      },
    },
  },
];

/**
 * Genera la configuración predeterminada de los 7 días (Hipertrofia 4:3 por defecto)
 */
export function getDefaultDayConfigs(): Record<number, DayCyclingConfig> {
  const defaultPreset = CYCLING_PRESETS[0];
  const configs: Record<number, DayCyclingConfig> = {};

  for (let day = 1; day <= 7; day++) {
    const pDay = defaultPreset.days[day];
    configs[day] = {
      dayIndex: day,
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

  return configs;
}

export interface DayComplianceResult {
  kcalDiff: number;
  carbsDiff: number;
  proteinDiff: number;
  fatDiff: number;
  isKcalCompliant: boolean;
  status: 'optimal' | 'warning' | 'alert';
  message: string;
}

/**
 * Evalúa si los nutrientes asignados a un día cumplen con el target de ciclado asignado.
 */
export function evaluateDayCompliance(
  actualTotals: MacroTotals,
  targetConfig: DayCyclingConfig
): DayComplianceResult {
  const kcalDiff = Math.round(actualTotals.kcal - targetConfig.targetKcal);
  const carbsDiff = Math.round(actualTotals.carbs - targetConfig.targetCarbsG);
  const proteinDiff = Math.round(actualTotals.protein - targetConfig.targetProteinG);
  const fatDiff = Math.round(actualTotals.fat - targetConfig.targetFatG);

  const isKcalCompliant = Math.abs(kcalDiff) <= 100;

  if (isKcalCompliant && Math.abs(carbsDiff) <= 25) {
    return {
      kcalDiff,
      carbsDiff,
      proteinDiff,
      fatDiff,
      isKcalCompliant: true,
      status: 'optimal',
      message: `En objetivo para ${targetConfig.label} (±100 kcal)`,
    };
  }

  if (Math.abs(kcalDiff) <= 200) {
    return {
      kcalDiff,
      carbsDiff,
      proteinDiff,
      fatDiff,
      isKcalCompliant: false,
      status: 'warning',
      message: `${kcalDiff > 0 ? `+${kcalDiff}` : `${kcalDiff}`} kcal respecto a ${targetConfig.label}`,
    };
  }

  return {
    kcalDiff,
    carbsDiff,
    proteinDiff,
    fatDiff,
    isKcalCompliant: false,
    status: 'alert',
    message: `Desviación acusada (${kcalDiff > 0 ? `+${kcalDiff}` : `${kcalDiff}`} kcal) frente a objetivo`,
  };
}
