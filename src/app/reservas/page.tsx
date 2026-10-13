import React, { Suspense } from 'react';
import Link from 'next/link';
import { BookingInterface } from '@/components/booking/BookingInterface';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Reservas de Citas | Prevención GiST & Webhook n8n',
  description: 'Sistema de reservas en tiempo real con prevención de solapamientos mediante índices GiST de PostgreSQL e integración n8n.',
};

export default function ReservasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400 font-mono text-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-indigo-500 animate-ping" />
            Cargando motor de agendamiento y disponibilidad...
          </div>
        </div>
      }
    >
      <ReservasContent />
    </Suspense>
  );
}

async function ReservasContent() {
  const supabase = await createClient();

  // Obtener nutricionista principal
  const { data: nutri } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  const nutritionistId = nutri?.id || '171d4ec5-d675-43b7-a89f-a0ee7e2e28e1';
  const nutritionistName = nutri?.full_name || 'Dr. Nutricionista Clínico';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header de Navegación y Título */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              Bloque 4 · Motor de Reservas & GiST
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Agendamiento de Consultas
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Atención con <strong className="text-slate-200">{nutritionistName}</strong> · Control estricto de colisiones en PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              Inicio
            </Link>
            <Link
              href="/mi-dieta"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              Portal Paciente
            </Link>
          </div>
        </div>

        {/* Componente Interactivo de Reserva */}
        <BookingInterface nutritionistId={nutritionistId} />
      </div>
    </div>
  );
}
