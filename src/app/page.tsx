import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function ProfilesResult() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at");

  console.log("[prueba de fuego] profiles:", { data, error });

  return (
    <>
      <div className="flex gap-3 text-sm">
        <span className="rounded-full bg-red-500 px-3 py-1 font-medium">Tailwind OK (bg-red-500)</span>
        <span className={`rounded-full px-3 py-1 font-medium ${error ? "bg-amber-600" : "bg-emerald-600"}`}>
          {error ? "Supabase: error" : `Supabase OK · ${data?.length ?? 0} filas`}
        </span>
      </div>
      <pre className="overflow-auto rounded-2xl border border-white/10 bg-white/5 p-6 text-sm backdrop-blur">
        {JSON.stringify(error ?? data, null, 2)}
      </pre>
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100 p-10 font-sans">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Nutri<span className="text-emerald-400">Platform</span>
        </h1>
        <p className="text-slate-400">Bloque 1 · Prueba de conexión con Supabase</p>
        <Suspense fallback={<p className="animate-pulse text-slate-500">Consultando Supabase…</p>}>
          <ProfilesResult />
        </Suspense>

        <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3">
          <a
            href="/dietas/creador"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-950/60"
          >
            Abrir Creador de Dietas (Bloque 2) →
          </a>
          <a
            href="/mi-dieta"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 border border-slate-700"
          >
            Portal Paciente (/mi-dieta · Bloque 3) →
          </a>
          <a
            href="/reservas"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 border border-indigo-500 shadow-lg shadow-indigo-950/60"
          >
            Reservas & GiST (/reservas · Bloque 4) →
          </a>
        </div>
      </div>
    </main>
  );
}
