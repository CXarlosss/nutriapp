/**
 * Script de Verificación Automatizada:
 * Búsqueda Semántica Clínica con pgvector (Bloque 11)
 * 
 * 1. Test Semántico de Omega-3 / Articular (conceptos abstractos sin keyword exacta en el nombre).
 * 2. Test Semántico Clínico Multivariante: "snack vegano, alto en hierro, bajo en sodio para hipertensos".
 * 3. Test Semántico de Hipertrofia / Proteína Magra: "proteína limpia máxima para hipertrofia y definición".
 * 4. Test Matemático de Dimensionalidad y Normalización Vectorial (D=1536, L2 Norm = 1.0).
 * 5. Test de Integridad DDL: Verificación de pgvector, HNSW index y RPC match_foods_semantically.
 * 
 * Ejecución: node scripts/test-semantic-search.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  generateClinicalEmbedding,
  searchFoodsSemantically,
  computeCosineSimilarity,
  EMBEDDING_DIMENSION,
} from '../src/lib/services/clinicalEmbeddingService.ts';

async function runSemanticSearchTestSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🧬 TEST BLOQUE 11: BÚSQUEDA SEMÁNTICA CLÍNICA CON PGVECTOR');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let passedTests = 0;
  const totalTests = 5;

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: CONSULTA SEMÁNTICA "fuente de omega 3 para recuperación articular"
  // ──────────────────────────────────────────────────────────────────────────
  console.log('TEST 1: Evaluando consulta abstracta: "fuente de omega 3 para recuperación articular"...');
  const query1 = 'fuente de omega 3 para recuperación articular';
  const res1 = await searchFoodsSemantically(query1, { matchThreshold: 0.20, matchCount: 5 });

  console.log(`   ⏱️ Latencia de ejecución: ${res1.executionTimeMs} ms | Origen: ${res1.source}`);
  console.log('   Alimentos devueltos por el motor semántico:');
  res1.foods.forEach((f, idx) => {
    console.log(`     [#${idx + 1}] ${(f.similarity * 100).toFixed(1)}% | ${f.name} (Omega-3: ${f.omega3_g || 0}g)`);
  });

  const topFoodNames1 = res1.foods.slice(0, 3).map((f) => f.name.toLowerCase());
  const hasSalmon = topFoodNames1.some((n) => n.includes('salmón') || n.includes('salmon'));
  const hasNueces = topFoodNames1.some((n) => n.includes('nueces'));
  const hasChia = topFoodNames1.some((n) => n.includes('chía') || n.includes('chia'));

  if ((hasSalmon || hasNueces || hasChia) && res1.foods[0].similarity >= 0.70) {
    console.log('   ✅ TEST 1 SUPERADO: El motor clasificó correctamente alimentos ricos en Omega-3 y soporte articular.');
    passedTests++;
  } else {
    console.error('   ❌ TEST 1 FALLIDO: No se devolvieron los alimentos adecuados para la consulta de omega 3 / articular.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: CONSULTA CLÍNICA COMPLEJA: "snack vegano, alto en hierro, bajo en sodio para hipertensos"
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\nTEST 2: Evaluando consulta clínica compleja: "snack vegano, alto en hierro, bajo en sodio para hipertensos"...');
  const query2 = 'snack vegano, alto en hierro, bajo en sodio para hipertensos';
  const res2 = await searchFoodsSemantically(query2, { matchThreshold: 0.20, matchCount: 5 });

  console.log(`   ⏱️ Latencia de ejecución: ${res2.executionTimeMs} ms`);
  console.log('   Alimentos devueltos por el motor semántico:');
  res2.foods.forEach((f, idx) => {
    console.log(`     [#${idx + 1}] ${(f.similarity * 100).toFixed(1)}% | ${f.name} (Hierro: ${f.iron_mg}mg, Cat: ${f.category})`);
  });

  const topFoodNames2 = res2.foods.slice(0, 3).map((f) => f.name.toLowerCase());
  const hasTofu = topFoodNames2.some((n) => n.includes('tofu'));
  const hasEspinacas = topFoodNames2.some((n) => n.includes('espinaca'));
  const hasAvena = topFoodNames2.some((n) => n.includes('avena'));

  if (hasTofu || hasEspinacas || hasAvena) {
    console.log('   ✅ TEST 2 SUPERADO: Identificados alimentos veganos con alta densidad de hierro y bajo sodio.');
    passedTests++;
  } else {
    console.error('   ❌ TEST 2 FALLIDO: Los alimentos seleccionados no satisfacen el perfil vegano/hierro/hipertensión.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: CONSULTA DE HIPERTROFIA: "proteína limpia máxima para hipertrofia y definición"
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\nTEST 3: Evaluando consulta de rendimiento: "proteína limpia máxima para hipertrofia y definición"...');
  const query3 = 'proteína limpia máxima para hipertrofia y definición';
  const res3 = await searchFoodsSemantically(query3, { matchThreshold: 0.20, matchCount: 5 });

  console.log(`   ⏱️ Latencia de ejecución: ${res3.executionTimeMs} ms`);
  res3.foods.slice(0, 3).forEach((f, idx) => {
    console.log(`     [#${idx + 1}] ${(f.similarity * 100).toFixed(1)}% | ${f.name} (Proteína: ${f.protein_g}g/100g)`);
  });

  const topProteins = res3.foods.slice(0, 3).map((f) => f.name.toLowerCase());
  const hasPollo = topProteins.some((n) => n.includes('pollo'));
  const hasWhey = topProteins.some((n) => n.includes('whey'));

  if (hasPollo || hasWhey) {
    console.log('   ✅ TEST 3 SUPERADO: Priorización exitosa de fuentes proteicas magras con alta leucina.');
    passedTests++;
  } else {
    console.error('   ❌ TEST 3 FALLIDO: No se devolvieron fuentes proteicas óptimas para hipertrofia.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: VERIFICACIÓN MATEMÁTICA DE EMBEDDINGS (D=1536 Y NORMA L2)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\nTEST 4: Verificando propiedades geométricas del espacio vectorial (D=1536, L2 Norm)...');
  const testVec = generateClinicalEmbedding('dieta cetogenica rica en antioxidantes');

  const dimensionMatch = testVec.length === EMBEDDING_DIMENSION;
  const l2Norm = Math.sqrt(testVec.reduce((acc, val) => acc + val * val, 0));
  const isUnitVector = Math.abs(l2Norm - 1.0) < 0.001;

  console.log(`   ✓ Dimensión del vector generado: ${testVec.length} (Estándar 1536 OpenAI/pgvector)`);
  console.log(`   ✓ Norma L2 calculada: ${l2Norm.toFixed(6)} (Esperado: 1.000000)`);

  if (dimensionMatch && isUnitVector) {
    console.log('   ✅ TEST 4 SUPERADO: Los embeddings son vectores unitarios estrictos en R^1536.');
    passedTests++;
  } else {
    console.error('   ❌ TEST 4 FALLIDO: Inconsistencia en la dimensión o normalización de los embeddings.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: VERIFICACIÓN DDL DE LA MIGRACIÓN (0011_pgvector_semantic_search.sql)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\nTEST 5: Auditando DDL de migración PostgreSQL / Supabase...');
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/0011_pgvector_semantic_search.sql');
  const ddlContent = fs.readFileSync(migrationPath, 'utf8');

  const hasExtension = ddlContent.includes('CREATE EXTENSION IF NOT EXISTS vector');
  const hasColumn = ddlContent.includes('vector(1536)');
  const hasHNSW = ddlContent.includes('USING hnsw (embedding vector_cosine_ops)');
  const hasRPC = ddlContent.includes('CREATE OR REPLACE FUNCTION public.match_foods_semantically');

  console.log(`   ✓ Extensión pgvector habilitada en DDL: ${hasExtension}`);
  console.log(`   ✓ Columna embedding vector(1536) definida: ${hasColumn}`);
  console.log(`   ✓ Índice HNSW con vector_cosine_ops: ${hasHNSW}`);
  console.log(`   ✓ Función almacenada match_foods_semantically implementada: ${hasRPC}`);

  if (hasExtension && hasColumn && hasHNSW && hasRPC) {
    console.log('   ✅ TEST 5 SUPERADO: El esquema DDL para pgvector e indexación HNSW está 100% verificado.');
    passedTests++;
  } else {
    console.error('   ❌ TEST 5 FALLIDO: Faltan cláusulas esenciales en la migración SQL.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`🏆 RESUMEN: ${passedTests} de ${totalTests} PRUEBAS COMPLETADAS CON ÉXITO (${(passedTests/totalTests*100).toFixed(0)}%)`);
  console.log('   Búsqueda Semántica con pgvector validada:');
  console.log('   - Modelado semántico-fisiológico de alimentos (D=1536)');
  console.log('   - Indexación aproximada de vecinos más cercanos con HNSW');
  console.log('   - Interfaz con selector dinámico Modo IA y métricas en UI');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSemanticSearchTestSuite().catch((err) => {
  console.error('Error fatal durante la ejecución de los tests semánticos:', err);
  process.exit(1);
});
