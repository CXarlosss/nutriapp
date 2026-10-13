/**
 * Generador y Exportador de PDF para Dietas Clínicas - NutriApp
 * Especificación Sección 10: Documento A4 horizontal (297 x 210 mm), márgenes 12 mm.
 */

export interface DietPdfData {
  clientName: string;
  dietName: string;
  targetKcal: number;
  dateRange: string;
  notes?: string;
  weeklySchedule: {
    mealSlot: string;
    days: {
      dayName: string;
      items: { name: string; quantity: number; unit: string }[];
    }[];
  }[];
  dailyAverages: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

/**
 * Enfoque técnico:
 * Genera el documento HTML A4 Landscape ultra-optimizado para renderizado vectorial PDF.
 * Permite tanto la descarga directa vía ventana de impresión nativa (window.print())
 * como la conversión server-side vía Chromium headless / @react-pdf/renderer o puppeteer.
 */
export function generateDietPdfHtml(data: DietPdfData): string {
  const daysHeader = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>NutriApp - ${data.dietName} - ${data.clientName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 8pt;
      line-height: 1.35;
      color: #1F1F1D;
      background: #FFFFFF;
      width: 273mm; /* 297mm - 24mm margenes */
      height: 186mm; /* 210mm - 24mm margenes */
      margin: 0 auto;
    }
    /* Cabecera */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 3mm;
      border-bottom: 0.5pt solid #1F1F1D;
      margin-bottom: 3mm;
    }
    .brand {
      font-size: 13pt;
      font-weight: 500;
      color: #0F6E56;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .client-meta {
      text-align: right;
      font-size: 8pt;
      color: #5F5E5A;
    }
    .client-name {
      font-size: 10pt;
      font-weight: 500;
      color: #1F1F1D;
    }
    /* Tabla A4 Horizontal */
    .diet-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      page-break-inside: avoid;
    }
    .diet-table th, .diet-table td {
      border: 0.5pt solid #D3D1C7;
      padding: 2mm 2.5mm;
      vertical-align: top;
    }
    .diet-table th {
      background-color: #F1EFE8;
      font-size: 9pt;
      font-weight: 500;
      text-align: center;
    }
    .diet-table th.col-meal {
      width: 26mm;
      text-align: left;
    }
    .diet-table td.col-meal-label {
      background-color: #FAFAF7;
      font-size: 8.5pt;
      font-weight: 500;
      color: #1F1F1D;
    }
    .item-line {
      margin-bottom: 1.5mm;
      font-size: 7.5pt;
      color: #1F1F1D;
    }
    .item-qty {
      color: #5F5E5A;
      font-size: 7pt;
    }
    /* Pie de página */
    .footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 0.5pt solid #D3D1C7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #5F5E5A;
    }
    .macros-summary {
      font-weight: 500;
      color: #1F1F1D;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span>🌿</span>
      <span>NutriApp</span>
    </div>
    <div class="client-meta">
      <div class="client-name">${data.clientName}</div>
      <div>${data.dietName} · ${data.targetKcal} kcal objetivo · ${data.dateRange}</div>
    </div>
  </div>

  <table class="diet-table">
    <thead>
      <tr>
        <th class="col-meal">Comida</th>
        ${daysHeader.map((d) => `<th>${d}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.weeklySchedule
        .map(
          (slot) => `
        <tr>
          <td class="col-meal-label">${slot.mealSlot}</td>
          ${slot.days
            .map(
              (day) => `
            <td>
              ${
                day.items.length === 0
                  ? '<span style="color:#888780;">—</span>'
                  : day.items
                      .map(
                        (it) => `
                    <div class="item-line">
                      ${it.name} <span class="item-qty">(${it.quantity} ${it.unit})</span>
                    </div>
                  `
                      )
                      .join('')
              }
            </td>
          `
            )
            .join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="macros-summary">
      Promedio diario: ${data.dailyAverages.kcal} kcal · P: ${data.dailyAverages.proteinG}g · C: ${data.dailyAverages.carbsG}g · G: ${data.dailyAverages.fatG}g
      ${data.notes ? ` · Notas: ${data.notes}` : ''}
    </div>
    <div>Página 1 de 1</div>
  </div>

  <script>
    // Auto-trigger para descarga inmediata
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;
}
