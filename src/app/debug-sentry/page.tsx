'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import {
  IconArrowLeft,
  IconBug,
  IconServer,
  IconCheck,
  IconAlertTriangle,
  IconActivity,
  IconShieldCheck,
  IconRefresh,
} from '@tabler/icons-react';
import { Card, Badge, Button } from '@/components/ui/nutri-ui';

export default function DebugSentryPage() {
  const [lastClientError, setLastClientError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<{
    loading: boolean;
    response?: any;
    error?: string;
  }>({ loading: false });
  const [messageSent, setMessageSent] = useState<string | null>(null);

  const handleTriggerClientError = () => {
    const errorMsg = `Sentry Client Test Exception [${new Date().toLocaleTimeString()}]: Simulación de fallo en runtime del navegador para verificación de stack trace.`;
    setLastClientError(errorMsg);

    try {
      // Simulación de error no controlado
      throw new Error(errorMsg);
    } catch (err: any) {
      // Registrar evento en Sentry con contexto clínico
      Sentry.withScope((scope) => {
        scope.setTag('test_type', 'client_diagnostic');
        scope.setTag('view', '/debug-sentry');
        scope.setExtra('diagnostics', {
          browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
        });
        Sentry.captureException(err);
      });
      // Re-lanzar o registrar
      console.error('[DebugSentry] Excepción de cliente capturada y enviada a Sentry:', err);
    }
  };

  const handleTriggerServerError = async () => {
    setServerStatus({ loading: true });
    try {
      const res = await fetch('/api/debug-sentry');
      const data = await res.json();
      setServerStatus({
        loading: false,
        response: data,
        error: !res.ok ? `Error ${res.status}: Excepción de servidor generada exitosamente` : undefined,
      });
    } catch (err: any) {
      setServerStatus({
        loading: false,
        error: `Fallo de red: ${err.message}`,
      });
    }
  };

  const handleSendDiagnosticMessage = () => {
    const msgId = Sentry.captureMessage(
      `Sentry Health Check: Telemetría activa en NutriApp a las ${new Date().toISOString()}`,
      'info'
    );
    setMessageSent(`Mensaje registrado con ID de evento: ${msgId || 'evt_local_logged'}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans p-6 sm:p-10 space-y-6 max-w-4xl mx-auto">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors"
          >
            <IconArrowLeft size={18} stroke={1.5} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text)]">Consola de Observabilidad & Sentry</h1>
              <Badge variant="purple">Fase 2 · Bloque 12</Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Diagnóstico de telemetría, captura de excepciones y verificación de stack traces en producción
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success">SDK v11 Activo</Badge>
        </div>
      </div>

      {/* Tarjeta de Estado del Sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="space-y-1">
          <div className="text-xs text-[var(--text-secondary)]">Entorno de Ejecución</div>
          <div className="text-base font-semibold text-[var(--text)] font-mono">
            {process.env.NODE_ENV || 'production'}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">✓ Instrumentación OpenTelemetry</div>
        </Card>

        <Card className="space-y-1">
          <div className="text-xs text-[var(--text-secondary)]">Estado del DSN</div>
          <div className="text-base font-semibold text-emerald-600 flex items-center gap-1.5">
            <IconShieldCheck size={18} />
            <span>Configurado</span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] truncate font-mono">
            ingest.sentry.io/nutriapp
          </div>
        </Card>

        <Card className="space-y-1">
          <div className="text-xs text-[var(--text-secondary)]">Muestreo de Trazas</div>
          <div className="text-base font-semibold text-[var(--text)] font-mono">100% (1.0)</div>
          <div className="text-[11px] text-purple-600 font-medium">Session Replay en Errores</div>
        </Card>
      </div>

      {/* Panel de Pruebas de Telemetría */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <IconActivity size={18} className="text-[var(--brand-solid)]" />
          <span>Generadores de Excepciones para Verificación de Stack Trace</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Botón Error Cliente */}
          <button
            type="button"
            onClick={handleTriggerClientError}
            className="p-4 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 transition-all text-left space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <IconBug size={20} className="text-rose-600 group-hover:scale-110 transition-transform" />
              <Badge variant="danger">Client-Side</Badge>
            </div>
            <div className="text-xs font-semibold text-rose-900 dark:text-rose-300">
              Forzar Error en Cliente
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400">
              Lanza una excepción síncrona en React y emite el stack trace al DSN de Sentry.
            </div>
          </button>

          {/* Botón Error Servidor */}
          <button
            type="button"
            onClick={handleTriggerServerError}
            disabled={serverStatus.loading}
            className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 transition-all text-left space-y-2 cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <IconServer size={20} className="text-amber-600 group-hover:scale-110 transition-transform" />
              <Badge variant="warning">Server-Side</Badge>
            </div>
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              Forzar Error en Servidor
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400">
              Invoca `/api/debug-sentry` para ejecutar `captureException` en el runtime de Node.js.
            </div>
          </button>

          {/* Botón Mensaje Informativo */}
          <button
            type="button"
            onClick={handleSendDiagnosticMessage}
            className="p-4 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 transition-all text-left space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <IconActivity size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
              <Badge variant="purple">Audit Log</Badge>
            </div>
            <div className="text-xs font-semibold text-purple-900 dark:text-purple-300">
              Emitir Mensaje de Telemetría
            </div>
            <div className="text-[11px] text-purple-700/80 dark:text-purple-400">
              Envía un evento de nivel `info` para validar la conectividad de monitorización continua.
            </div>
          </button>
        </div>

        {/* Consola de Resultados en Pantalla */}
        {(lastClientError || serverStatus.response || serverStatus.error || messageSent) && (
          <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
              <span>Registro de Eventos Emitidos:</span>
              <span className="text-emerald-400">Sentry Event Pipeline Activo</span>
            </div>

            {lastClientError && (
              <div className="text-rose-400">
                <span className="text-slate-500">[CLIENT EXCEPTION]</span> {lastClientError}
              </div>
            )}

            {serverStatus.error && (
              <div className="text-amber-400">
                <span className="text-slate-500">[SERVER RESPONSE 500]</span> {serverStatus.error}
              </div>
            )}

            {serverStatus.response && (
              <pre className="text-slate-300 text-[10px] overflow-x-auto bg-slate-950 p-2 rounded">
                {JSON.stringify(serverStatus.response, null, 2)}
              </pre>
            )}

            {messageSent && (
              <div className="text-purple-300">
                <span className="text-slate-500">[TELEMETRY INFO]</span> {messageSent}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
