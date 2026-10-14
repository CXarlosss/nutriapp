import { NextRequest, NextResponse } from 'next/server';
import { evaluatePatientRetentionCron } from '@/lib/services/retentionAnalyticsService';

/**
 * Endpoint de ejecución programada (Cron Job) para prevención de abandono (Churn Prevention)
 * Evalúa pacientes con >= 14 días sin abrir el portal /mi-dieta y encola alertas Outbox para n8n
 *
 * Compatible con:
 * - Vercel Cron Jobs (vercel.json)
 * - n8n Schedule Trigger
 * - GitHub Actions Cron
 * - Petición manual autenticada
 */
export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Validación de seguridad opcional en producción si CRON_SECRET está configurado
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Si estamos en entorno de desarrollo o pruebas locales, permitimos pasar con aviso
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev) {
        return NextResponse.json(
          { error: 'Unauthorized: CRON_SECRET inválido o ausente' },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') === 'true';

    const result = await evaluatePatientRetentionCron(dryRun);

    return NextResponse.json(
      {
        ...result,
        executionMode: dryRun ? 'dry_run_simulation' : 'production_live',
        cronScheduler: 'NutriApp Churn Prevention Engine v1.0',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API Cron Retention Check] Error no controlado:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error interno evaluando retención de pacientes',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
