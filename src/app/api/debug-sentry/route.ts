import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const error = new Error('Sentry Diagnostic Test (Server API): Excepción clínica simulada para verificación de observabilidad en producción');
  
  // Capturar en Sentry explícitamente con contexto clínico adicional
  Sentry.withScope((scope) => {
    scope.setTag('environment', process.env.NODE_ENV || 'production');
    scope.setTag('service', 'nutriapp-clinical-api');
    scope.setExtra('diagnosticsTimestamp', new Date().toISOString());
    scope.setUser({ id: 'nutri-debug-user-01', role: 'nutritionist_admin' });
    Sentry.captureException(error);
  });

  return NextResponse.json(
    {
      success: false,
      errorCaptured: true,
      message: error.message,
      timestamp: new Date().toISOString(),
      sentryEventLogged: true,
    },
    { status: 500 }
  );
}

export async function POST() {
  return GET();
}
