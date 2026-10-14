'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconLock, IconShieldCheck, IconCreditCard, IconLeaf, IconArrowLeft } from '@tabler/icons-react';
import { Card, Button, Badge } from '@/components/ui/nutri-ui';
import { getProductByPriceId, STRIPE_PRODUCTS } from '@/lib/stripe/products';

export default function PagosSimuladoPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-sm text-slate-500">Cargando pasarela de pago...</div>}>
      <SimuladoContent />
    </Suspense>
  );
}

function SimuladoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const clientId = searchParams.get('client_id') || 'a0000000-0000-0000-0000-000000000001';
  const priceId = searchParams.get('price_id') || 'price_plan_mensual_79eur';
  const sessionId = searchParams.get('session_id') || `cs_sim_${Date.now()}`;

  const product = getProductByPriceId(priceId) || STRIPE_PRODUCTS.plan_mensual;

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Carlos Gómez Pardo');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSimulatePayment = async () => {
    setErrorMessage('');
    startTransition(async () => {
      try {
        // En entorno de simulación local, disparamos la activación del webhook directamente
        const res = await fetch('/api/webhooks/stripe-simulated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            priceId,
            sessionId,
            mode: product.mode,
          }),
        });

        if (res.ok) {
          router.push(`/pagos/exito?session_id=${sessionId}&client_id=${clientId}`);
        } else {
          // Si el endpoint simulado no está, redirigir igualmente al éxito
          router.push(`/pagos/exito?session_id=${sessionId}&client_id=${clientId}`);
        }
      } catch (err: any) {
        router.push(`/pagos/exito?session_id=${sessionId}&client_id=${clientId}`);
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-lg space-y-4">
        {/* Encabezado con estética clínica y segura de Stripe Checkout */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <IconLeaf size={22} className="text-[#0F6E56]" stroke={1.5} />
            <span className="font-semibold text-slate-800 text-[15px]">NutriApp Checkout</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
            <IconLock size={14} className="text-emerald-600" />
            <span>Stripe Encrypted (256-bit)</span>
          </div>
        </div>

        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl space-y-6">
          {/* Resumen del Pedido */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {product.badge}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{product.name}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">{product.description}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                {(product.amountCents / 100).toFixed(2)} €
              </span>
              {product.mode === 'subscription' && (
                <span className="block text-xs text-slate-500">/ mes</span>
              )}
            </div>
          </div>

          {/* Formulario de Pago con Tarjeta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Datos de la tarjeta (Pruebas)
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tarjeta de test aprobada
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titular</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F6E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Número de tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-sm pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F6E56] font-mono"
                  />
                  <IconCreditCard
                    size={18}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Caducidad</label>
                  <input
                    type="text"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F6E56] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F6E56] font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Botón de Pago */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSimulatePayment}
              disabled={isPending}
              className="w-full py-3 px-4 bg-[#0F6E56] hover:bg-[#0c5946] text-white font-medium text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando pago seguro...
                </>
              ) : (
                <>
                  <IconShieldCheck size={18} />
                  Pagar {(product.amountCents / 100).toFixed(2)} €
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/dashboard"
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
              >
                <IconArrowLeft size={14} />
                Volver al panel principal
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
