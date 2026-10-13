/**
 * Test de Verificación: Ciclado Estratégico de Nutrientes (Carb & Calorie Cycling)
 * Ejecución: node scripts/test-nutrient-cycling.mjs
 */

import {
  CYCLING_PRESETS,
  getDefaultDayConfigs,
  evaluateDayCompliance,
} from '../src/lib/clinical/nutrientCyclingEngine.ts';

console.log('════════════════════════════════════════════════════════════════════════');
console.log('🏋️ TEST: MOTOR DE CICLADO ESTRATÉGICO DE NUTRIENTES (CARB CYCLING)');
console.log('════════════════════════════════════════════════════════════════════════\n');

// 1. Presets de Ciclado Disponibles
console.log('1. Verificando Presets de Ciclado Clínico...');
CYCLING_PRESETS.forEach((preset, idx) => {
  console.log(`   [${idx + 1}] Preset "${preset.name}" (${preset.id})`);
  console.log(`       Días de Fuerza/Alta demanda: ${preset.trainingDaysCount} | Días Descanso: ${preset.restDaysCount}`);
  console.log(`       Descripción: ${preset.description}`);
});

// 2. Comprobación de Configuración Semanal Hipertrofia 4:3
console.log('\n────────────────────────────────────────────────────────────────────────');
console.log('2. Evaluando Pauta Semanal Ondulante (Hipertrofia 4:3)...');
const defaultConfigs = getDefaultDayConfigs();

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
for (let d = 1; d <= 7; d++) {
  const conf = defaultConfigs[d];
  console.log(
    `   Día ${d} (${dayNames[d - 1].padEnd(9)}): ${conf.icon || ''} ${conf.label.padEnd(25)} ` +
    `-> ${conf.targetKcal} kcal | P:${conf.targetProteinG}g · C:${conf.targetCarbsG}g · G:${conf.targetFatG}g`
  );
}

// 3. Test de Evaluación de Cumplimiento (Compliance)
console.log('\n────────────────────────────────────────────────────────────────────────');
console.log('3. Evaluando Cumplimiento en Día de Entrenamiento Pesado (Objetivo: 2.250 kcal, 260g Carbos)...');

// Caso A: Dieta adaptada al esfuerzo (2.220 kcal, 255g carbs)
const compliantDay = {
  kcal: 2220,
  protein: 168,
  carbs: 255,
  fat: 58,
  fiber: 30,
  calcium: 950,
  iron: 14,
  omega3: 2.1,
  omega6: 4.5,
};
const resultA = evaluateDayCompliance(compliantDay, defaultConfigs[1]);
console.log(`   ✓ Caso A (Adaptado): Estado = ${resultA.status} | Mensaje: "${resultA.message}"`);
console.log(`     Delta: ${resultA.kcalDiff} kcal | Delta Carbos: ${resultA.carbsDiff}g`);

// Caso B: Dieta insuficiente para día de fuerza (1.680 kcal, 110g carbs)
const deficientDay = {
  kcal: 1680,
  protein: 165,
  carbs: 110,
  fat: 65,
  fiber: 20,
  calcium: 800,
  iron: 10,
  omega3: 1.0,
  omega6: 3.5,
};
const resultB = evaluateDayCompliance(deficientDay, defaultConfigs[1]);
console.log(`   🛑 Caso B (Deficiente en glucógeno): Estado = ${resultB.status} | Mensaje: "${resultB.message}"`);
console.log(`     Delta: ${resultB.kcalDiff} kcal | Delta Carbos: ${resultB.carbsDiff}g`);

// 4. Benchmark de Rendimiento (10.000 evaluaciones de cumplimiento)
console.log('\n────────────────────────────────────────────────────────────────────────');
console.log('4. Ejecutando Benchmark de Rendimiento (10.000 evaluaciones de compliance)...');
const start = performance.now();
for (let i = 0; i < 10000; i++) {
  evaluateDayCompliance(compliantDay, defaultConfigs[(i % 7) + 1]);
}
const elapsed = performance.now() - start;
console.log(`   ✓ 10.000 evaluaciones completadas en: ${elapsed.toFixed(2)} ms`);
console.log(`   ✓ Tiempo medio por evaluación: ${(elapsed / 10000).toFixed(4)} ms`);

console.log('\n════════════════════════════════════════════════════════════════════════');
console.log('✅ TEST DE CICLADO ESTRATÉGICO COMPLETADO CON ÉXITO');
console.log('════════════════════════════════════════════════════════════════════════');
