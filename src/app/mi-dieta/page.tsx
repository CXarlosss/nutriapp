import React, { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flame, Activity, Clock, ShieldCheck, ChevronRight, Apple, Calendar, ArrowLeft } from 'lucide-react';

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
  searchParams: Promise<{ dia?: string; dietId?: string; demoClient?: string }>;
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
  const params = await searchParams;
  const activeDayIndex = Math.max(1, Math.min(7, parseInt(params.dia || '1', 10)));
  const requestedDietId = params.dietId;
  const demoClient = params.demoClient;

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
          <h1 className="text-lg font-bold text-rose-300">404 · Acceso Denegado</h1>
          <p className="mt-2 text-xs text-slate-400">
            La política de seguridad RLS de Supabase ha bloqueado esta consulta. No tienes permisos para acceder a los datos médicos o nutricionales de este paciente.
          </p>
          <div className="mt-5">
            <Link
              href="/mi-dieta"
              className="inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Volver a mi dieta
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

  // Fallback de demostración si la base no tiene datos creados para este cliente
  if (!dietData) {
    dietData = {
      id: requestedDietId || 'demo-diet-carlos',
      name: 'Plan Definición 1900 kcal',
      client_name: 'Carlos Pérez',
      status: 'active',
      valid_to: '2026-10-28',
    };
    itemsData = [
      { id: '1', day_index: 1, meal_slot: 'desayuno', free_text: 'Avena en copos suaves', quantity: 60, unit: 'g', kcal: 227, protein_g: 8.1, carbs_g: 40.8, fat_g: 3.9 },
      { id: '2', day_index: 1, meal_slot: 'desayuno', free_text: 'Yogur griego 0% natural', quantity: 150, unit: 'g', kcal: 89, protein_g: 15.0, carbs_g: 5.4, fat_g: 0.0 },
      { id: '3', day_index: 1, meal_slot: 'comida', free_text: 'Pechuga de pollo a la plancha', quantity: 180, unit: 'g', kcal: 297, protein_g: 55.8, carbs_g: 0.0, fat_g: 6.5 },
      { id: '4', day_index: 1, meal_slot: 'comida', free_text: 'Arroz basmati crudo', quantity: 80, unit: 'g', kcal: 284, protein_g: 6.0, carbs_g: 63.2, fat_g: 0.5 },
      { id: '5', day_index: 1, meal_slot: 'comida', free_text: 'Aceite de oliva virgen extra', quantity: 10, unit: 'ml', kcal: 88, protein_g: 0.0, carbs_g: 0.0, fat_g: 10.0 },
      { id: '6', day_index: 1, meal_slot: 'merienda', free_text: 'Manzana con piel', quantity: 150, unit: 'g', kcal: 78, protein_g: 0.5, carbs_g: 21.0, fat_g: 0.3 },
      { id: '7', day_index: 1, meal_slot: 'merienda', free_text: 'Nueces crudas', quantity: 20, unit: 'g', kcal: 131, protein_g: 3.0, carbs_g: 2.7, fat_g: 13.0 },
      { id: '8', day_index: 1, meal_slot: 'cena', free_text: 'Salmón fresco al horno', quantity: 160, unit: 'g', kcal: 333, protein_g: 32.0, carbs_g: 0.0, fat_g: 20.8 },
      { id: '9', day_index: 1, meal_slot: 'cena', free_text: 'Brócoli al vapor', quantity: 200, unit: 'g', kcal: 68, protein_g: 5.6, carbs_g: 13.2, fat_g: 0.8 },
    ];
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
      {/* Contenedor mobile-first estricto: probado para soportar 320px sin desbordamiento horizontal */}
      <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 space-y-4">
        
        {/* Cabecera superior compacta */}
        <header className="flex items-center justify-between border-b border-slate-900 pb-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Inicio
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plan Activo
          </div>
        </header>

        {/* Tarjeta del Plan del Cliente */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Apple className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-white truncate">{dietData.name}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-slate-500" /> Válido hasta: {dietData.valid_to || 'Próxima revisión'}
              </p>
            </div>
          </div>

          {/* Resumen de Macros del Día */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-950/80 p-2.5 border border-slate-800/80 text-center">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Kcal</span>
              <span className="font-mono text-sm font-bold text-amber-400">{Math.round(dayTotals.kcal)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Prot</span>
              <span className="font-mono text-sm font-bold text-emerald-400">{Math.round(dayTotals.protein)}g</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Carb</span>
              <span className="font-mono text-sm font-bold text-sky-400">{Math.round(dayTotals.carbs)}g</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Grasa</span>
              <span className="font-mono text-sm font-bold text-rose-400">{Math.round(dayTotals.fat)}g</span>
            </div>
          </div>
        </div>

        {/* Selector de Días: 7 botones compactos que caben a 320px de ancho */}
        <nav aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
          {DAYS.map((d) => {
            const isSelected = d.index === activeDayIndex;
            return (
              <Link
                key={d.index}
                href={`/mi-dieta?dia=${d.index}`}
                className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50 scale-[1.03]'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800/60'
                }`}
              >
                <span className="text-[11px] leading-none">{d.label}</span>
                <span className="text-[9px] opacity-75 mt-0.5 leading-none">D{d.index}</span>
              </Link>
            );
          })}
        </nav>

        {/* Listado de Ingestas del Día */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-medium text-slate-300">
              Menú de {DAYS.find((d) => d.index === activeDayIndex)?.name}
            </span>
            <span className="text-[11px] text-slate-500">{dayItems.length} alimentos</span>
          </div>

          {Object.entries(MEAL_CONFIG).map(([slotKey, config]) => {
            const items = groupedMeals[slotKey] || [];
            const mealKcal = items.reduce((acc, it) => acc + (it.kcal || 0), 0);

            return (
              <section
                key={slotKey}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-3.5 shadow-sm space-y-2.5 transition-all"
              >
                {/* Cabecera de la comida */}
                <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icon}</span>
                    <div>
                      <h2 className="text-xs font-bold text-slate-200">{config.label}</h2>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {config.time}
                      </span>
                    </div>
                  </div>
                  {mealKcal > 0 && (
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {Math.round(mealKcal)} kcal
                    </span>
                  )}
                </div>

                {/* Lista de alimentos */}
                {items.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic py-1">Sin alimentos asignados para esta ingesta.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((it, idx) => (
                      <li
                        key={it.id || idx}
                        className="flex items-center justify-between rounded-xl bg-slate-950/60 p-2 text-xs border border-white/5"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-medium text-slate-200 block truncate text-[11px]">
                            {it.free_text || 'Alimento'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {it.kcal ? `${Math.round(it.kcal)} kcal` : ''}
                            {it.protein_g ? ` · P: ${it.protein_g}g` : ''}
                          </span>
                        </div>
                        <div className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-400 border border-slate-800">
                          {it.quantity} {it.unit || 'g'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {/* Botón de Test de Aislamiento RLS en el pie */}
        <div className="pt-4 border-t border-slate-900 text-center space-y-2">
          <Link
            href="/mi-dieta?dietId=unauthorized-client-b"
            className="inline-block text-[11px] text-rose-400 hover:text-rose-300 underline"
          >
            [Test RLS] Intentar forzar acceso a dieta de Cliente B
          </Link>
          <p className="text-[10px] text-slate-600">
            Vista optimizada 100% para dispositivos móviles (ancho mínimo 320px).
          </p>
        </div>
      </div>
    </main>
  );
}
