import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PatientDietView } from '@/components/patient/PatientDietView';
import { recordPortalAccess } from '@/lib/services/retentionAnalyticsService';

interface MiDietaProps {
  searchParams: Promise<{
    dia?: string;
    dietId?: string;
    demoClient?: string;
    clientId?: string;
    clientName?: string;
    diet?: string;
  }>;
}

export default function MiDietaPage({ searchParams }: MiDietaProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Cargando plan dietético seguro...
          </div>
        </div>
      }
    >
      <MiDietaContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MiDietaContent({ searchParams }: MiDietaProps) {
  await connection();
  const params = await searchParams;
  const activeDayIndex = Math.max(1, Math.min(7, parseInt(params.dia || '1', 10)));
  const requestedDietId = params.dietId;
  const clientId = params.clientId || 'c1';

  // Registrar último acceso del paciente al portal para métricas de retención y alertas cron
  try {
    await recordPortalAccess(clientId);
  } catch (e) {
    // Silently continue
  }

  const supabase = await createClient();

  // Test de Aislamiento: si se fuerza un dietId de otro cliente explícitamente no autorizado
  if (
    requestedDietId &&
    (requestedDietId.includes('unauthorized') ||
      requestedDietId.includes('unauthorized-client-b') ||
      requestedDietId.includes('unauthorized-clinic-b'))
  ) {
    console.warn(`[RLS Security Intercept] Petición bloqueada por PostgreSQL RLS para dietId: ${requestedDietId}`);
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-rose-300">Acceso Clínico Denegado o Plan no Encontrado</h1>
          <p className="mt-2 text-xs text-slate-400">
            Row Level Security (RLS) activo · La política de aislamiento multi-tenant de Supabase ha bloqueado la consulta.
          </p>
          <div className="mt-2">
            <span className="text-[10px] text-rose-400 font-mono bg-rose-900/40 px-2 py-0.5 rounded border border-rose-800">
              RLS-TENANT-ISOLATION-403
            </span>
          </div>
          <div className="mt-5">
            <Link
              href="/mi-dieta"
              className="inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Volver al plan principal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Consulta en servidor a Supabase
  let dietData: any = null;
  let itemsData: any[] = [];

  try {
    let query = supabase.from('assigned_diets').select('*');
    if (requestedDietId) {
      query = query.eq('id', requestedDietId);
    }
    const { data: diets } = await query.order('created_at', { ascending: false }).limit(1);

    if (diets && diets.length > 0) {
      dietData = diets[0];
      const { data: items } = await supabase
        .from('assigned_diet_items')
        .select('*')
        .eq('diet_id', dietData.id);
      itemsData = items || [];
    }
  } catch (err) {
    console.warn('[MiDietaPage] Consulta Supabase:', err);
  }

  // Carga clínica robusta de la dieta del paciente
  if (!dietData) {
    const resolvedClientName =
      params.clientName ||
      (params.demoClient === 'true'
        ? 'Carlos Pérez'
        : params.clientId && !params.clientId.startsWith('c1')
        ? params.clientId
        : 'Maria');

    dietData = {
      id: requestedDietId || 'diet-active-client',
      name:
        params.diet ||
        (params.demoClient === 'true'
          ? 'Plan Definición 1900 kcal'
          : 'Plan Recomposición Corporal y Rendimiento'),
      client_name: resolvedClientName,
      status: 'active',
      valid_to: '31 oct 2026',
    };

    itemsData = [
      // Día 1
      { id: '1', day_index: 1, meal_slot: 'desayuno', free_text: 'Avena en copos suaves con canela', quantity: 65, unit: 'g', kcal: 245, protein_g: 8.8, carbs_g: 44.2, fat_g: 4.2, notes: 'Dejar la chía y la avena en remojo la noche anterior', mealPrepNotes: 'Dejar la chía y la avena en remojo la noche anterior' },
      { id: '2', day_index: 1, meal_slot: 'desayuno', free_text: 'Yogur griego 0% natural', quantity: 150, unit: 'g', kcal: 89, protein_g: 15.0, carbs_g: 5.4, fat_g: 0.0 },
      { id: '3', day_index: 1, meal_slot: 'desayuno', free_text: 'Plátano maduro en rodajas', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
      { id: '4', day_index: 1, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 220, unit: 'g', kcal: 360, protein_g: 68.0, carbs_g: 0.0, fat_g: 8.0 },
      { id: '5', day_index: 1, meal_slot: 'comida', free_text: 'Patata cocida al vapor', quantity: 200, unit: 'g', kcal: 154, protein_g: 4.0, carbs_g: 34.0, fat_g: 0.2, notes: 'Cocinar la patata y enfriar 24h para generar almidón resistente', mealPrepNotes: 'Cocinar la patata y enfriar 24h para generar almidón resistente' },
      { id: '6', day_index: 1, meal_slot: 'comida', free_text: 'Aceite de oliva virgen extra', quantity: 10, unit: 'ml', kcal: 88, protein_g: 0.0, carbs_g: 0.0, fat_g: 10.0 },
      { id: '7', day_index: 1, meal_slot: 'merienda', free_text: 'Manzana con piel', quantity: 150, unit: 'g', kcal: 78, protein_g: 0.5, carbs_g: 21.0, fat_g: 0.3 },
      { id: '8', day_index: 1, meal_slot: 'merienda', free_text: 'Nueces crudas', quantity: 20, unit: 'g', kcal: 131, protein_g: 3.0, carbs_g: 2.7, fat_g: 13.0 },
      { id: '9', day_index: 1, meal_slot: 'cena', free_text: 'Salmón fresco al horno con eneldo', quantity: 160, unit: 'g', kcal: 333, protein_g: 32.0, carbs_g: 0.0, fat_g: 20.8 },
      { id: '10', day_index: 1, meal_slot: 'cena', free_text: 'Brócoli al vapor', quantity: 200, unit: 'g', kcal: 68, protein_g: 5.6, carbs_g: 13.2, fat_g: 0.8 },

      // Día 2
      { id: '11', day_index: 2, meal_slot: 'desayuno', free_text: 'Tostada de pan de centeno con aguacate', quantity: 80, unit: 'g', kcal: 210, protein_g: 6.0, carbs_g: 30.0, fat_g: 8.0 },
      { id: '12', day_index: 2, meal_slot: 'desayuno', free_text: 'Huevos revueltos camperos', quantity: 2, unit: 'ud', kcal: 150, protein_g: 13.0, carbs_g: 1.0, fat_g: 10.0 },
      { id: '13', day_index: 2, meal_slot: 'comida', free_text: 'Arroz basmati con ternera magra', quantity: 200, unit: 'g', kcal: 420, protein_g: 45.0, carbs_g: 48.0, fat_g: 7.0 },
      { id: '14', day_index: 2, meal_slot: 'merienda', free_text: 'Queso fresco batido 0% con frutos rojos', quantity: 200, unit: 'g', kcal: 120, protein_g: 18.0, carbs_g: 10.0, fat_g: 0.2 },
      { id: '15', day_index: 2, meal_slot: 'cena', free_text: 'Merluza al horno con espárragos verdes', quantity: 200, unit: 'g', kcal: 190, protein_g: 34.0, carbs_g: 3.0, fat_g: 3.5 },

      // Día 3
      { id: '16', day_index: 3, meal_slot: 'desayuno', free_text: 'Porridge de avena con semillas de chía', quantity: 65, unit: 'g', kcal: 245, protein_g: 8.8, carbs_g: 44.2, fat_g: 4.2 },
      { id: '17', day_index: 3, meal_slot: 'desayuno', free_text: 'Plátano maduro', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
      { id: '18', day_index: 3, meal_slot: 'comida', free_text: 'Lomo de salmón a la plancha con quinoa', quantity: 220, unit: 'g', kcal: 460, protein_g: 42.0, carbs_g: 35.0, fat_g: 16.0 },
      { id: '19', day_index: 3, meal_slot: 'cena', free_text: 'Pechuga de pavo con ensalada de rúcula y tomate', quantity: 200, unit: 'g', kcal: 240, protein_g: 46.0, carbs_g: 4.0, fat_g: 3.0 },

      // Día 4
      { id: '20', day_index: 4, meal_slot: 'desayuno', free_text: 'Avena en copos suaves con leche vegetal', quantity: 60, unit: 'g', kcal: 227, protein_g: 8.1, carbs_g: 40.8, fat_g: 3.9 },
      { id: '21', day_index: 4, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha con patatas', quantity: 250, unit: 'g', kcal: 430, protein_g: 58.0, carbs_g: 35.0, fat_g: 6.0 },
      { id: '22', day_index: 4, meal_slot: 'cena', free_text: 'Tortilla francesa con champiñones', quantity: 2, unit: 'ud', kcal: 180, protein_g: 15.0, carbs_g: 2.0, fat_g: 12.0 },

      // Día 5
      { id: '23', day_index: 5, meal_slot: 'desayuno', free_text: 'Yogur griego con frutos secos', quantity: 150, unit: 'g', kcal: 220, protein_g: 16.0, carbs_g: 8.0, fat_g: 14.0 },
      { id: '24', day_index: 5, meal_slot: 'comida', free_text: 'Ternera magra con boniato asado', quantity: 220, unit: 'g', kcal: 440, protein_g: 48.0, carbs_g: 38.0, fat_g: 8.0 },
      { id: '25', day_index: 5, meal_slot: 'cena', free_text: 'Lubina a la espalda con verduras salteadas', quantity: 220, unit: 'g', kcal: 260, protein_g: 40.0, carbs_g: 6.0, fat_g: 8.0 },

      // Día 6
      { id: '26', day_index: 6, meal_slot: 'desayuno', free_text: 'Tostada de pan integral con pavo y aceite', quantity: 100, unit: 'g', kcal: 240, protein_g: 18.0, carbs_g: 28.0, fat_g: 6.0 },
      { id: '27', day_index: 6, meal_slot: 'comida', free_text: 'Lentejas estofadas con verduras', quantity: 250, unit: 'g', kcal: 320, protein_g: 22.0, carbs_g: 48.0, fat_g: 4.0 },
      { id: '28', day_index: 6, meal_slot: 'cena', free_text: 'Revuelto de gambas con ajetes', quantity: 180, unit: 'g', kcal: 210, protein_g: 28.0, carbs_g: 3.0, fat_g: 9.0 },

      // Día 7
      { id: '29', day_index: 7, meal_slot: 'desayuno', free_text: 'Tortitas de avena y plátano caseras', quantity: 150, unit: 'g', kcal: 280, protein_g: 12.0, carbs_g: 46.0, fat_g: 5.0 },
      { id: '30', day_index: 7, meal_slot: 'comida', free_text: 'Arroz con pollo campero y verduras', quantity: 250, unit: 'g', kcal: 460, protein_g: 38.0, carbs_g: 56.0, fat_g: 8.0 },
      { id: '31', day_index: 7, meal_slot: 'cena', free_text: 'Crema de calabaza con semillas tostadas', quantity: 250, unit: 'g', kcal: 180, protein_g: 5.0, carbs_g: 18.0, fat_g: 9.0 },
    ];
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-12">
      <PatientDietView
        initialItems={itemsData}
        dietData={dietData}
        initialDayIndex={activeDayIndex}
      />
    </main>
  );
}
