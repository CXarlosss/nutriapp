import { createClient } from '@/lib/supabase/client';
import type {
  BloodTestReport,
  BloodMarkerValue,
  DigestiveSymptomLog,
  PatientMedication,
  DrugNutrientInteractionAlert,
  DietItem,
  MealSlotType,
} from '@/types/diet';

// ─────────────────────────────────────────────────────────────────────────────
// DATOS MOCK DE ALTA FIDELIDAD CLÍNICA (Para Carlos Gómez Pardo - client-1)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BLOOD_TESTS: BloodTestReport[] = [
  {
    id: 'bt-1',
    clientId: 'a0000000-0000-0000-0000-000000000001',
    testDate: '2026-06-15',
    laboratoryName: 'Laboratorio Clínico Sanitas',
    notes: 'Analítica basal pre-temporada de recomposición y fuerza. Detección de ferritina baja y TSH limítrofe.',
    markers: {
      ferritina: {
        value: 28.5,
        unit: 'µg/L',
        minRef: 30,
        maxRef: 300,
        status: 'warning',
        label: 'Ferritina Sérica',
        category: 'hierro',
      },
      hierro_serico: {
        value: 62,
        unit: 'µg/dL',
        minRef: 60,
        maxRef: 170,
        status: 'optimal',
        label: 'Hierro Sérico',
        category: 'hierro',
      },
      vitamina_d: {
        value: 22.4,
        unit: 'ng/mL',
        minRef: 30,
        maxRef: 100,
        status: 'warning',
        label: '25-OH Vitamina D',
        category: 'vitaminas',
      },
      vitamina_b12: {
        value: 380,
        unit: 'pg/mL',
        minRef: 200,
        maxRef: 900,
        status: 'optimal',
        label: 'Vitamina B12',
        category: 'vitaminas',
      },
      hba1c: {
        value: 5.5,
        unit: '%',
        minRef: 4.0,
        maxRef: 5.6,
        status: 'optimal',
        label: 'Hemoglobina Glicosilada (HbA1c)',
        category: 'glucemia',
      },
      glucosa_basal: {
        value: 92,
        unit: 'mg/dL',
        minRef: 70,
        maxRef: 99,
        status: 'optimal',
        label: 'Glucosa en Ayunas',
        category: 'glucemia',
      },
      colesterol_total: {
        value: 218,
        unit: 'mg/dL',
        minRef: 120,
        maxRef: 200,
        status: 'warning',
        label: 'Colesterol Total',
        category: 'lipidos',
      },
      colesterol_ldl: {
        value: 134,
        unit: 'mg/dL',
        minRef: 50,
        maxRef: 100,
        status: 'warning',
        label: 'Colesterol LDL',
        category: 'lipidos',
      },
      colesterol_hdl: {
        value: 52,
        unit: 'mg/dL',
        minRef: 45,
        maxRef: 85,
        status: 'optimal',
        label: 'Colesterol HDL',
        category: 'lipidos',
      },
      trigliceridos: {
        value: 160,
        unit: 'mg/dL',
        minRef: 40,
        maxRef: 150,
        status: 'warning',
        label: 'Triglicéridos',
        category: 'lipidos',
      },
      tsh: {
        value: 4.82,
        unit: 'µIU/mL',
        minRef: 0.4,
        maxRef: 4.0,
        status: 'critical',
        label: 'Tirotropina (TSH)',
        category: 'tiroides',
      },
      t4_libre: {
        value: 0.95,
        unit: 'ng/dL',
        minRef: 0.8,
        maxRef: 1.8,
        status: 'optimal',
        label: 'T4 Libre',
        category: 'tiroides',
      },
      t3_libre: {
        value: 2.6,
        unit: 'pg/mL',
        minRef: 2.3,
        maxRef: 4.2,
        status: 'optimal',
        label: 'T3 Libre',
        category: 'tiroides',
      },
    },
  },
  {
    id: 'bt-2',
    clientId: 'a0000000-0000-0000-0000-000000000001',
    testDate: '2026-09-20',
    laboratoryName: 'Laboratorio Clínico Sanitas',
    notes: 'Control trimestral tras ajuste de levotiroxina a 75 mcg, suplementación de D3 y dieta antiinflamatoria rica en Omega 3.',
    markers: {
      ferritina: {
        value: 54.0,
        unit: 'µg/L',
        minRef: 30,
        maxRef: 300,
        status: 'optimal',
        label: 'Ferritina Sérica',
        category: 'hierro',
      },
      hierro_serico: {
        value: 98,
        unit: 'µg/dL',
        minRef: 60,
        maxRef: 170,
        status: 'optimal',
        label: 'Hierro Sérico',
        category: 'hierro',
      },
      vitamina_d: {
        value: 42.0,
        unit: 'ng/mL',
        minRef: 30,
        maxRef: 100,
        status: 'optimal',
        label: '25-OH Vitamina D',
        category: 'vitaminas',
      },
      vitamina_b12: {
        value: 420,
        unit: 'pg/mL',
        minRef: 200,
        maxRef: 900,
        status: 'optimal',
        label: 'Vitamina B12',
        category: 'vitaminas',
      },
      hba1c: {
        value: 5.2,
        unit: '%',
        minRef: 4.0,
        maxRef: 5.6,
        status: 'optimal',
        label: 'Hemoglobina Glicosilada (HbA1c)',
        category: 'glucemia',
      },
      glucosa_basal: {
        value: 86,
        unit: 'mg/dL',
        minRef: 70,
        maxRef: 99,
        status: 'optimal',
        label: 'Glucosa en Ayunas',
        category: 'glucemia',
      },
      colesterol_total: {
        value: 188,
        unit: 'mg/dL',
        minRef: 120,
        maxRef: 200,
        status: 'optimal',
        label: 'Colesterol Total',
        category: 'lipidos',
      },
      colesterol_ldl: {
        value: 108,
        unit: 'mg/dL',
        minRef: 50,
        maxRef: 100,
        status: 'optimal',
        label: 'Colesterol LDL',
        category: 'lipidos',
      },
      colesterol_hdl: {
        value: 58,
        unit: 'mg/dL',
        minRef: 45,
        maxRef: 85,
        status: 'optimal',
        label: 'Colesterol HDL',
        category: 'lipidos',
      },
      trigliceridos: {
        value: 110,
        unit: 'mg/dL',
        minRef: 40,
        maxRef: 150,
        status: 'optimal',
        label: 'Triglicéridos',
        category: 'lipidos',
      },
      tsh: {
        value: 2.45,
        unit: 'µIU/mL',
        minRef: 0.4,
        maxRef: 4.0,
        status: 'optimal',
        label: 'Tirotropina (TSH)',
        category: 'tiroides',
      },
      t4_libre: {
        value: 1.25,
        unit: 'ng/dL',
        minRef: 0.8,
        maxRef: 1.8,
        status: 'optimal',
        label: 'T4 Libre',
        category: 'tiroides',
      },
      t3_libre: {
        value: 3.1,
        unit: 'pg/mL',
        minRef: 2.3,
        maxRef: 4.2,
        status: 'optimal',
        label: 'T3 Libre',
        category: 'tiroides',
      },
    },
  },
];

export const MOCK_DIGESTIVE_LOGS: DigestiveSymptomLog[] = [
  {
    id: 'symptom-1',
    clientId: 'a0000000-0000-0000-0000-000000000001',
    weekStartDate: '2026-09-28',
    evaluationDate: '2026-10-04',
    bloatingScore: 4,
    refluxScore: 2,
    bristolStoolType: 2, // Heces duras / estreñimiento
    chronicFatigueScore: 3,
    notes: 'Distensión severa por la tarde tras comida con legumbres sin triturar y ensalada cruda. Heces duras tipo 2.',
    correlationTags: ['Legumbres', 'FODMAPs', 'Estreñimiento'],
  },
  {
    id: 'symptom-2',
    clientId: 'a0000000-0000-0000-0000-000000000001',
    weekStartDate: '2026-10-05',
    evaluationDate: '2026-10-11',
    bloatingScore: 1,
    refluxScore: 0,
    bristolStoolType: 4, // Óptimo (forma de salchicha lisa)
    chronicFatigueScore: 1,
    notes: 'Excelente digestión tras cambiar a verduras cocinadas al vapor, avena reposada y separar la toma de levotiroxina.',
    correlationTags: ['Digestión Ligera', 'Tránsito Normal', 'Alta Vitalidad'],
  },
];

export const MOCK_MEDICATIONS: PatientMedication[] = [
  {
    id: 'med-1',
    clientId: 'a0000000-0000-0000-0000-000000000001',
    drugName: 'Levotiroxina',
    activeIngredient: 'Levothyroxine Sodium',
    dosage: '75 mcg',
    timingSlot: 'desayuno',
    indication: 'Hipotiroidismo autoinmune (Tiroiditis de Hashimoto)',
    interactionsNotes: 'Tomar estrictamente en ayunas con agua. No mezclar con soja, salvado de fibra o suplementos de calcio.',
    active: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE RECUPERACIÓN Y PERSISTENCIA (SUPABASE + IN-MEMORY FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientBloodTests(clientId: string): Promise<BloodTestReport[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_blood_tests')
      .select('*')
      .eq('client_id', clientId)
      .order('test_date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        testDate: d.test_date,
        laboratoryName: d.laboratory_name,
        notes: d.notes,
        markers: {
          ferritina: d.ferritina_ug_l ? { value: Number(d.ferritina_ug_l), unit: 'µg/L', minRef: 30, maxRef: 300, status: Number(d.ferritina_ug_l) < 30 ? 'warning' : 'optimal', label: 'Ferritina', category: 'hierro' } : undefined,
          hierro_serico: d.hierro_serico_ug_dl ? { value: Number(d.hierro_serico_ug_dl), unit: 'µg/dL', minRef: 60, maxRef: 170, status: 'optimal', label: 'Hierro Sérico', category: 'hierro' } : undefined,
          vitamina_d: d.vitamina_d_ng_ml ? { value: Number(d.vitamina_d_ng_ml), unit: 'ng/mL', minRef: 30, maxRef: 100, status: Number(d.vitamina_d_ng_ml) < 30 ? 'warning' : 'optimal', label: 'Vitamina D', category: 'vitaminas' } : undefined,
          vitamina_b12: d.vitamina_b12_pg_ml ? { value: Number(d.vitamina_b12_pg_ml), unit: 'pg/mL', minRef: 200, maxRef: 900, status: 'optimal', label: 'Vitamina B12', category: 'vitaminas' } : undefined,
          hba1c: d.hba1c_porcentaje ? { value: Number(d.hba1c_porcentaje), unit: '%', minRef: 4.0, maxRef: 5.6, status: Number(d.hba1c_porcentaje) > 5.6 ? 'warning' : 'optimal', label: 'HbA1c', category: 'glucemia' } : undefined,
          glucosa_basal: d.glucosa_basal_mg_dl ? { value: Number(d.glucosa_basal_mg_dl), unit: 'mg/dL', minRef: 70, maxRef: 99, status: 'optimal', label: 'Glucosa en Ayunas', category: 'glucemia' } : undefined,
          colesterol_total: d.colesterol_total_mg_dl ? { value: Number(d.colesterol_total_mg_dl), unit: 'mg/dL', minRef: 120, maxRef: 200, status: Number(d.colesterol_total_mg_dl) > 200 ? 'warning' : 'optimal', label: 'Colesterol Total', category: 'lipidos' } : undefined,
          colesterol_ldl: d.colesterol_ldl_mg_dl ? { value: Number(d.colesterol_ldl_mg_dl), unit: 'mg/dL', minRef: 50, maxRef: 100, status: Number(d.colesterol_ldl_mg_dl) > 100 ? 'warning' : 'optimal', label: 'Colesterol LDL', category: 'lipidos' } : undefined,
          colesterol_hdl: d.colesterol_hdl_mg_dl ? { value: Number(d.colesterol_hdl_mg_dl), unit: 'mg/dL', minRef: 45, maxRef: 85, status: 'optimal', label: 'Colesterol HDL', category: 'lipidos' } : undefined,
          trigliceridos: d.trigliceridos_mg_dl ? { value: Number(d.trigliceridos_mg_dl), unit: 'mg/dL', minRef: 40, maxRef: 150, status: 'optimal', label: 'Triglicéridos', category: 'lipidos' } : undefined,
          tsh: d.tsh_uiu_ml ? { value: Number(d.tsh_uiu_ml), unit: 'µIU/mL', minRef: 0.4, maxRef: 4.0, status: Number(d.tsh_uiu_ml) > 4.0 ? 'critical' : 'optimal', label: 'TSH', category: 'tiroides' } : undefined,
          t4_libre: d.t4_libre_ng_dl ? { value: Number(d.t4_libre_ng_dl), unit: 'ng/dL', minRef: 0.8, maxRef: 1.8, status: 'optimal', label: 'T4 Libre', category: 'tiroides' } : undefined,
          t3_libre: d.t3_libre_pg_ml ? { value: Number(d.t3_libre_pg_ml), unit: 'pg/mL', minRef: 2.3, maxRef: 4.2, status: 'optimal', label: 'T3 Libre', category: 'tiroides' } : undefined,
        },
      }));
    }
  } catch {
    // Fallback en memoria
  }

  return MOCK_BLOOD_TESTS;
}

export async function getClientDigestiveLogs(clientId: string): Promise<DigestiveSymptomLog[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_digestive_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('evaluation_date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        weekStartDate: d.week_start_date,
        evaluationDate: d.evaluation_date,
        bloatingScore: d.bloating_score,
        refluxScore: d.reflux_score,
        bristolStoolType: d.bristol_stool_type as any,
        chronicFatigueScore: d.chronic_fatigue_score,
        notes: d.notes,
        correlationTags: d.correlation_tags || [],
      }));
    }
  } catch {
    // Fallback en memoria
  }

  return MOCK_DIGESTIVE_LOGS;
}

export async function getClientMedications(clientId: string): Promise<PatientMedication[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_medications')
      .select('*')
      .eq('client_id', clientId)
      .eq('active', true);

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        drugName: d.drug_name,
        activeIngredient: d.active_ingredient,
        dosage: d.dosage,
        timingSlot: d.timing_slot,
        indication: d.indication,
        active: d.active,
      }));
    }
  } catch {
    // Fallback en memoria
  }

  return MOCK_MEDICATIONS;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE AUDITORÍA FÁRMACO-NUTRIENTE (CDSS EN TIEMPO REAL)
// ─────────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Audita una lista de ítems de dieta contra la medicación activa del paciente.
 * Emite alertas clínicas si detecta quelación, interferencia absortiva o antagonismo metabólico.
 */
export function auditDrugNutrientInteractions(
  items: DietItem[],
  medications: PatientMedication[]
): DrugNutrientInteractionAlert[] {
  const alerts: DrugNutrientInteractionAlert[] = [];
  if (!items || items.length === 0 || !medications || medications.length === 0) {
    return alerts;
  }

  for (const med of medications) {
    if (!med.active) continue;
    const drugLower = med.drugName.toLowerCase();

    // 1. REGLA CLÍNICA: LEVOTIROXINA
    if (drugLower.includes('levotiroxina') || drugLower.includes('eutirox')) {
      // El fármaco se administra en ayunas / desayuno
      const targetSlot = med.timingSlot === 'ayunas_manana' ? 'desayuno' : med.timingSlot;

      // Buscar ítems en esa misma franja horaria que bloqueen la absorción
      const conflictItems = items.filter(
        (it) => it.mealSlot === targetSlot
      );

      for (const item of conflictItems) {
        const foodNameLower = (item.foodName || '').toLowerCase();

        // A. Conflicto Crítico: Soja / Tofu (Isoflavonas quelantes de tiroxina)
        if (
          foodNameLower.includes('soja') ||
          foodNameLower.includes('tofu') ||
          foodNameLower.includes('edamame') ||
          foodNameLower.includes('tempeh')
        ) {
          alerts.push({
            id: `alert-levo-soja-${item.id}`,
            drugName: `${med.drugName} (${med.dosage})`,
            conflictingFoodName: item.foodName,
            conflictingSlot: item.mealSlot,
            dayIndex: item.dayIndex,
            dayName: DAY_LABELS[item.dayIndex] || `Día ${item.dayIndex}`,
            severity: 'critical',
            title: `Interacción Crítica: Levotiroxina ↔ ${item.foodName} en ${item.mealSlot}`,
            biologicalMechanism:
              'Las isoflavonas de la soja quelan la hormona T4 en el lumen gastrointestinal, reduciendo su absorción oral hasta un 50% y descompensando la función tiroidea (TSH).',
            clinicalRecommendation:
              `Mover "${item.foodName}" a la merienda o cena. La Sociedad Española de Endocrinología (SEEN) exige un desfase mínimo de 4 horas tras la ingesta de levotiroxina.`,
            doiReference: 'https://doi.org/10.1089/thy.2014.0028',
          });
        }

        // B. Conflicto de Advertencia: Exceso de Fibra Insoluble en el Desayuno (>8g)
        const fiberAmount = item.fiberG || 0;
        if (fiberAmount >= 8.0) {
          alerts.push({
            id: `alert-levo-fiber-${item.id}`,
            drugName: `${med.drugName} (${med.dosage})`,
            conflictingFoodName: item.foodName,
            conflictingSlot: item.mealSlot,
            dayIndex: item.dayIndex,
            dayName: DAY_LABELS[item.dayIndex] || `Día ${item.dayIndex}`,
            severity: 'warning',
            title: `Interferencia Absortiva: Bolo de Fibra (${fiberAmount.toFixed(1)}g) ↔ Levotiroxina`,
            biologicalMechanism:
              'Grandes cantidades de fibra dietética insoluble en la primera toma del día retienen físicamente la molécula de tiroxina, disminuyendo su pico plasmático.',
            clinicalRecommendation:
              `Reducir la porción de fibra a < 6g en el desayuno o espaciar el fármaco 60 minutos antes de consumir "${item.foodName}".`,
            doiReference: 'https://doi.org/10.1210/jc.2007-0098',
          });
        }

        // C. Conflicto de Calcio Concentrado Lácteo (>250mg)
        const calciumAmount = item.calciumMg || 0;
        if (calciumAmount >= 250) {
          alerts.push({
            id: `alert-levo-calcium-${item.id}`,
            drugName: `${med.drugName} (${med.dosage})`,
            conflictingFoodName: item.foodName,
            conflictingSlot: item.mealSlot,
            dayIndex: item.dayIndex,
            dayName: DAY_LABELS[item.dayIndex] || `Día ${item.dayIndex}`,
            severity: 'warning',
            title: `Quelación de Calcio (${calciumAmount}mg) ↔ Levotiroxina en ${item.mealSlot}`,
            biologicalMechanism:
              'El ion calcio (Ca2+) forma quelatos insolubles con la sal sódica de levotiroxina, impidiendo su transporte a través del epitelio yeyunal.',
            clinicalRecommendation:
              `Separar el consumo de lácteos densos o suplementos de calcio al menos 3 a 4 horas de la toma de levotiroxina.`,
            doiReference: 'https://doi.org/10.1001/jama.283.21.2822',
          });
        }
      }
    }

    // 2. REGLA CLÍNICA: ESTATINAS (Atorvastatina / Simvastatina) vs POMELO / TORONJA
    if (drugLower.includes('atorvastatina') || drugLower.includes('simvastatina')) {
      const conflictItems = items.filter((it) => {
        const name = (it.foodName || '').toLowerCase();
        return name.includes('pomelo') || name.includes('toronja');
      });

      for (const item of conflictItems) {
        alerts.push({
          id: `alert-statins-pomelo-${item.id}`,
          drugName: med.drugName,
          conflictingFoodName: item.foodName,
          conflictingSlot: item.mealSlot,
          dayIndex: item.dayIndex,
          dayName: DAY_LABELS[item.dayIndex] || `Día ${item.dayIndex}`,
          severity: 'critical',
          title: `Contraindicación Farmacocinética: Pomelo ↔ ${med.drugName}`,
          biologicalMechanism:
            'Las furanocumarinas del pomelo inhiben irreversiblemente el citocromo intestinal CYP3A4, triplicando la concentración de la estatina en plasma (riesgo de rabdomiólisis).',
          clinicalRecommendation:
            'Eliminar por completo el pomelo de la dieta del paciente y sustituir por cítricos seguros como naranja o mandarina.',
          doiReference: 'https://doi.org/10.1016/j.amjcard.2006.11.026',
        });
      }
    }
  }

  return alerts;
}
