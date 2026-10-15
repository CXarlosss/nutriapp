'use client';

import React, { useState } from 'react';
import {
  IconX,
  IconCheck,
  IconCoins,
  IconBuildingBank,
  IconDeviceMobile,
  IconShieldCheck,
  IconReceipt,
  IconSparkles,
} from '@tabler/icons-react';
import { Button, Badge } from '@/components/ui/nutri-ui';
import { recordManualPaymentAction } from '@/app/actions/manualPaymentActions';
import { useModeStore, PaymentMethod, RealClient } from '@/lib/stores/useModeStore';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: RealClient;
  onSuccess?: (message: string) => void;
}

export const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { recordClientPayment } = useModeStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bizum');
  const [amountEur, setAmountEur] = useState<number>(79);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [79, 59, 35];

  const handleSelectAmount = (amt: number) => {
    setIsCustomAmount(false);
    setAmountEur(amt);
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmountEur(parsed);
    }
  };

  const stripeCommissionSaved = ((amountEur * 0.015) + 0.25).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalAmount = isCustomAmount ? parseFloat(customAmount) || 79 : amountEur;

    try {
      // 1. Ejecutar Server Action para persistir en Supabase y Outbox
      const result = await recordManualPaymentAction({
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        paymentMethod: selectedMethod,
        amountEur: finalAmount,
        periodDays,
        notes: notes || undefined,
      });

      if (!result.success) {
        setError(result.error || 'No se pudo registrar el cobro');
        setLoading(false);
        return;
      }

      // 2. Actualizar estado local en Zustand para reflejo instantáneo en UI
      recordClientPayment(client.id, {
        method: selectedMethod,
        amountEur: finalAmount,
        periodDays,
        notes: notes || undefined,
      });

      setLoading(false);
      onClose();

      if (onSuccess) {
        onSuccess(result.message || `¡Cobro de ${finalAmount}€ registrado con éxito! Paciente activado.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al registrar el cobro');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IconCoins size={22} stroke={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-[600] text-[var(--text)]">
                  Registrar Cobro Manual
                </h2>
                <Badge variant="success">0% Comisión</Badge>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                {client.name} · Plan {client.plan}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[13px]">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] text-[12px] border border-[var(--danger-text)]/30">
              {error}
            </div>
          )}

          {/* 1. Selección de Método de Pago */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Método de Pago Recibido
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Bizum */}
              <button
                type="button"
                onClick={() => setSelectedMethod('bizum')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedMethod === 'bizum'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/30'
                    : 'border-[var(--border)] hover:bg-[var(--card-subtle)] text-[var(--text)]'
                }`}
              >
                <IconDeviceMobile size={22} className={selectedMethod === 'bizum' ? 'text-emerald-500' : 'text-[var(--text-secondary)]'} />
                <span className="text-[12px]">Bizum</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Inmediato</span>
              </button>

              {/* Efectivo */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/30'
                    : 'border-[var(--border)] hover:bg-[var(--card-subtle)] text-[var(--text)]'
                }`}
              >
                <IconCoins size={22} className={selectedMethod === 'cash' ? 'text-emerald-500' : 'text-[var(--text-secondary)]'} />
                <span className="text-[12px]">Efectivo</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">En consulta</span>
              </button>

              {/* Transferencia */}
              <button
                type="button"
                onClick={() => setSelectedMethod('transfer')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedMethod === 'transfer'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/30'
                    : 'border-[var(--border)] hover:bg-[var(--card-subtle)] text-[var(--text)]'
                }`}
              >
                <IconBuildingBank size={22} className={selectedMethod === 'transfer' ? 'text-emerald-500' : 'text-[var(--text-secondary)]'} />
                <span className="text-[12px]">Transferencia</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">SEPA / Banco</span>
              </button>
            </div>
          </div>

          {/* 2. Importe */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Importe Cobrado
            </label>
            <div className="flex items-center gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectAmount(amt)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[13px] font-mono tabular-nums transition-all cursor-pointer ${
                    !isCustomAmount && amountEur === amt
                      ? 'border-[var(--brand-solid)] bg-[var(--brand-bg)] text-[var(--brand-solid)] font-bold'
                      : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--card-subtle)]'
                  }`}
                >
                  {amt} €
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomAmount(true)}
                className={`py-1.5 px-3 rounded-lg border text-[12px] transition-all cursor-pointer ${
                  isCustomAmount
                    ? 'border-[var(--brand-solid)] bg-[var(--brand-bg)] text-[var(--brand-solid)] font-bold'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card-subtle)]'
                }`}
              >
                Otro
              </button>
            </div>
            {isCustomAmount && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="Ej: 45"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  autoFocus
                  className="w-full bg-[var(--card-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[14px] font-mono text-[var(--text)] outline-none focus:border-[var(--brand-solid)]"
                />
                <span className="font-mono text-[14px] text-[var(--text-secondary)] font-semibold">€</span>
              </div>
            )}
          </div>

          {/* 3. Periodo de Renovación */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Periodo de Activación / Renovación
            </label>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <button
                type="button"
                onClick={() => setPeriodDays(30)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  periodDays === 30
                    ? 'border-[var(--brand-solid)] bg-[var(--brand-bg)] text-[var(--brand-solid)] font-semibold'
                    : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--card-subtle)]'
                }`}
              >
                <div className="font-medium">30 días</div>
                <div className="text-[10px] text-[var(--text-muted)]">Mes completo</div>
              </button>

              <button
                type="button"
                onClick={() => setPeriodDays(15)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  periodDays === 15
                    ? 'border-[var(--brand-solid)] bg-[var(--brand-bg)] text-[var(--brand-solid)] font-semibold'
                    : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--card-subtle)]'
                }`}
              >
                <div className="font-medium">15 días</div>
                <div className="text-[10px] text-[var(--text-muted)]">Quincenal</div>
              </button>

              <button
                type="button"
                onClick={() => setPeriodDays(7)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  periodDays === 7
                    ? 'border-[var(--brand-solid)] bg-[var(--brand-bg)] text-[var(--brand-solid)] font-semibold'
                    : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--card-subtle)]'
                }`}
              >
                <div className="font-medium">7 días</div>
                <div className="text-[10px] text-[var(--text-muted)]">Semanal / Bono</div>
              </button>
            </div>
          </div>

          {/* 4. Notas opcionales */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Notas del Cobro (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Entregado en mano en consulta de las 11:30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--card-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--brand-solid)]"
            />
          </div>

          {/* Tarjeta de Ahorro y Ventaja de Negocio */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            <IconSparkles size={18} className="text-emerald-500 shrink-0" />
            <span>
              <strong>¡100% de margen directo!</strong> Al cobrar por este método te ahorras <strong>~{stripeCommissionSaved}€</strong> de comisiones de Stripe y el paciente queda activado al momento.
            </span>
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              {loading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <IconCheck size={16} />
                  <span>Confirmar Cobro ({amountEur} €)</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
