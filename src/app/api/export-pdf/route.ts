import { NextResponse } from 'next/server';
import { generateDietPdfHtml } from '@/lib/pdf/dietPdfGenerator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientName = searchParams.get('client') || 'Carlos Gómez Pardo';
  const dietName = searchParams.get('diet') || 'Pauta Recomposición V2';

  const sampleData = {
    clientName,
    clientId: searchParams.get('clientId') || 'HC-2026-0042',
    dietName,
    targetKcal: searchParams.get('kcal') ? Number(searchParams.get('kcal')) : 2200,
    dateRange: searchParams.get('dateRange') || '13 oct - 27 oct 2026',
    prescribedBy: searchParams.get('doctor') || 'Dra. Laura Martínez Castillo · Dietista-Nutricionista Clínica',
    doctorColNumber: 'Nº Col. AND-00482 (CODNAN / ISSN Certified)',
    clinicName: 'GABINETE DE NUTRICIÓN CLÍNICA & SALUD METABÓLICA',
    nutritionistPhone: '+34 612 345 678',
    nutritionistEmail: 'laura@nutriapp.es',
    nutritionistWebsite: 'www.nutriapp.es/laura',
    nutritionistAddress: 'Gabinete Presencial (Castellana 45, 3ª) & Videoconsulta',
    clinicalDiagnosis: searchParams.get('diagnosis') || 'Protocolo de Recomposición Corporal, Optimización Lipídica y Flexibilidad Metabólica',
    pharmacotherapyNotes: searchParams.get('pharma') || undefined,
    notes: searchParams.get('notes') || 'Priorizar hidratación (mínimo 2.5L/día) y técnicas culinarias al vapor, papillote o plancha.',
    weeklySchedule: [
      {
        mealSlot: 'Desayuno',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Avena en copos', quantity: 60, unit: 'g', mealPrepNotes: 'Dejar en remojo nocturno con canela Ceylán' },
            { name: 'Yogur griego 0%', quantity: 150, unit: 'g' },
            { name: 'Arándanos silvestres', quantity: 40, unit: 'g' },
          ],
        }),
      },
      {
        mealSlot: 'Media mañana',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Manzana con piel', quantity: 1, unit: 'ud' },
            { name: 'Nueces crudas peladas', quantity: 20, unit: 'g' },
          ],
        }),
      },
      {
        mealSlot: 'Comida',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Pechuga de pollo de corral', quantity: 180, unit: 'g', mealPrepNotes: 'Cocinar en sartén con especias antiinflamatorias (cúrcuma + pimienta)' },
            { name: 'Arroz basmati integral', quantity: 70, unit: 'g' },
            { name: 'Aceite de oliva virgen extra', quantity: 10, unit: 'ml' },
          ],
        }),
      },
      {
        mealSlot: 'Merienda',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Queso fresco batido 0%', quantity: 200, unit: 'g' },
            { name: 'Plátano maduro en rodajas', quantity: 1, unit: 'ud' },
          ],
        }),
      },
      {
        mealSlot: 'Cena',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Salmón fresco al horno', quantity: 150, unit: 'g', mealPrepNotes: 'Al horno 180ºC durante 12-14 min con eneldo y limón' },
            { name: 'Brócoli al vapor', quantity: 200, unit: 'g' },
          ],
        }),
      },
    ],
    dailyAverages: {
      kcal: 2180,
      proteinG: 142,
      carbsG: 220,
      fatG: 68,
    },
  };

  const html = generateDietPdfHtml(sampleData);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
