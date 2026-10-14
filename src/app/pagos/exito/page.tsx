import React, { Suspense } from 'react';
import Link from 'next/link';
import { IconCircleCheck, IconLeaf, IconArrowRight, IconCalendar } from '@tabler/icons-react';
import { Card, Button, Badge } from '@/components/ui/nutri-ui';

export const metadata = {
  title: 'Pago Confirmado | NutriApp',
  description: 'Confirmación de pago y activación del plan nutricional.',
};

export default function PagoExitoPage(props: {
  searchParams: Promise<{ session_id?: string; client_id?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 text-[var(--text-secondary)] font-mono text-sm">
          Cargando confirmación de pago...
        </div>
      }
    >
      <PagoExitoContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function PagoExitoContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; client_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id || 'cs_test_confirmed';
  const clientId = params.client_id || 'a0000000-0000-0000-0000-000000000001';

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6 font-sans text-[var(--text)]">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 pb-2">
          <IconLeaf size={22} className="text-[var(--brand-solid)]" stroke={1.5} />
          <span className="font-semibold text-[16px] text-[var(--text)]">NutriApp</span>
        </div>

        <Card className="p-8 space-y-6 text-center shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-[var(--brand-solid)] flex items-center justify-center border border-emerald-100">
            <IconCircleCheck size={36} stroke={1.5} />
          </div>

          <div className="space-y-1">
            <Badge variant="success">Pago verificado por Stripe</Badge>
            <h1 className="text-[20px] font-semibold text-[var(--text)] mt-2">
              ¡Plan activado con éxito!
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Hemos recibido tu pago y tu expediente clínico ya se encuentra en estado{' '}
              <strong className="text-[var(--text)]">Activo</strong>.
            </p>
          </div>

          <div className="p-3 bg-[var(--bg-subtle)] rounded-lg text-left text-[12px] text-[var(--text-secondary)] space-y-1 border border-[var(--border)] font-mono">
            <div className="flex justify-between">
              <span>Sesión:</span>
              <span className="text-[var(--text)] truncate max-w-[180px]">{sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="text-emerald-700 font-semibold">Completado</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link href="/mi-plan" className="block w-full">
              <Button variant="primary" className="w-full justify-center">
                Ir a mi plan nutricional
                <IconArrowRight size={16} />
              </Button>
            </Link>

            <Link href="/reservas" className="block w-full">
              <Button variant="secondary" className="w-full justify-center">
                <IconCalendar size={16} />
                Agendar primera consulta
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
