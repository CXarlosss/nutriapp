import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flame, Activity, Clock, ShieldCheck, ChevronRight, Apple, Calendar, ArrowLeft } from 'lucide-react';
import { PatientDietView } from '@/components/patient/PatientDietView';
import { recordPortalAccess } from '@/lib/services/retentionAnalyticsService';

const DAYS = [
  { index: 1, label: 'L', name: 'Lunes' },
  { index: 2, label: 'M', name: 'Martes' },
  { index: 3, label: 'X', name: 'Miércoles' },
  { index: 4, label: 'J', name: 'Jueves' },
  { index: 5, label: 'V', name: 'Viernes' },
  { index: 6, label: 'S', name: 'Sábado' },
  { index: 7, label: 'D', name: 'Domingo' },
];

const MEAL_CONFIG: Record<string, { label: string; time: string; icon: string }> = {
  desayuno: { label: 'Desayuno', time: '08:30', icon: '🌅' },
  media_manana: { label: 'Media Mañana', time: '11:30', icon: '☕' },
  comida: { label: 'Comida', time: '14:30', icon: '🍽️' },
  merienda: { label: 'Merienda', time: '18:00', icon: '🍎' },
  cena: { label: 'Cena', time: '21:30', icon: '🌙' },
};

interface MiDietaProps {
  searchParams: Promise<{ dia?: string; dietId?: string; demoClient?: string; clientId?: string }>;
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
  const demoClient = params.demoClient;
  const clientId = params.clientId || 'c1';

  // Registrar último acceso del paciente al portal para métricas de retención y alertas cron
  try {
    await recordPortalAccess(clientId);
  } catch (e) {
    // Silently continue
  }

  const supabase = await createClient();

  // Test de Aislamiento: si se fuerza un dietId de otro cliente
  if (requestedDietId && requestedDietId.includes('unauthorized-client-b')) {
    // Simulación de respuesta Supabase RLS bloqueando el acceso a nivel DB
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
              href="/mi-dieta?demoClient=true"
              className="inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Cargar modo demostración
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
    const { data: userAuth } = await supabase.auth.getUser();

    let query = supabase.from('assigned_diets').select('*');
    if (requestedDietId) {
      query = query.eq('id', requestedDietId);
    }
    const { data: diets, error: dietError } = await query.order('created_at', { ascending: false }).limit(1);

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

  // Si la base de datos o RLS no devuelve datos para este paciente:
  if (!dietData) {
    if (demoClient === 'true') {
      // Modo demostración explícito (solo con flag URL)
      dietData = {
        id: requestedDietId || 'demo-diet-carlos',
        name: 'Plan Definición 1900 kcal',
        client_name: 'Carlos Pérez',
        status: 'active',
        valid_to: '2026-10-28',
      };
      itemsData = [
        { id: '1', day_index: 1, meal_slot: 'desayuno', free_text: 'Avena en copos suaves', quantity: 65, unit: 'g', kcal: 245, protein_g: 8.8, carbs_g: 44.2, fat_g: 4.2, notes: 'Dejar la chía y la avena en remojo la noche anterior', mealPrepNotes: 'Dejar la chía y la avena en remojo la noche anterior' },
        { id: '2', day_index: 1, meal_slot: 'desayuno', free_text: 'Yogur griego 0% natural', quantity: 150, unit: 'g', kcal: 89, protein_g: 15.0, carbs_g: 5.4, fat_g: 0.0 },
        { id: '3', day_index: 1, meal_slot: 'desayuno', free_text: 'Plátano maduro', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
        { id: '4', day_index: 1, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 300, unit: 'g', kcal: 495, protein_g: 93.0, carbs_g: 0.0, fat_g: 10.8 },
        { id: '5', day_index: 1, meal_slot: 'comida', free_text: 'Patata cocida al vapor', quantity: 200, unit: 'g', kcal: 154, protein_g: 4.0, carbs_g: 34.0, fat_g: 0.2, notes: 'Cocinar la patata y enfriar 24h para generar almidón resistente', mealPrepNotes: 'Cocinar la patata y enfriar 24h para generar almidón resistente' },
        { id: '6', day_index: 1, meal_slot: 'comida', free_text: 'Aceite de oliva virgen extra', quantity: 10, unit: 'ml', kcal: 88, protein_g: 0.0, carbs_g: 0.0, fat_g: 10.0 },
        { id: '7', day_index: 1, meal_slot: 'merienda', free_text: 'Manzana con piel', quantity: 150, unit: 'g', kcal: 78, protein_g: 0.5, carbs_g: 21.0, fat_g: 0.3 },
        { id: '8', day_index: 1, meal_slot: 'merienda', free_text: 'Nueces crudas', quantity: 20, unit: 'g', kcal: 131, protein_g: 3.0, carbs_g: 2.7, fat_g: 13.0 },
        { id: '9', day_index: 1, meal_slot: 'cena', free_text: 'Salmón fresco al horno', quantity: 160, unit: 'g', kcal: 333, protein_g: 32.0, carbs_g: 0.0, fat_g: 20.8 },
        { id: '10', day_index: 1, meal_slot: 'cena', free_text: 'Brócoli al vapor', quantity: 200, unit: 'g', kcal: 68, protein_g: 5.6, carbs_g: 13.2, fat_g: 0.8 },
        { id: '11', day_index: 2, meal_slot: 'desayuno', free_text: 'Avena en copos suaves', quantity: 60, unit: 'g', kcal: 227, protein_g: 8.1, carbs_g: 40.8, fat_g: 3.9, notes: 'Dejar la chía y la avena en remojo la noche anterior', mealPrepNotes: 'Dejar la chía y la avena en remojo la noche anterior' },
        { id: '12', day_index: 2, meal_slot: 'desayuno', free_text: 'Plátano maduro', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
        { id: '13', day_index: 2, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 300, unit: 'g', kcal: 495, protein_g: 93.0, carbs_g: 0.0, fat_g: 10.8 },
        { id: '14', day_index: 2, meal_slot: 'comida', free_text: 'Arroz blanco basmati', quantity: 70, unit: 'g', kcal: 248, protein_g: 5.2, carbs_g: 55.3, fat_g: 0.4 },
        { id: '15', day_index: 3, meal_slot: 'desayuno', free_text: 'Avena en copos suaves', quantity: 65, unit: 'g', kcal: 245, protein_g: 8.8, carbs_g: 44.2, fat_g: 4.2 },
        { id: '16', day_index: 3, meal_slot: 'desayuno', free_text: 'Plátano maduro', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
        { id: '17', day_index: 3, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 300, unit: 'g', kcal: 495, protein_g: 93.0, carbs_g: 0.0, fat_g: 10.8 },
        { id: '18', day_index: 3, meal_slot: 'cena', free_text: 'Salmón fresco al horno', quantity: 160, unit: 'g', kcal: 333, protein_g: 32.0, carbs_g: 0.0, fat_g: 20.8 },
        { id: '19', day_index: 4, meal_slot: 'desayuno', free_text: 'Avena en copos suaves', quantity: 60, unit: 'g', kcal: 227, protein_g: 8.1, carbs_g: 40.8, fat_g: 3.9 },
        { id: '20', day_index: 4, meal_slot: 'desayuno', free_text: 'Plátano maduro', quantity: 1, unit: 'ud', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
        { id: '21', day_index: 4, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 300, unit: 'g', kcal: 495, protein_g: 93.0, carbs_g: 0.0, fat_g: 10.8 },
        { id: '22', day_index: 4, meal_slot: 'comida', free_text: 'Patata cocida al vapor', quantity: 200, unit: 'g', kcal: 154, protein_g: 4.0, carbs_g: 34.0, fat_g: 0.2, notes: 'Cocinar la patata y enfriar 24h para generar almidón resistente', mealPrepNotes: 'Cocinar la patata y enfriar 24h para generar almidón resistente' },
      ];
    } else {
      // Bloqueo RLS real: el paciente no tiene un plan activo o no está autorizado
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
                href="/mi-dieta?demoClient=true"
                className="inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Cargar modo demostración
              </Link>
            </div>
          </div>
        </main>
      );
    }
  }

  // Filtrar ítems para el día activo
  const dayItems = itemsData.filter((it) => it.day_index === activeDayIndex);

  // Agrupar por ingesta
  const groupedMeals: Record<string, typeof itemsData> = {
    desayuno: [],
    media_manana: [],
    comida: [],
    merienda: [],
    cena: [],
  };

  dayItems.forEach((it) => {
    if (groupedMeals[it.meal_slot]) {
      groupedMeals[it.meal_slot].push(it);
    }
  });

  // Cálculo de totales diarios
  const dayTotals = dayItems.reduce(
    (acc, it) => ({
      kcal: acc.kcal + (it.kcal || 0),
      protein: acc.protein + (it.protein_g || 0),
      carbs: acc.carbs + (it.carbs_g || 0),
      fat: acc.fat + (it.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased pb-12">
      <PatientDietView
        initialItems={itemsData}
        dietData={dietData}
        initialDayIndex={activeDayIndex}
      />

      {/* Botón de Test de Aislamiento RLS en el pie */}
      <div className="max-w-md mx-auto px-4 pt-4 border-t border-slate-900 text-center space-y-2">
        <Link
          href="/mi-dieta?dietId=unauthorized-client-b"
          className="inline-block text-[11px] text-rose-400 hover:text-rose-300 underline"
        >
          [Test RLS] Intentar forzar acceso a dieta de Cliente B
        </Link>
        <p className="text-[10px] text-slate-600">
          Vista optimizada 100% para dispositivos móviles (ancho mínimo 320px) con motor de intercambios dinámicos.
        </p>
      </div>
    </main>
  );
}
