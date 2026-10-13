'use client';

import React, { useState, useTransition } from 'react';
import { bookAppointmentAction, BookingResult } from '@/app/actions/bookingActions';

interface Slot {
  time: string; // ej: "10:00"
  durationMinutes: number;
}

const AVAILABLE_SLOTS: Slot[] = [
  { time: '09:00', durationMinutes: 45 },
  { time: '10:00', durationMinutes: 45 },
  { time: '11:00', durationMinutes: 45 },
  { time: '12:00', durationMinutes: 45 },
  { time: '13:00', durationMinutes: 45 },
  { time: '16:00', durationMinutes: 45 },
  { time: '17:00', durationMinutes: 45 },
  { time: '18:00', durationMinutes: 45 },
];

export function BookingInterface({ nutritionistId }: { nutritionistId: string }) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [clientName, setClientName] = useState('Carlos Gomez');
  const [clientEmail, setClientEmail] = useState('carlos.paciente@example.com');
  const [clientPhone, setClientPhone] = useState('+34 600 11 22 33');
  const [notes, setNotes] = useState('Consulta de seguimiento y revisión calórica');

  const [isPending, startTransition] = useTransition();
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const handleBooking = () => {
    setBookingResult(null);

    const startsAt = new Date(`${selectedDate}T${selectedSlot}:00Z`).toISOString();
    // 45 minutos después
    const endDateObj = new Date(new Date(`${selectedDate}T${selectedSlot}:00Z`).getTime() + 45 * 60 * 1000);
    const endsAt = endDateObj.toISOString();

    startTransition(async () => {
      const result = await bookAppointmentAction({
        nutritionistId,
        clientName,
        clientEmail,
        clientPhone,
        startsAt,
        endsAt,
        notes,
      });
      setBookingResult(result);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Selector de Fecha y Horas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        {/* Columna Izquierda: Fecha y Horarios */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Selecciona Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              2. Franjas Horarias Disponibles (45 min)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {AVAILABLE_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{slot.time}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-normal">
                      45m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Datos del Paciente */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            3. Datos de la Cita
          </label>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Ej: Laura Martínez"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email de Contacto</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="paciente@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Teléfono Móvil</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo / Notas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Indica cualquier detalle para la consulta..."
            />
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleBooking}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 mt-4 ${
              isPending
                ? 'bg-indigo-700/50 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Validando restricción GiST & Guardando...</span>
              </>
            ) : (
              <span>Confirmar Reserva de Cita</span>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Resultado */}
      {bookingResult && (
        <div className="transition-all animate-fadeIn">
          {bookingResult.success ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 text-emerald-200 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="font-bold text-emerald-300 text-lg">
                  ✅ Reserva Confirmada con Éxito (Sin Solapamiento)
                </h4>
              </div>
              <p className="text-sm text-emerald-200/90 leading-relaxed">
                PostgreSQL ha verificado mediante el índice GiST que la franja horaria estaba 100% libre. Se
                ha registrado la cita con ID <code className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-100 font-mono text-xs">{bookingResult.appointment?.id}</code> y se ha disparado el Webhook hacia n8n.
              </p>

              {bookingResult.webhookPayload && (
                <div className="mt-4">
                  <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 mb-2">
                    Payload Capturado por Webhook n8n:
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60">
                    {JSON.stringify(bookingResult.webhookPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-950/50 border border-rose-500/70 rounded-2xl p-6 text-rose-200 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div>
                  <h4 className="font-bold text-rose-200 text-lg">
                    🛑 Bloqueo por Colisión GiST (PostgreSQL Exclusion Violation)
                  </h4>
                  <div className="text-xs text-rose-300 font-mono mt-0.5">
                    SQLSTATE: <strong>{bookingResult.pgCode || '23P01'}</strong>
                  </div>
                </div>
              </div>

              <p className="text-sm text-rose-200/90 leading-relaxed">
                {bookingResult.message || 'La franja horaria seleccionada ya colisiona con otra cita programada.'}
              </p>

              {bookingResult.pgMessage && (
                <div className="bg-slate-950 border border-rose-900/50 rounded-xl p-3 font-mono text-xs text-rose-300 space-y-1">
                  <div><strong>Mensaje de BD:</strong> {bookingResult.pgMessage}</div>
                  {bookingResult.pgDetails && <div><strong>Detalles:</strong> {bookingResult.pgDetails}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
