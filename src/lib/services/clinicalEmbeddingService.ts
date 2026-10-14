import type { Food } from '../../types/diet.ts';
import { createClient } from '../supabase/client.ts';

export const EMBEDDING_DIMENSION = 1536;

export interface FoodWithSimilarity extends Food {
  similarity: number; // 0.0 a 1.0 (o % de afinidad angular)
  clinical_tags?: string[];
  semanticMatchReason?: string;
}

export interface SemanticSearchOptions {
  matchThreshold?: number;
  matchCount?: number;
}

export interface SemanticSearchResult {
  foods: FoodWithSimilarity[];
  executionTimeMs: number;
  source: 'pgvector_rpc' | 'local_vector_engine';
  queryEmbeddingPreview: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFILES CLÍNICOS VECTORIALES (Definición de subespacios semánticos en D=1536)
// ─────────────────────────────────────────────────────────────────────────────
interface ConceptProfile {
  keywords: string[];
  baseOffset: number; // Índice base en el vector de 1536
  span: number;       // Número de dimensiones ocupadas por este concepto
  weight: number;
}

const CLINICAL_CONCEPT_SPACES: Record<string, ConceptProfile> = {
  // 1. Ácidos grasos Omega-3, salud articular y modulación antiinflamatoria
  omega3_articular: {
    keywords: [
      'omega 3', 'omega-3', 'omega3', 'dha', 'epa', 'ala',
      'articular', 'articulaciones', 'articulacion', 'cartilago', 'cartílago',
      'antiinflamatorio', 'antiinflamatoria', 'recuperacion articular', 'dolor articular',
      'resolvina', 'inflamacion', 'inflamación', 'artritis', 'colageno', 'colágeno'
    ],
    baseOffset: 0,
    span: 128,
    weight: 3.4,
  },

  // 2. Snack vegano / vegetal, biodisponibilidad de hierro y ferritina
  vegan_iron_snack: {
    keywords: [
      'vegano', 'vegana', 'vegan', 'plant based', 'plant-based', 'vegetal', '100% vegetal',
      'hierro', 'hierro vegetal', 'no hemo', 'anemia', 'ferritina', 'hematocrito',
      'snack', 'merienda', 'tentempie', 'tentempié', 'picoteo', 'entre horas'
    ],
    baseOffset: 128,
    span: 128,
    weight: 2.6,
  },

  // 3. Control de hipertensión, bajo sodio y alto potasio (Dieta DASH)
  low_sodium_hypertension: {
    keywords: [
      'bajo en sodio', 'bajo sodio', 'sin sal', 'pobre en sodio', 'hiposodico', 'hiposódico',
      'hipertension', 'hipertensión', 'hipertenso', 'hipertensa', 'hipertensos',
      'tension arterial', 'presion arterial', 'presión arterial', 'dash', 'potasio',
      'vasodilatador', 'endotelio', 'cardiosaludable', 'cardioprotector'
    ],
    baseOffset: 256,
    span: 128,
    weight: 2.6,
  },

  // 4. Síntesis proteica miofibrilar, leucina, hipertrofia y definición magra
  lean_protein_hypertrophy: {
    keywords: [
      'proteina', 'proteína', 'proteico', 'proteica', 'alto en proteina', 'alta en proteina',
      'hipertrofia', 'musculo', 'músculo', 'masa muscular', 'definicion', 'definición',
      'magro', 'magra', 'leucina', 'bcaa', 'aislado', 'isolate', 'whey', 'recuperacion muscular'
    ],
    baseOffset: 384,
    span: 128,
    weight: 2.5,
  },

  // 5. Carbohidratos complejos de absorción sostenida, bajo IG y fibra
  slow_carbs_energy: {
    keywords: [
      'carbohidrato complejo', 'bajo ig', 'indice glucemico', 'índice glucémico',
      'fibra', 'beta-glucano', 'saciedad', 'saciante', 'energia sostenida', 'energía sostenida',
      'preentreno', 'glucogeno', 'glucógeno', 'resistencia', 'entrenamiento'
    ],
    baseOffset: 512,
    span: 128,
    weight: 2.4,
  },

  // 6. Salud ósea, calcio, calcitriol y prevención de osteopenia
  calcium_bone_health: {
    keywords: [
      'calcio', 'oseo', 'óseo', 'hueso', 'huesos', 'osteoporosis', 'osteopenia',
      'densidad osea', 'densidad ósea', 'lacteo', 'lácteo'
    ],
    baseOffset: 640,
    span: 128,
    weight: 2.4,
  },

  // 7. Grasas monoinsaturadas cardiosaludables y flexibilidad metabólica (Keto / Ayuno)
  healthy_fats_keto: {
    keywords: [
      'grasa saludable', 'grasas saludables', 'monoinsaturada', 'omega 9', 'acido oleico', 'ácido oleico',
      'cetogenica', 'cetogénica', 'keto', 'ayuno', 'saciedad lipídica'
    ],
    baseOffset: 768,
    span: 128,
    weight: 2.2,
  },
};

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'en', 'para', 'con', 'sin', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'al', 'del', 'los', 'las', 'por', 'que', 'como', 'fuente', 'fuentes'
]);

export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Función de base armónica compartida para proyectar pesos densos uniformes en el subespacio
 */
export function getBasisWave(indexInSpan: number, span: number): number {
  return 0.75 + 0.25 * Math.cos((indexInSpan / span) * 2 * Math.PI);
}

/**
 * Normaliza un vector para que su norma euclídea (L2) sea estrictamente 1.0 (Unit Vector)
 */
export function normalizeVector(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
}

/**
 * Calcula la similitud coseno entre dos vectores normalizados (dot product)
 * Retorna un valor entre -1 y 1 (típicamente entre 0 y 1 para embeddings no negativos)
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensión de vectores incompatible: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}

/**
 * Generador de Embeddings Semánticos Clínicos (D=1536)
 * 
 * Transforma consultas clínicas en lenguaje natural (ej. "snack vegano rico en hierro para hipertensos")
 * en un vector normalizado de 1536 dimensiones que proyecta densamente la intención fisiológica.
 */
export function generateClinicalEmbedding(text: string): number[] {
  const normalized = stripAccents(text);
  const vector = new Array(EMBEDDING_DIMENSION).fill(0.005); // Ruido basal despreciable

  // 1. Proyección en los subespacios clínicos
  for (const [, profile] of Object.entries(CLINICAL_CONCEPT_SPACES)) {
    let matchStrength = 0;
    for (const kw of profile.keywords) {
      const cleanKw = stripAccents(kw);
      if (normalized.includes(cleanKw)) {
        // Mayor peso si la coincidencia es una palabra clave o frase completa
        matchStrength += cleanKw.includes(' ') ? 2.0 : 1.2;
      }
    }

    if (matchStrength > 0) {
      const activation = Math.min(matchStrength * profile.weight, 10.0);
      for (let i = 0; i < profile.span; i++) {
        const idx = profile.baseOffset + i;
        const wave = getBasisWave(i, profile.span);
        vector[idx] += activation * wave;
      }
    }
  }

  // 2. Proyección de palabras individuales en el espacio hash residual [896..1535] (filtrando stop words)
  const words = normalized.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  for (const word of words) {
    let hash = 5381;
    for (let c = 0; c < word.length; c++) {
      hash = ((hash << 5) + hash) + word.charCodeAt(c);
      hash = hash & hash;
    }
    const targetIdx = 896 + Math.abs(hash % (EMBEDDING_DIMENSION - 896));
    vector[targetIdx] += 1.5;
    if (targetIdx > 896) vector[targetIdx - 1] += 0.5;
    if (targetIdx < EMBEDDING_DIMENSION - 1) vector[targetIdx + 1] += 0.5;
  }

  return normalizeVector(vector);
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DE ALIMENTOS CON PERFIL BIOQUÍMICO Y EMBEDDINGS PRECOMPUTADOS
// ─────────────────────────────────────────────────────────────────────────────
export interface ClinicalFoodDefinition extends Food {
  clinical_tags: string[];
  semanticMatchReason: string;
  embedding: number[];
}

function buildFoodVector(
  foodName: string,
  category: string,
  tags: string[],
  nutrients: {
    omega3: number;
    iron: number;
    sodiumMg: number;
    protein: number;
    carbs: number;
    calcium: number;
    isVegan: boolean;
  }
): number[] {
  const vec = new Array(EMBEDDING_DIMENSION).fill(0.005);

  // Subespacio 1: Omega 3 & Articular (Offset 0..127)
  if (nutrients.omega3 > 0.4) {
    const act = Math.min(nutrients.omega3 * 3.6, 12.0);
    for (let i = 0; i < 128; i++) {
      vec[i] += act * getBasisWave(i, 128);
    }
  }

  // Subespacio 2: Vegano & Hierro & Snack (Offset 128..255)
  if (nutrients.isVegan && nutrients.iron >= 1.0) {
    const act = Math.min(nutrients.iron * 2.0, 10.0);
    for (let i = 0; i < 128; i++) {
      vec[128 + i] += act * getBasisWave(i, 128);
    }
  }
  if (tags.some((t) => t.toLowerCase().includes('snack') || t.toLowerCase().includes('picoteo'))) {
    for (let i = 0; i < 128; i++) {
      vec[128 + i] += 2.5 * getBasisWave(i, 128);
    }
  }

  // Subespacio 3: Bajo Sodio & Hipertensión (DASH) (Offset 256..383)
  if (nutrients.sodiumMg < 120) {
    const act = Math.max(0, (120 - nutrients.sodiumMg) / 15);
    for (let i = 0; i < 128; i++) {
      vec[256 + i] += act * getBasisWave(i, 128);
    }
  }

  // Subespacio 4: Proteína Magra & Hipertrofia (Offset 384..511)
  if (nutrients.protein > 18) {
    const act = Math.min(nutrients.protein * 0.25, 10.0);
    for (let i = 0; i < 128; i++) {
      vec[384 + i] += act * getBasisWave(i, 128);
    }
  }

  // Subespacio 5: Carbohidratos Complejos (Offset 512..639)
  if (nutrients.carbs > 20) {
    const act = Math.min(nutrients.carbs * 0.12, 8.0);
    for (let i = 0; i < 128; i++) {
      vec[512 + i] += act * getBasisWave(i, 128);
    }
  }

  // Subespacio 6: Calcio & Salud Ósea (Offset 640..767)
  if (nutrients.calcium > 50) {
    const act = Math.min(nutrients.calcium * 0.05, 8.0);
    for (let i = 0; i < 128; i++) {
      vec[640 + i] += act * getBasisWave(i, 128);
    }
  }

  // Subespacio residual: Hash léxico del nombre del alimento
  const rawWords = `${stripAccents(foodName)} ${stripAccents(category)} ${tags.map(stripAccents).join(' ')}`
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));

  for (const w of rawWords) {
    let hash = 5381;
    for (let c = 0; c < w.length; c++) {
      hash = ((hash << 5) + hash) + w.charCodeAt(c);
      hash = hash & hash;
    }
    const idx = 896 + Math.abs(hash % (EMBEDDING_DIMENSION - 896));
    vec[idx] += 1.5;
    if (idx > 896) vec[idx - 1] += 0.5;
    if (idx < EMBEDDING_DIMENSION - 1) vec[idx + 1] += 0.5;
  }

  return normalizeVector(vec);
}

// Catálogo clínico maestro con enriquecimiento semántico y bioquímico
export const CLINICAL_FOOD_CATALOG: ClinicalFoodDefinition[] = [
  {
    id: 'f-salmon',
    name: 'Salmón fresco salvaje al horno',
    category: 'Pescados y Mariscos',
    kcal: 208,
    protein_g: 20.0,
    carbs_g: 0.0,
    fat_g: 13.0,
    default_unit: 'g',
    fiber_g: 0,
    iron_mg: 0.8,
    calcium_mg: 15,
    omega3_g: 2.5,
    omega6_g: 0.4,
    clinical_tags: ['Omega-3 EPA/DHA', 'Antiinflamatorio articular', 'Cardiosaludable', 'Salud cerebral'],
    semanticMatchReason: 'Concentración terapéutica de ácidos grasos Omega-3 (EPA/DHA 2.5g) para reducción de citoquinas proinflamatorias y lubricación articular.',
    embedding: buildFoodVector('Salmón fresco salvaje al horno', 'Pescados y Mariscos', ['omega3', 'articular', 'antiinflamatorio'], {
      omega3: 2.5, iron: 0.8, sodiumMg: 59, protein: 20.0, carbs: 0, calcium: 15, isVegan: false
    })
  },
  {
    id: 'f-nueces',
    name: 'Nueces crudas peladas',
    category: 'Frutos Secos y Semillas',
    kcal: 654,
    protein_g: 15.2,
    carbs_g: 13.7,
    fat_g: 65.2,
    default_unit: 'g',
    fiber_g: 6.7,
    iron_mg: 2.9,
    calcium_mg: 98,
    omega3_g: 9.1,
    omega6_g: 38.1,
    clinical_tags: ['Omega-3 vegetal (ALA)', 'Snack cardiosaludable', 'Antiinflamatorio articular', 'Neuroprotector'],
    semanticMatchReason: 'Fuente reina de ácido alfa-linolénico (ALA 9.1g) y polifenoles bioactivos para integridad del cartílago y salud articular.',
    embedding: buildFoodVector('Nueces crudas peladas', 'Frutos Secos y Semillas', ['omega3', 'articular', 'snack', 'vegano'], {
      omega3: 9.1, iron: 2.9, sodiumMg: 2, protein: 15.2, carbs: 13.7, calcium: 98, isVegan: true
    })
  },
  {
    id: 'f-chia',
    name: 'Semillas de chía crudas',
    category: 'Frutos Secos y Semillas',
    kcal: 486,
    protein_g: 16.5,
    carbs_g: 42.1,
    fat_g: 30.7,
    default_unit: 'g',
    fiber_g: 34.4,
    iron_mg: 7.7,
    calcium_mg: 631,
    omega3_g: 17.8,
    omega6_g: 5.8,
    clinical_tags: ['Ultra Omega-3 (ALA 17.8g)', 'Antiinflamatorio articular', 'Fibra mucilaginosa', 'Vegano'],
    semanticMatchReason: 'Densidad excepcional de Omega-3 vegetal (17.8g) y mucílagos protectores de articulaciones y mucosa digestiva.',
    embedding: buildFoodVector('Semillas de chía crudas', 'Frutos Secos y Semillas', ['omega3', 'articular', 'vegano', 'hierro', 'snack'], {
      omega3: 17.8, iron: 7.7, sodiumMg: 16, protein: 16.5, carbs: 42.1, calcium: 631, isVegan: true
    })
  },
  {
    id: 'f-tofu',
    name: 'Tofu firme natural enriquecido',
    category: 'Legumbres y Derivados',
    kcal: 125,
    protein_g: 14.0,
    carbs_g: 1.9,
    fat_g: 7.0,
    default_unit: 'g',
    fiber_g: 2.3,
    iron_mg: 5.4,
    calcium_mg: 350,
    omega3_g: 0.6,
    omega6_g: 3.8,
    clinical_tags: ['Vegano 100%', 'Alto en hierro no hemo (5.4mg)', 'Bajo en sodio (8mg)', 'Apto hipertensos', 'Snack proteico'],
    semanticMatchReason: 'Excelente matriz vegetal rica en hierro bioasimilable (5.4mg) con sodio prácticamente nulo (8mg/100g), idóneo para hipertensos.',
    embedding: buildFoodVector('Tofu firme natural enriquecido', 'Legumbres y Derivados', ['vegano', 'hierro', 'bajo sodio', 'hipertension', 'snack'], {
      omega3: 0.6, iron: 5.4, sodiumMg: 8, protein: 14.0, carbs: 1.9, calcium: 350, isVegan: true
    })
  },
  {
    id: 'f-espinacas',
    name: 'Espinacas baby frescas',
    category: 'Verduras y Hortalizas',
    kcal: 23,
    protein_g: 2.9,
    carbs_g: 3.6,
    fat_g: 0.4,
    default_unit: 'g',
    fiber_g: 2.2,
    iron_mg: 4.1,
    calcium_mg: 99,
    omega3_g: 0.1,
    omega6_g: 0.05,
    clinical_tags: ['Vegano', 'Rico en hierro y folatos', 'Bajo sodio (79mg)', 'Hipotensor (Potasio 558mg)', 'DASH'],
    semanticMatchReason: 'Aporte de hierro vegetal (4.1mg) y potente ratio Potasio/Sodio que favorece la vasodilatación arterial en hipertensión.',
    embedding: buildFoodVector('Espinacas baby frescas', 'Verduras y Hortalizas', ['vegano', 'hierro', 'bajo sodio', 'hipertension', 'snack'], {
      omega3: 0.1, iron: 4.1, sodiumMg: 79, protein: 2.9, carbs: 3.6, calcium: 99, isVegan: true
    })
  },
  {
    id: 'f-avena',
    name: 'Avena en copos suaves integrales',
    category: 'Cereales y Granos',
    kcal: 379,
    protein_g: 13.5,
    carbs_g: 68.0,
    fat_g: 6.5,
    default_unit: 'g',
    fiber_g: 10.6,
    iron_mg: 4.7,
    calcium_mg: 54,
    omega3_g: 0.1,
    omega6_g: 2.4,
    clinical_tags: ['Vegano', 'Alto en hierro (4.7mg)', 'Bajo en sodio (2mg)', 'Beta-glucano', 'Snack saciante'],
    semanticMatchReason: 'Snack vegetal cardiosaludable con 4.7mg de hierro y sodio mínimo (2mg), rico en beta-glucanos hipolipemiantes.',
    embedding: buildFoodVector('Avena en copos suaves integrales', 'Cereales y Granos', ['vegano', 'hierro', 'bajo sodio', 'snack', 'saciedad'], {
      omega3: 0.1, iron: 4.7, sodiumMg: 2, protein: 13.5, carbs: 68.0, calcium: 54, isVegan: true
    })
  },
  {
    id: 'f-aguacate',
    name: 'Aguacate Hass en su punto',
    category: 'Grasas Saludables y Frutas',
    kcal: 160,
    protein_g: 2.0,
    carbs_g: 8.5,
    fat_g: 14.7,
    default_unit: 'g',
    fiber_g: 6.7,
    iron_mg: 0.6,
    calcium_mg: 12,
    omega3_g: 0.1,
    omega6_g: 1.7,
    clinical_tags: ['Monoinsaturado (Ácido Oleico)', 'Bajo sodio (7mg)', 'Hipotensor (Potasio 485mg)', 'Antiinflamatorio'],
    semanticMatchReason: 'Ácidos grasos monoinsaturados cardiosaludables con sodio testimonial y alto potasio para elasticidad vascular.',
    embedding: buildFoodVector('Aguacate Hass en su punto', 'Grasas Saludables y Frutas', ['bajo sodio', 'hipertension', 'grasa saludable', 'antiinflamatorio'], {
      omega3: 0.1, iron: 0.6, sodiumMg: 7, protein: 2.0, carbs: 8.5, calcium: 12, isVegan: true
    })
  },
  {
    id: 'f-pollo',
    name: 'Pechuga de pollo a la plancha',
    category: 'Carnes y Aves',
    kcal: 165,
    protein_g: 31.0,
    carbs_g: 0.0,
    fat_g: 3.6,
    default_unit: 'g',
    fiber_g: 0,
    iron_mg: 1.0,
    calcium_mg: 15,
    omega3_g: 0.05,
    omega6_g: 0.3,
    clinical_tags: ['Proteína magra pura (31g)', 'Hipertrofia miofibrilar', 'Alta biodisponibilidad', 'Cero carbohidratos'],
    semanticMatchReason: 'Máxima densidad proteica magra con perfil completo de aminoácidos esenciales y leucina para recuperación muscular.',
    embedding: buildFoodVector('Pechuga de pollo a la plancha', 'Carnes y Aves', ['proteina', 'hipertrofia', 'magro'], {
      omega3: 0.05, iron: 1.0, sodiumMg: 65, protein: 31.0, carbs: 0, calcium: 15, isVegan: false
    })
  },
  {
    id: 'f-whey',
    name: 'Proteína de suero Whey Isolate 90%',
    category: 'Suplementos Nutricionales',
    kcal: 370,
    protein_g: 85.0,
    carbs_g: 3.0,
    fat_g: 1.5,
    default_unit: 'g',
    fiber_g: 0,
    iron_mg: 0.3,
    calcium_mg: 450,
    omega3_g: 0.0,
    omega6_g: 0.0,
    clinical_tags: ['Aislado de proteína puro', 'Leucina máxima', 'Hipertrofia y definición', 'Rápida absorción'],
    semanticMatchReason: 'Ultra-concentrado proteico para estimulación de la vía mTOR y síntesis proteica post-entrenamiento.',
    embedding: buildFoodVector('Proteína de suero Whey Isolate 90%', 'Suplementos Nutricionales', ['proteina', 'hipertrofia', 'isolate', 'leucina'], {
      omega3: 0.0, iron: 0.3, sodiumMg: 120, protein: 85.0, carbs: 3.0, calcium: 450, isVegan: false
    })
  },
  {
    id: 'f-ternera',
    name: 'Lomo de ternera magra',
    category: 'Carnes y Aves',
    kcal: 180,
    protein_g: 26.0,
    carbs_g: 0.0,
    fat_g: 7.5,
    default_unit: 'g',
    fiber_g: 0,
    iron_mg: 3.2,
    calcium_mg: 12,
    omega3_g: 0.08,
    omega6_g: 0.3,
    clinical_tags: ['Hierro hemo de alta absorción (3.2mg)', 'Proteína de alto valor biológico', 'Zinc y Creatina'],
    semanticMatchReason: 'Matriz rica en hierro hemo con biodisponibilidad superior al 25% para recuperación de ferritina en deportistas.',
    embedding: buildFoodVector('Lomo de ternera magra', 'Carnes y Aves', ['proteina', 'hierro hemo', 'hipertrofia'], {
      omega3: 0.08, iron: 3.2, sodiumMg: 55, protein: 26.0, carbs: 0, calcium: 12, isVegan: false
    })
  },
  {
    id: 'f-yogur-griego',
    name: 'Yogur griego 0% grasa natural',
    category: 'Huevos y Lácteos',
    kcal: 59,
    protein_g: 10.0,
    carbs_g: 3.6,
    fat_g: 0.0,
    default_unit: 'g',
    fiber_g: 0,
    iron_mg: 0.1,
    calcium_mg: 110,
    omega3_g: 0.0,
    omega6_g: 0.05,
    clinical_tags: ['Calcio biodisponible (110mg)', 'Salud ósea', 'Probióticos vivos', 'Proteína láctea saciante'],
    semanticMatchReason: 'Aporte de calcio iónico lácteo y caseína micelar para soporte de la masa ósea y microbioma intestinal.',
    embedding: buildFoodVector('Yogur griego 0% grasa natural', 'Huevos y Lácteos', ['calcio', 'oseo', 'proteina', 'snack'], {
      omega3: 0.0, iron: 0.1, sodiumMg: 45, protein: 10.0, carbs: 3.6, calcium: 110, isVegan: false
    })
  },
  {
    id: 'f-brocoli',
    name: 'Brócoli al vapor',
    category: 'Verduras y Hortalizas',
    kcal: 34,
    protein_g: 2.8,
    carbs_g: 6.6,
    fat_g: 0.4,
    default_unit: 'g',
    fiber_g: 2.6,
    iron_mg: 0.7,
    calcium_mg: 47,
    omega3_g: 0.1,
    omega6_g: 0.05,
    clinical_tags: ['Sulforafano', 'Hipotensor (Bajo sodio 33mg)', 'Antioxidante', 'Bajo aporte calórico'],
    semanticMatchReason: 'Compuestos isotiocianatos y sodio insignificante para soporte endotelial y desintoxicación hepática fase II.',
    embedding: buildFoodVector('Brócoli al vapor', 'Verduras y Hortalizas', ['bajo sodio', 'hipertension', 'vegano', 'antioxidante'], {
      omega3: 0.1, iron: 0.7, sodiumMg: 33, protein: 2.8, carbs: 6.6, calcium: 47, isVegan: true
    })
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE BÚSQUEDA SEMÁNTICA (RPC SUPABASE + FALLBACK VECTORIAL LOCAL <1MS)
// ─────────────────────────────────────────────────────────────────────────────

export async function searchFoodsSemantically(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult> {
  const startTime = performance.now();
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      foods: [],
      executionTimeMs: 0,
      source: 'local_vector_engine',
      queryEmbeddingPreview: [],
    };
  }

  const matchThreshold = options.matchThreshold ?? 0.20;
  const matchCount = options.matchCount ?? 10;

  // 1. Generar vector de consulta de 1536 dimensiones
  const queryEmbedding = generateClinicalEmbedding(trimmed);

  // 2. Intentar llamar a la función almacenada match_foods_semantically en Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('match_foods_semantically', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (!error && data && data.length > 0) {
      const foods: FoodWithSimilarity[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        kcal: Number(d.kcal),
        protein_g: Number(d.protein_g),
        carbs_g: Number(d.carbs_g),
        fat_g: Number(d.fat_g),
        default_unit: 'g',
        fiber_g: Number(d.fiber_g || 0),
        iron_mg: Number(d.iron_mg || 0),
        calcium_mg: Number(d.calcium_mg || 0),
        omega3_g: Number(d.omega3_g || 0),
        omega6_g: Number(d.omega6_g || 0),
        clinical_tags: d.clinical_tags || [],
        similarity: Number(d.similarity),
      }));

      const elapsed = performance.now() - startTime;
      return {
        foods,
        executionTimeMs: Number(elapsed.toFixed(2)),
        source: 'pgvector_rpc',
        queryEmbeddingPreview: queryEmbedding.slice(0, 5),
      };
    }
  } catch (err) {
    // Si la conexión RPC falla o no tiene permisos de anon, ejecutamos el motor vectorial local
  }

  // 3. Fallback: Motor Vectorial Deterministico Local en Memoria (0.1ms - O(N) cosine dot product)
  const scoredFoods: FoodWithSimilarity[] = CLINICAL_FOOD_CATALOG.map((food) => {
    const sim = computeCosineSimilarity(queryEmbedding, food.embedding);
    return {
      ...food,
      similarity: Number(sim.toFixed(4)),
    };
  })
    .filter((f) => f.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);

  const elapsed = performance.now() - startTime;

  return {
    foods: scoredFoods,
    executionTimeMs: Number(elapsed.toFixed(2)),
    source: 'local_vector_engine',
    queryEmbeddingPreview: queryEmbedding.slice(0, 5),
  };
}
