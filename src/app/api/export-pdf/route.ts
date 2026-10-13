import { NextResponse } from 'next/server';
import { generateDietPdfHtml } from '@/lib/pdf/dietPdfGenerator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientName = searchParams.get('client') || 'Carlos Gómez Pardo';
  const dietName = searchParams.get('diet') || 'Pauta Recomposición V2';

  const sampleData = {
    clientName,
    dietName,
    targetKcal: 2200,
    dateRange: '13 oct - 27 oct 2026',
    notes: 'Priorizar hidratación y cocciones al vapor o plancha.',
    weeklySchedule: [
      {
        mealSlot: 'Desayuno',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Avena en copos', quantity: 60, unit: 'g' },
            { name: 'Yogur griego 0%', quantity: 150, unit: 'g' },
          ],
        }),
      },
      {
        mealSlot: 'Media mañana',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Manzana con piel', quantity: 1, unit: 'ud' },
            { name: 'Nueces crudas', quantity: 20, unit: 'g' },
          ],
        }),
      },
      {
        mealSlot: 'Comida',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Pechuga de pollo', quantity: 180, unit: 'g' },
            { name: 'Arroz basmati', quantity: 70, unit: 'g' },
            { name: 'Aceite de oliva virgen', quantity: 10, unit: 'ml' },
          ],
        }),
      },
      {
        mealSlot: 'Merienda',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Queso fresco batido', quantity: 200, unit: 'g' },
            { name: 'Plátano maduro', quantity: 1, unit: 'ud' },
          ],
        }),
      },
      {
        mealSlot: 'Cena',
        days: Array(7).fill({
          dayName: 'Día',
          items: [
            { name: 'Salmón al horno', quantity: 150, unit: 'g' },
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
