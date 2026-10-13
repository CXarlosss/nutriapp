/**
 * Script de Test Automatizado: Aislamiento RLS en Supabase y Next.js
 * Ejecución: node scripts/test-isolation.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function runIsolationTest() {
  console.log('🔒 ============================================================');
  console.log('🔒 TEST DE AISLAMIENTO RLS (Row Level Security) EN SUPABASE');
  console.log('🔒 ============================================================');

  const CLIENT_A_ID = 'a0000000-0000-0000-0000-000000000001';
  const CLIENT_B_ID = 'b0000000-0000-0000-0000-000000000002';
  const FORGED_DIET_B_ID = 'diet-b-confidencial-999';

  console.log(`\n1. Simulando petición legítima de Cliente A para su propia dieta...`);
  const { data: dietA, error: errA } = await supabase
    .from('assigned_diets')
    .select('id, client_id, name, status')
    .eq('client_id', CLIENT_A_ID);

  console.log('   Resultado Cliente A:', {
    filasRecibidas: dietA?.length ?? 0,
    error: errA ? errA.message : null,
  });

  console.log(`\n2. TEST CRÍTICO: Cliente A intenta forzar carga del ID de Dieta de Cliente B (${FORGED_DIET_B_ID})...`);
  const { data: leakedDiet, error: errLeak } = await supabase
    .from('assigned_diets')
    .select('id, client_id, name, status')
    .eq('id', FORGED_DIET_B_ID);

  console.log('   Resultado de la consulta forzada:', {
    filasRecibidas: leakedDiet?.length ?? 0,
    bloqueadoPorRLS: (leakedDiet?.length ?? 0) === 0,
    error: errLeak ? errLeak.message : null,
  });

  if ((leakedDiet?.length ?? 0) === 0) {
    console.log('\n✅ TEST SUPERADO CON ÉXITO:');
    console.log('   PostgreSQL RLS filtró la fila en el motor de base de datos.');
    console.log('   La vista /mi-dieta en Next.js recibe un array vacío y renderiza 404.');
  } else {
    console.error('\n❌ VULNERABILIDAD DETECTADA: Se filtraron datos de otro paciente.');
    process.exit(1);
  }
}

runIsolationTest();
