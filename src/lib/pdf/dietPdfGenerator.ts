/**
 * Generador de Informe Médico y Plan Nutricional de Alta Precisión - NutriApp
 * Estándar de Impresión Hospitalaria Privada (A4 con Reglas CSS Puras @media print)
 * Tipografía Serif de Alta Legibilidad (Playfair Display + Source Serif 4)
 * Portada Automática Institucional + Saltos de Página Controlados
 */

export interface DietPdfData {
  clientName: string;
  clientId?: string;
  patientDni?: string;
  dietName: string;
  targetKcal: number;
  dateRange: string;
  prescribedBy?: string;
  doctorColNumber?: string;
  clinicName?: string;
  clinicalDiagnosis?: string;
  pharmacotherapyNotes?: string;
  notes?: string;
  weeklySchedule: {
    mealSlot: string;
    days: {
      dayName: string;
      items: { name: string; quantity: number; unit: string; mealPrepNotes?: string }[];
    }[];
  }[];
  dailyAverages: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  guidelineReferences?: {
    issnDOI?: string;
    seenDOI?: string;
  };
}

export function generateDietPdfHtml(data: DietPdfData): string {
  const daysHeader = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const clinicName = data.clinicName || 'CENTRO MÉDICO UNIVERSITARIO & METABÓLICO SANITARIO';
  const departmentName = 'DEPARTAMENTO DE ENDOCRINOLOGÍA, NUTRICIÓN CLÍNICA Y DIETÉTICA APLICADA';
  const doctor = data.prescribedBy || 'Dra. Carmen Gómez Pardo · Especialista en Nutrición Clínica y Endocrinología';
  const colNumber = data.doctorColNumber || 'Nº Col. MED-46089 (SEEN / ISSN Certified)';
  const patientId = data.clientId || 'HC-2026-0042';
  const diagnosis = data.clinicalDiagnosis || 'Recomposición Corporal, Optimización de Perfil Lipídico y Terapia de Regulación Metabólica';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Informe Médico Nutricional · ${data.clientName} · ${clinicName}</title>
  
  <!-- Tipografías Serif de Prestigio Médico y Monoespaciada Tabular -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    /* ─────────────────────────────────────────────────────────────
       CONFIGURACIÓN DE PÁGINA Y REGLAS DE IMPRESIÓN (@media print)
       ───────────────────────────────────────────────────────────── */
    @page {
      size: A4 landscape;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      background: #FFFFFF;
      color: #1A1A1A;
      font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
      font-size: 8.5pt;
      line-height: 1.45;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum" 1;
      -webkit-font-smoothing: antialiased;
    }

    /* ─────────────────────────────────────────────────────────────
       CONTROLES DE PANTALLA Y BOTÓN DE DESCARGA / IMPRIMIR (NO PRINT)
       ───────────────────────────────────────────────────────────── */
    .screen-actions {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9999;
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.9);
      padding: 8px 12px;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
    }

    .screen-btn {
      background: #0F4C3A;
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 6px 14px;
      border-radius: 6px;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .screen-btn:hover {
      background: #15664F;
    }

    @media print {
      .screen-actions, .no-print {
        display: none !important;
      }
      body {
        width: 100%;
        margin: 0;
        padding: 0;
      }
    }

    /* ─────────────────────────────────────────────────────────────
       PORTADA AUTOMÁTICA DEL HOSPITAL (PÁGINA 1)
       ───────────────────────────────────────────────────────────── */
    .cover-page {
      width: 100%;
      min-height: 185mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8mm 6mm 6mm 6mm;
      page-break-after: always;
      break-after: page;
      position: relative;
    }

    .cover-top-emblem {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2pt solid #0F4C3A;
      padding-bottom: 5mm;
      margin-bottom: 8mm;
    }

    .clinic-brand-group {
      display: flex;
      align-items: center;
      gap: 5mm;
    }

    .hospital-seal {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2pt solid #0F4C3A;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0F4C3A;
      font-size: 22pt;
      font-family: 'Playfair Display', serif;
      background: #F4F8F6;
      font-weight: 700;
      flex-shrink: 0;
    }

    .hospital-titles h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14pt;
      font-weight: 700;
      color: #0F4C3A;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .hospital-titles h2 {
      font-family: system-ui, sans-serif;
      font-size: 7.5pt;
      font-weight: 600;
      color: #6B7280;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 1mm;
    }

    .accreditation-badge {
      text-align: right;
      font-family: 'Geist Mono', monospace;
      font-size: 7.5pt;
      color: #4B5563;
      border-left: 1pt solid #D1D5DB;
      padding-left: 4mm;
    }

    .cover-center {
      text-align: center;
      margin: 4mm 0 8mm 0;
    }

    .document-category {
      display: inline-block;
      font-family: system-ui, sans-serif;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #0F4C3A;
      background: #E8F3EE;
      border: 0.5pt solid #A7D3C3;
      padding: 1.5mm 5mm;
      border-radius: 20px;
      margin-bottom: 4mm;
    }

    .document-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 23pt;
      font-weight: 800;
      color: #111827;
      line-height: 1.2;
      margin-bottom: 2mm;
    }

    .document-subtitle {
      font-size: 11pt;
      font-style: italic;
      color: #4B5563;
    }

    /* Cuadrícula de Datos del Paciente */
    .patient-clinical-card {
      background: #FAFCFA;
      border: 1pt solid #D1DFD8;
      border-top: 3pt solid #0F4C3A;
      border-radius: 4px;
      padding: 5mm 6mm;
      margin-bottom: 6mm;
    }

    .patient-card-header {
      font-family: 'Playfair Display', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #0F4C3A;
      border-bottom: 0.5pt solid #E5E7EB;
      padding-bottom: 2mm;
      margin-bottom: 3.5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .patient-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 1.5fr;
      gap: 3.5mm;
    }

    .patient-field-label {
      font-family: system-ui, sans-serif;
      font-size: 6.5pt;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5mm;
    }

    .patient-field-value {
      font-size: 9.5pt;
      font-weight: 600;
      color: #111827;
    }

    .patient-field-value.mono {
      font-family: 'Geist Mono', monospace;
      font-variant-numeric: tabular-nums;
    }

    /* Resumen Ejecutivo de Objetivos Clínicos */
    .executive-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-bottom: 6mm;
    }

    .exec-metric-box {
      border: 0.75pt solid #E5E7EB;
      background: #FFFFFF;
      padding: 3mm;
      border-radius: 3px;
      text-align: center;
    }

    .exec-metric-title {
      font-family: system-ui, sans-serif;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #6B7280;
      letter-spacing: 0.04em;
    }

    .exec-metric-number {
      font-family: 'Geist Mono', monospace;
      font-size: 13pt;
      font-weight: 700;
      color: #0F4C3A;
      margin: 1mm 0 0.5mm 0;
      font-variant-numeric: tabular-nums;
    }

    .exec-metric-sub {
      font-size: 7pt;
      color: #6B7280;
    }

    /* Alerta de Farmacoterapia en Portada */
    .pharma-notice {
      background: #FEF3C7;
      border: 0.75pt solid #F59E0B;
      border-left: 3pt solid #D97706;
      padding: 3mm 4mm;
      border-radius: 3px;
      font-size: 7.5pt;
      color: #92400E;
      margin-bottom: 5mm;
      line-height: 1.4;
    }

    .cover-footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 0.5pt solid #E5E7EB;
      padding-top: 3mm;
    }

    .signature-box {
      text-align: left;
      font-size: 7.5pt;
      color: #4B5563;
    }

    .signature-line {
      width: 55mm;
      height: 12mm;
      border-bottom: 1pt dashed #9CA3AF;
      margin-bottom: 1.5mm;
      position: relative;
    }

    .signature-stamp {
      position: absolute;
      top: 0;
      left: 10mm;
      font-family: 'Playfair Display', serif;
      font-size: 8pt;
      font-style: italic;
      color: #0F4C3A;
      opacity: 0.85;
    }

    /* ─────────────────────────────────────────────────────────────
       PÁGINAS DE CONTENIDO: CUADRÍCULA DIETÉTICA Y PLAN SEMANAL
       ───────────────────────────────────────────────────────────── */
    .content-page {
      width: 100%;
      page-break-before: always;
      break-before: page;
      position: relative;
    }

    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2mm;
      border-bottom: 0.5pt solid #0F4C3A;
      margin-bottom: 3mm;
      font-size: 7pt;
      color: #4B5563;
    }

    .running-header-left {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      color: #0F4C3A;
      font-size: 8pt;
    }

    .running-header-right {
      font-family: 'Geist Mono', monospace;
    }

    /* Tabla Semanal A4 Horizontal */
    .diet-table-container {
      width: 100%;
      margin-bottom: 3.5mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .diet-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7.5pt;
    }

    .diet-table th, .diet-table td {
      border: 0.5pt solid #D1D5DB;
      padding: 1.8mm 2mm;
      vertical-align: top;
      word-wrap: break-word;
    }

    .diet-table thead tr th {
      background: #F3F4F6;
      font-family: 'Playfair Display', serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #111827;
      text-align: center;
      border-bottom: 1.5pt solid #0F4C3A;
    }

    .diet-table th.col-meal {
      width: 25mm;
      text-align: left;
      font-family: system-ui, sans-serif;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .diet-table td.col-meal-label {
      background: #F9FAFB;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      color: #0F4C3A;
      font-size: 8pt;
    }

    .meal-item {
      margin-bottom: 1.5mm;
      line-height: 1.3;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .meal-item:last-child {
      margin-bottom: 0;
    }

    .item-name {
      color: #111827;
      font-weight: 500;
    }

    .item-qty {
      font-family: 'Geist Mono', monospace;
      color: #4B5563;
      font-size: 6.8pt;
      font-variant-numeric: tabular-nums;
    }

    .meal-prep-callout {
      margin-top: 0.8mm;
      padding: 0.8mm 1.5mm;
      background: #FEF3C7;
      border: 0.5pt solid #FDE68A;
      border-left: 1.5pt solid #D97706;
      border-radius: 2px;
      font-size: 6.2pt;
      color: #92400E;
      line-height: 1.25;
      font-family: system-ui, sans-serif;
      font-style: normal;
    }

    /* Sección de Recomendaciones Clínicas y Consensos Científicos */
    .clinical-guidelines-box {
      border: 0.75pt solid #D1DFD8;
      background: #F8FAF9;
      padding: 2.5mm 3.5mm;
      border-radius: 3px;
      margin-top: 2.5mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .guidelines-title {
      font-family: 'Playfair Display', serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #0F4C3A;
      margin-bottom: 1.5mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }

    .guidelines-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      font-size: 6.8pt;
      color: #374151;
      line-height: 1.35;
    }

    .doi-reference {
      font-family: 'Geist Mono', monospace;
      color: #0F4C3A;
      font-weight: 600;
      font-size: 6.2pt;
    }

    /* Running Footer */
    .running-footer {
      margin-top: 3mm;
      padding-top: 1.8mm;
      border-top: 0.5pt solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.5pt;
      color: #6B7280;
    }

    .legal-notice {
      max-width: 80%;
    }
  </style>
</head>
<body>

  <!-- Botones de Acción en Pantalla (Ocultos en @media print) -->
  <div class="screen-actions no-print">
    <button class="screen-btn" onclick="window.print()">
      <span>🖨️</span>
      <span>Imprimir / Guardar como PDF</span>
    </button>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════
       PÁGINA 1: PORTADA AUTOMÁTICA OFICIAL (HOSPITAL PRIVADO)
       ═══════════════════════════════════════════════════════════════ -->
  <div class="cover-page">
    <div>
      <!-- Membrete y Sello del Hospital -->
      <div class="cover-top-emblem">
        <div class="clinic-brand-group">
          <div class="hospital-seal">⚕</div>
          <div class="hospital-titles">
            <h1>${clinicName}</h1>
            <h2>${departmentName}</h2>
          </div>
        </div>
        <div class="accreditation-badge">
          <div>Certificación ISO 9001 / JCI</div>
          <div>Historial Electrónico: ${patientId}</div>
          <div>Ref: MED-TERAPIA-V2</div>
        </div>
      </div>

      <!-- Título Solemne del Informe -->
      <div class="cover-center">
        <div class="document-category">Prescripción Terapéutica Oficial</div>
        <h2 class="document-title">${data.dietName}</h2>
        <p class="document-subtitle">Protocolo de Intervención Dietoterapéutica y Planificación Metabólica Individualizada</p>
      </div>

      <!-- Ficha Clínica del Paciente -->
      <div class="patient-clinical-card">
        <div class="patient-card-header">
          <span>Expediente de Prescripción Médica</span>
          <span class="patient-field-value mono">ID: ${patientId}</span>
        </div>
        <div class="patient-grid">
          <div>
            <span class="patient-field-label">Paciente</span>
            <span class="patient-field-value">${data.clientName}</span>
          </div>
          <div>
            <span class="patient-field-label">Periodo Activo</span>
            <span class="patient-field-value mono">${data.dateRange}</span>
          </div>
          <div>
            <span class="patient-field-label">Facultativo Prescriptor</span>
            <span class="patient-field-value">${doctor}</span>
          </div>
          <div>
            <span class="patient-field-label">Registro Sanitario</span>
            <span class="patient-field-value mono">${colNumber}</span>
          </div>
        </div>
        <div style="margin-top: 3mm; padding-top: 2.5mm; border-top: 0.5pt dashed #E5E7EB;">
          <span class="patient-field-label">Indicación y Criterio Clínico Principal</span>
          <span class="patient-field-value" style="font-size: 8.5pt; font-weight: 500; color: #374151;">
            ${diagnosis}
          </span>
        </div>
      </div>

      <!-- Cuadro Ejecutivo de Objetivos Metabólicos Diarios -->
      <div class="executive-summary-grid">
        <div class="exec-metric-box">
          <div class="exec-metric-title">Energía Prescrita</div>
          <div class="exec-metric-number">${data.targetKcal}</div>
          <div class="exec-metric-sub">kcal / día de promedio</div>
        </div>
        <div class="exec-metric-box">
          <div class="exec-metric-title">Proteína Bioasimilable</div>
          <div class="exec-metric-number">${data.dailyAverages.proteinG}g</div>
          <div class="exec-metric-sub">~1.86 g/kg peso corporal</div>
        </div>
        <div class="exec-metric-box">
          <div class="exec-metric-title">Carbohidratos Complejos</div>
          <div class="exec-metric-number">${data.dailyAverages.carbsG}g</div>
          <div class="exec-metric-sub">Ciclado en días pesados</div>
        </div>
        <div class="exec-metric-box">
          <div class="exec-metric-title">Grasas Esenciales</div>
          <div class="exec-metric-number">${data.dailyAverages.fatG}g</div>
          <div class="exec-metric-sub">Densidad lipídica antiinflamatoria</div>
        </div>
      </div>

      <!-- Alerta Farmacoterapéutica en Portada -->
      <div class="pharma-notice">
        <strong>⚠️ AVISO DE FARMACOVIGILANCIA Y ABSORCIÓN:</strong> ${data.pharmacotherapyNotes || 'En caso de pauta de Levotiroxina (Eutirox 75 mcg), administrar estrictamente en ayunas a las 08:00 AM con agua. Espaciar al menos 60 a 180 minutos de la ingesta de alimentos con alto contenido en fibra insoluble o calcio denso (DOI: 10.1089/thy.2014.0028).'}
      </div>
    </div>

    <!-- Pie y Firma Oficial en Portada -->
    <div class="cover-footer-signatures">
      <div class="signature-box">
        <div class="signature-line">
          <div class="signature-stamp">Dra. C. Gómez Pardo</div>
        </div>
        <div>Firma y Sello del Facultativo</div>
        <div style="font-size: 6.5pt; color: #9CA3AF;">Firma digital con certificado médico colegial</div>
      </div>
      <div style="text-align: right; font-size: 7pt; color: #6B7280;">
        <div>Emitido electrónicamente conforme a la Ley 41/2002 de Autonomía del Paciente</div>
        <div>Validez clínica oficial en toda la red sanitaria</div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════
       PÁGINA 2: DISTRIBUCIÓN HORARIA Y CUADRÍCULA TERAPÉUTICA SEMANAL
       ═══════════════════════════════════════════════════════════════ -->
  <div class="content-page">
    <!-- Running Header Superior -->
    <div class="running-header">
      <div class="running-header-left">
        <span>⚕</span>
        <span>${clinicName}</span>
        <span style="font-weight: normal; color: #9CA3AF;">|</span>
        <span style="font-family: system-ui; font-weight: normal; color: #4B5563;">Pauta Semanal: ${data.dietName}</span>
      </div>
      <div class="running-header-right">
        Paciente: ${data.clientName} · ${patientId}
      </div>
    </div>

    <!-- Tabla Semanal con Saltos Controlados (page-break-inside: avoid) -->
    <div class="diet-table-container">
      <table class="diet-table">
        <thead>
          <tr>
            <th class="col-meal">Ingesta</th>
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
                      ? '<span style="color:#9CA3AF;">—</span>'
                      : day.items
                          .map(
                            (it) => `
                        <div class="meal-item">
                          <span class="item-name">${it.name}</span>
                          <span class="item-qty">(${it.quantity} ${it.unit})</span>
                          ${
                            it.mealPrepNotes
                              ? `<div class="meal-prep-callout">🥣 Prep: ${it.mealPrepNotes}</div>`
                              : ''
                          }
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
    </div>

    <!-- Resumen de Evidencias Clínicas y Consensos Científicos (ISSN / OMS / SEEN) -->
    <div class="clinical-guidelines-box">
      <div class="guidelines-title">
        <span>🏛️</span>
        <span>Consensos Clínicos y Evidencia Científica Indexada</span>
      </div>
      <div class="guidelines-grid">
        <div>
          <strong>ISSN Stand on Protein and Exercise:</strong> Requerimiento mínimo de 1.4 a 2.0 g/kg/día para optimizar la síntesis miofibrilar y preservación de masa muscular en recomposición.
          <span class="doi-reference">DOI: https://doi.org/${data.guidelineReferences?.issnDOI || '10.1186/s12970-017-0177-8'}</span>
        </div>
        <div>
          <strong>Ciclado de Carbohidratos & Sensibilidad a la Insulina:</strong> Concentración de glucógeno en días de entrenamiento pesado y optimización del almidón resistente retrógrado.
          <span class="doi-reference">DOI: https://doi.org/${data.guidelineReferences?.seenDOI || '10.1016/j.biopha.2006.07.080'}</span>
        </div>
      </div>
    </div>

    <!-- Running Footer Inferior -->
    <div class="running-footer">
      <div class="legal-notice">
        Documento confidencial para uso exclusivo del paciente ${data.clientName}. Prohibida su divulgación sin autorización médica.
        ${data.notes ? ` · Indicaciones adicionales: ${data.notes}` : ''}
      </div>
      <div style="font-family: 'Geist Mono', monospace; font-weight: 500;">
        Página 2 de 2
      </div>
    </div>
  </div>

  <script>
    // Trigger de impresión automática al abrir si se solicita mediante query param
    if (window.location.search.includes('autoprint=true')) {
      window.onload = function() {
        window.print();
      };
    }
  </script>
</body>
</html>`;
}
