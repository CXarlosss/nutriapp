import { NextResponse } from 'next/server';
import {
  CLINIC_VIDA_ID,
  CLINIC_ELITE_ID,
  executeRlsIsolationAudit,
  insertClientForClinic,
  getClientsForClinic,
} from '@/lib/services/multiTenantService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedClinic = searchParams.get('clinic') || 'all';

  if (requestedClinic === 'vida') {
    const auditVida = await executeRlsIsolationAudit(CLINIC_VIDA_ID);
    return NextResponse.json({
      success: true,
      clinic: 'vida',
      audit: auditVida,
    });
  }

  if (requestedClinic === 'elite') {
    const auditElite = await executeRlsIsolationAudit(CLINIC_ELITE_ID);
    return NextResponse.json({
      success: true,
      clinic: 'elite',
      audit: auditElite,
    });
  }

  // Auditoría completa de ambos tenants simultáneamente
  const auditVida = await executeRlsIsolationAudit(CLINIC_VIDA_ID);
  const auditElite = await executeRlsIsolationAudit(CLINIC_ELITE_ID);

  const totalAislado = !auditVida.crossTenantLeakage && !auditElite.crossTenantLeakage;

  return NextResponse.json({
    success: true,
    engine: 'PostgreSQL Row Level Security (RLS)',
    isIsolatedAtEngineLevel: totalAislado,
    tenants: {
      clinicaVida: auditVida,
      centroElite: auditElite,
    },
    verificationSummary: {
      vidaOnlySeesVida: auditVida.visiblePatients.every((p) => p.includes('Gómez') || p.includes('García')),
      eliteOnlySeesElite: auditElite.visiblePatients.every((p) => p.includes('Robles') || p.includes('Santos')),
      zeroCrossLeakage: !auditVida.visiblePatients.some((p) => p.includes('Robles')) &&
                        !auditElite.visiblePatients.some((p) => p.includes('Gómez')),
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { activeClinicId, targetClinicId, fullName, email } = body;

    // Probar inserción con motor de aislamiento
    const result = await insertClientForClinic(
      {
        fullName: fullName || 'Paciente Test',
        email: email || 'test@paciente.local',
        nutritionistId: 'nutri-test',
        clinicId: targetClinicId,
        status: 'active',
      },
      activeClinicId || CLINIC_VIDA_ID
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        blockedByRls: true,
        error: error.message || 'Violación de Row Level Security',
      },
      { status: 403 }
    );
  }
}
