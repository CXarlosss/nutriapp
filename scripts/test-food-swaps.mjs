/**
 * Script de Verificación de Intercambios Dinámicos (Food Swaps) y Equivalencias Matemáticas
 * Ejecución: node scripts/test-food-swaps.mjs
 */

import { calculateFoodSwaps, SWAP_FOOD_CATALOG } from '../src/lib/clinical/foodSwapEngine.ts';

console.log('════════════════════════════════════════════════════════════════════════');
console.log('🔄 TEST: SISTEMA DE INTERCAMBIOS DINÁMICOS Y EQUIVALENCIAS MATEMÁTICAS');
console.log('════════════════════════════════════════════════════════════════════════\n');

// Caso 1: Pechuga de pollo (150g) -> Grupo Proteína Magra (Pivote: Proteína)
console.log('1. Probando intercambio de "Pechuga de pollo a la plancha" (150g)...');
const chickenSwaps = calculateFoodSwaps('Pechuga de pollo a la plancha', 150);

if (!chickenSwaps) {
  console.error('❌ Error: no se generaron alternativas para el pollo');
  process.exit(1);
}

console.log(`   Base: ${chickenSwaps.originalFoodName} (${chickenSwaps.originalQuantity}g)`);
console.log(`   Aporte Base: ${chickenSwaps.originalPivotValue}g de proteína | ${chickenSwaps.originalKcal} kcal`);
console.log(`   Grupo: "${chickenSwaps.exchangeGroup}" | Pivote: "${chickenSwaps.pivotNutrient}"`);
console.log(`   Alternativas encontradas: ${chickenSwaps.alternatives.length}`);

console.log('\n   Alternativas Calculadas Matemáticamente:');
chickenSwaps.alternatives.forEach((alt, idx) => {
  const sign = alt.deltaKcal >= 0 ? `+${alt.deltaKcal}` : `${alt.deltaKcal}`;
  console.log(
    `   [${idx + 1}] ${alt.foodName.padEnd(35)} -> ${String(alt.calculatedGrams).padStart(3)}g ` +
    `| Prot: ${alt.proteinG}g (Δ ${alt.deltaPivot}g) | Kcal: ${alt.kcal} (Δ ${sign} kcal) ` +
    `| Score: ${alt.similarityScore}%`
  );
});

// Comprobar que existe Lomo de cerdo y Tofu
const pork = chickenSwaps.alternatives.find((a) => a.foodName.includes('cerdo'));
const tofu = chickenSwaps.alternatives.find((a) => a.foodName.includes('Tofu'));

if (!pork || !tofu) {
  console.error('❌ Falta Lomo de cerdo o Tofu en las alternativas');
  process.exit(1);
}

console.log('\n   ✓ Validación de Casos Específicos:');
console.log(`     - Lomo de cerdo: ${pork.calculatedGrams}g (${pork.proteinG}g proteína, Δ ${pork.deltaKcal} kcal)`);
console.log(`     - Tofu firme:    ${tofu.calculatedGrams}g (${tofu.proteinG}g proteína, Δ ${tofu.deltaKcal} kcal)`);

// Caso 2: Avena (60g) -> Carbohidratos Complejos (Pivote: Carbohidratos)
console.log('\n────────────────────────────────────────────────────────────────────────');
console.log('2. Probando intercambio de "Avena en copos suaves" (60g)...');
const oatSwaps = calculateFoodSwaps('Avena en copos suaves', 60);

if (!oatSwaps) {
  console.error('❌ Error: no se generaron alternativas para la avena');
  process.exit(1);
}

console.log(`   Base: ${oatSwaps.originalFoodName} (${oatSwaps.originalQuantity}g)`);
console.log(`   Aporte Base: ${oatSwaps.originalPivotValue}g de carbohidratos | ${oatSwaps.originalKcal} kcal`);
oatSwaps.alternatives.slice(0, 4).forEach((alt, idx) => {
  const sign = alt.deltaKcal >= 0 ? `+${alt.deltaKcal}` : `${alt.deltaKcal}`;
  console.log(
    `   [${idx + 1}] ${alt.foodName.padEnd(35)} -> ${String(alt.calculatedGrams).padStart(3)}g ` +
    `| Carbs: ${alt.carbsG}g (Δ ${alt.deltaPivot}g) | Kcal: ${alt.kcal} (Δ ${sign} kcal)`
  );
});

// Benchmark de rendimiento
console.log('\n────────────────────────────────────────────────────────────────────────');
console.log('3. Ejecutando Benchmark de Rendimiento (10.000 cálculos de equivalencia)...');
const start = performance.now();
for (let i = 0; i < 10000; i++) {
  calculateFoodSwaps('Pechuga de pollo a la plancha', 120 + (i % 80));
}
const elapsed = performance.now() - start;
console.log(`   ✓ 10.000 cálculos completados en: ${elapsed.toFixed(2)} ms`);
console.log(`   ✓ Tiempo medio por cálculo: ${(elapsed / 10000).toFixed(4)} ms`);

console.log('\n════════════════════════════════════════════════════════════════════════');
console.log('✅ TEST DE INTERCAMBIOS DINÁMICOS COMPLETADO CON ÉXITO');
console.log('════════════════════════════════════════════════════════════════════════');
