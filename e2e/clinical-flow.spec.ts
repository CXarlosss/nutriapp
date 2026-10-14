import { test, expect } from '@playwright/test';

/**
 * Suite de Pruebas E2E: Flujo Clínico Completo (Bloque 12)
 * 
 * Simula la interacción real del usuario profesional:
 * 1. Carga de la aplicación y navegación al Creador de Dietas (/dietas/creador).
 * 2. Interacción con la cuadrícula de planificación semanal.
 * 3. Ejecución de búsqueda semántica asistida por IA (pgvector HNSW).
 * 4. Selección e inserción de alimento con alta afinidad clínica.
 * 5. Validación del motor CDSS y publicación exitosa del plan.
 * 6. Navegación al expediente de auditoría clínica inmutable (CQRS).
 */
test.describe('Flujo Clínico Enterprise en NutriApp', () => {

  test('debe permitir buscar alimentos por semántica clínica, añadirlos al plan y publicar la dieta', async ({ page }) => {
    // 1. Navegación al creador de dietas
    await page.goto('/dietas/creador');
    await expect(page).toHaveTitle(/NutriApp/i);

    // Verificar visibilidad de la cuadrícula y el botón de publicar
    const publishBtn = page.locator('[data-testid="publish-diet-btn"]');
    await expect(publishBtn).toBeVisible({ timeout: 10000 });

    // 2. Localizar y abrir la celda de Comida del Lunes (Día 1)
    const mondayLunchCell = page.locator('[data-testid="slot-cell-1-comida"]');
    await expect(mondayLunchCell).toBeVisible();
    await mondayLunchCell.click();

    // 3. Verificar que el popover de búsqueda semántica se abre con autofoco
    const searchInput = page.locator('[data-testid="semantic-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Verificar que el switch "Modo IA" está presente y activo
    const modeToggle = page.locator('[data-testid="semantic-mode-toggle"]');
    await expect(modeToggle).toBeVisible();
    await expect(modeToggle).toContainText(/Modo IA/i);

    // 4. Ejecutar búsqueda semántica clínica abstracta (Omega-3 articular)
    // Usamos el preset directo o escribimos en el campo
    const omegaPreset = page.locator('[data-testid="semantic-preset-0"]');
    if (await omegaPreset.isVisible()) {
      await omegaPreset.click();
    } else {
      await searchInput.fill('fuente de omega 3 para recuperacion articular');
    }

    // 5. Esperar resultados vectoriales con afinidad calculada por pgvector
    const foodResults = page.locator('[data-testid="semantic-food-result"]');
    await expect(foodResults.first()).toBeVisible({ timeout: 6000 });

    // Verificar que el resultado de mayor afinidad es Salmón o Nueces (rico en Omega 3)
    const firstResultText = await foodResults.first().textContent();
    expect(firstResultText?.toLowerCase()).toMatch(/(salmón|salmon|nueces|chía|chia)/);
    expect(firstResultText).toContain('afinidad');

    // 6. Seleccionar el alimento para inyectarlo en la celda
    await foodResults.first().click();

    // 7. Publicar la dieta clínica (evaluación del motor CDSS y persistencia)
    await publishBtn.click();

    // Si el motor CDSS detecta desbalance semanal respecto al perfil del deportista,
    // se presenta el modal de evidencia científica con opción de excepción clínica
    const forcePublishBtn = page.locator('[data-testid="force-publish-btn"]');
    if (await forcePublishBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forcePublishBtn.click();
    }

    // 8. Verificar que el banner de publicación exitosa aparece
    const successBanner = page.locator('[data-testid="publish-success-banner"]');
    await expect(successBanner).toBeVisible({ timeout: 6000 });
    await expect(successBanner).toContainText('Dieta validada clínicamente y publicada con éxito');

    // 9. Navegar a la Auditoría Clínica Inmutable (Time Travel & CQRS)
    const auditBtn = page.locator('[data-testid="audit-clinical-btn"]');
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();

    // 10. Validar llegada a la ruta del expediente clínico (/dietas/[id])
    await expect(page).toHaveURL(/\/dietas\/diet-demo-1/, { timeout: 8000 });
    await expect(page.locator('text=Auditoría Clínica Inmutable')).toBeVisible({ timeout: 8000 });
  });

  test('debe capturar y reportar telemetría de errores en la consola de observabilidad /debug-sentry', async ({ page }) => {
    // 1. Navegación a la consola de Sentry
    await page.goto('/debug-sentry');
    await expect(page.locator('h1')).toContainText('Consola de Observabilidad & Sentry');

    // 2. Verificar estado del entorno y DSN
    await expect(page.locator('text=SDK v11 Activo')).toBeVisible();

    // 3. Provocar error de servidor simulado
    const serverErrorBtn = page.locator('button:has-text("Forzar Error en Servidor")');
    await expect(serverErrorBtn).toBeVisible();
    await serverErrorBtn.click();

    // 4. Verificar que se renderiza el log diagnóstico en pantalla
    await expect(page.locator('text=[SERVER RESPONSE 500]')).toBeVisible({ timeout: 5000 });
  });

  test('debe gestionar la Historia Clínica, analíticas sanguíneas, escala de Bristol y alertas fármaco-nutriente', async ({ page }) => {
    // 1. Navegación a la ficha clínica del cliente
    await page.goto('/clients/client-1');
    await expect(page.locator('h1')).toContainText('Carlos Gómez Pardo');

    // 2. Acceder a la pestaña Historia Clínica
    const clinicalTab = page.locator('button:has-text("Historia Clínica")');
    await expect(clinicalTab).toBeVisible();
    await clinicalTab.click();

    // 3. Validar Módulo de Analíticas de Sangre
    await expect(page.locator('text=Módulo de Analíticas de Sangre')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Ferritina Sérica')).toBeVisible();
    await expect(page.locator('text=25-OH Vitamina D')).toBeVisible();
    await expect(page.locator('text=Tirotropina (TSH)')).toBeVisible();
    await expect(page.locator('text=Hemoglobina Glicosilada (HbA1c)')).toBeVisible();

    // 4. Cambiar a subsección Síntomas y Tránsito (Bristol)
    const symptomsSubTab = page.locator('button:has-text("Síntomas y Tránsito (Bristol)")');
    await expect(symptomsSubTab).toBeVisible();
    await symptomsSubTab.click();

    await expect(page.locator('text=Gestor de Síntomas, Tránsito y Digestiones')).toBeVisible();
    await expect(page.getByText('Escala de Bristol', { exact: true })).toBeVisible();
    await expect(page.locator('text=Inflamación').first()).toBeVisible();
    await expect(page.locator('text=Reflujo').first()).toBeVisible();

    // 5. Cambiar a subsección Farmacoterapia y Alertas CDSS
    const medsSubTab = page.locator('button:has-text("Farmacoterapia y Alertas CDSS")');
    await expect(medsSubTab).toBeVisible();
    await medsSubTab.click();

    await expect(page.locator('text=Farmacoterapia y Alertas Fármaco-Nutriente')).toBeVisible();
    await expect(page.locator('text=Levotiroxina (75 mcg)')).toBeVisible();

    // 6. Probar el simulador de conflictos en tiempo real (añadir Tofu en desayuno)
    const addTofuBtn = page.locator('button:has-text("+ Añadir Tofu/Soja en Desayuno")');
    if (await addTofuBtn.isVisible()) {
      await addTofuBtn.click();
      // Validar detección de interacción crítica por quelación de T4 con DOI científico
      await expect(page.locator('text=Interacción Crítica: Levotiroxina').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=10.1089/thy.2014.0028').first()).toBeVisible();
    }
  });

  test('debe permitir al paciente completar el cuestionario pre-consulta y sincronizarlo sin data entry en la ficha médica', async ({ page }) => {
    // 1. Acceso del paciente mediante enlace único recibido por WhatsApp/Email
    await page.goto('/pre-consulta/token_javier_navarro_2026');
    await expect(page.locator('h1')).toContainText('Javier Navarro Soler');

    // 2. Paso 1: Medidas y Rutina diaria
    await expect(page.locator('text=1. Medidas Corporales y Rutinas Diarias')).toBeVisible();
    await page.locator('[data-testid="onboarding-next-btn"]').click();

    // 3. Paso 2: Alergias y Aversiones alimentarias
    await expect(page.locator('text=2. Alergias, Intolerancias y Alimentos Rechazados')).toBeVisible();
    const lactoseBtn = page.locator('button:has-text("Lactosa")');
    if (await lactoseBtn.isVisible()) {
      await lactoseBtn.click();
    }
    const aversionChip = page.locator('button:has-text("Brócoli crudo")');
    if (await aversionChip.isVisible()) {
      await aversionChip.click();
    }
    await page.locator('[data-testid="onboarding-next-btn"]').click();

    // 4. Paso 3: Patologías y Medicación
    await expect(page.locator('text=3. Patologías Diagnosticadas y Medicación')).toBeVisible();
    await page.locator('[data-testid="onboarding-next-btn"]').click();

    // 5. Paso 4: Tránsito Digestivo (Bristol) y Envío
    await expect(page.locator('text=4. Digestión Basal y Escala de Bristol')).toBeVisible();
    const submitBtn = page.locator('[data-testid="onboarding-submit-btn"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 6. Validar Pantalla de Éxito para el paciente
    await expect(page.locator('text=¡Formulario completado con éxito, Javier Navarro Soler!').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('text=Cero Data Entry en tu Consulta')).toBeVisible();

    // 7. Validar que la nutricionista abre la ficha y ya tiene todo estructurado
    await page.goto('/clients/client-1');
    await expect(page.locator('text=Cuestionario Pre-Consulta (Cero Data Entry)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Completado por el paciente ✓')).toBeVisible();
    await expect(page.locator('text=Aversiones (No tolera / Rechaza comer)')).toBeVisible();
    await expect(page.locator('text=Rutina Diaria, Horarios y Estilo de Vida')).toBeVisible();
  });

  test('debe consolidar la lista de la compra semanal y gestionar notas críticas de meal prep para adherencia del paciente', async ({ page }) => {
    // 1. Acceder al Diet Builder (/dietas/creador) y comprobar las notas de preparación en celdas
    await page.goto('/dietas/creador');
    await expect(page.locator('text=Definición Muscular 1900 kcal')).toBeVisible({ timeout: 6000 });

    // Comprobar la presencia visual de las notas Meal Prep en el grid
    await expect(page.locator('text=Dejar la chía y la avena en remojo').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('text=Cocinar y enfriar 24h para generar almidón resistente').first()).toBeVisible();

    // 2. Acceder al portal del paciente /mi-dieta
    await page.goto('/mi-dieta');
    await expect(page.locator('text=Plan Definición 1900 kcal')).toBeVisible({ timeout: 6000 });

    // Verificar que en el menú diario se visualizan las notas de preparación
    await expect(page.locator('text=Meal Prep:').first()).toBeVisible();
    await expect(page.locator('text=Cocinar la patata y enfriar 24h para generar almidón resistente').first()).toBeVisible();

    // 3. Cambiar a la pestaña "Lista de la Compra"
    const shoppingTabBtn = page.locator('[data-testid="mode-shopping-btn"]');
    await expect(shoppingTabBtn).toBeVisible();
    await shoppingTabBtn.click();

    // 4. Validar consolidación y suma de cantidades inteligentes
    await expect(page.locator('h1')).toContainText('Lista de la Compra Semanal');
    // Pechuga de pollo consolidada a 1.2 kg
    await expect(page.locator('text=1.2 kg')).toBeVisible();
    // Plátanos sumados a 4 ud
    await expect(page.locator('text=4 ud')).toBeVisible();
    // Avena en copos consolidada a 250g
    await expect(page.locator('text=250g')).toBeVisible();

    // 5. Validar sección de Notas Críticas de Meal Prep de la semana
    await expect(page.locator('text=Notas Críticas de Meal Prep')).toBeVisible();
    await expect(page.locator('text=Dejar la chía y la avena en remojo la noche anterior').first()).toBeVisible();

    // 6. Probar interacción de compra (marcar checkbox de Pechuga de pollo)
    const chickenItem = page.locator('li:has-text("Pechuga de pollo")').first();
    await expect(chickenItem).toBeVisible();
    await chickenItem.click();

    // Validar actualización de la barra de progreso
    await expect(page.locator('text=Progreso en el Supermercado:')).toBeVisible();
    await expect(page.locator('text=1 /')).toBeVisible();
  });

  test('debe procesar el dictado clínico de consulta con Whisper e IA e inyectar automáticamente peso, síntomas y notas SOAP en el expediente', async ({ page }) => {
    // 1. Navegar a la ficha médica del paciente
    await page.goto('/clients/client-1');
    await expect(page.locator('h1')).toContainText('Carlos Gómez Pardo');

    // Verificar peso inicial basal
    await expect(page.locator('text=76.4 kg')).toBeVisible();

    // 2. Abrir el modal de Dictado Clínico Asistido por Voz
    const voiceTriggerBtn = page.locator('[data-testid="voice-assistant-trigger-btn"]');
    await expect(voiceTriggerBtn).toBeVisible();
    await voiceTriggerBtn.click();

    // 3. Validar presencia del modal de Asistente de Voz
    await expect(page.locator('text=Asistente de Consulta por Voz (Cero Pantallas)')).toBeVisible();
    await expect(page.locator('text=Casos de Consulta Precargados')).toBeVisible();

    // 4. Seleccionar el caso de consulta y procesar con IA
    const processBtn = page.locator('[data-testid="process-preset-btn"]');
    await expect(processBtn).toBeVisible();
    await processBtn.click();

    // 5. Validar que la IA extrae los Structured Outputs médicos
    // Peso actual detectado: 75.2 kg
    await expect(page.locator('text=75.2 kg').first()).toBeVisible({ timeout: 6000 });
    // Variación vs basal (-1.2 kg)
    await expect(page.locator('text=-1.2 kg vs basal')).toBeVisible();
    // Adherencia 90%
    await expect(page.locator('text=90%').first()).toBeVisible();
    // Escala Bristol Tipo 3
    await expect(page.locator('text=Tipo 3').first()).toBeVisible();
    // Aversión detectada
    await expect(page.locator('text=Brócoli hervido').first()).toBeVisible();
    // Registro SOAP
    await expect(page.locator('text=Registro Clínico SOAP Generado')).toBeVisible();

    // 6. Inyectar en el expediente con Cero Pantallas
    const commitBtn = page.locator('[data-testid="commit-voice-data-btn"]');
    await expect(commitBtn).toBeVisible();
    await commitBtn.click();

    // 7. Validar actualización reactiva instantánea en la ficha del paciente
    await expect(page.locator('text=¡Expediente actualizado con éxito!')).toBeVisible({ timeout: 5000 });

    // Esperar cierre automático del modal y verificar la ficha
    await expect(page.locator('text=Consulta procesada por voz:')).toBeVisible({ timeout: 6000 });
    // El peso en la ficha debe haberse actualizado a 75.2 kg
    await expect(page.locator('text=75.2 kg').first()).toBeVisible();
    // La nueva aversión alimentaria debe estar registrada
    await expect(page.locator('text=🚫 Brócoli hervido')).toBeVisible();

    // 8. Validar la nota SOAP en la pestaña de Notas
    const notesTab = page.locator('button:has-text("Notas")');
    await expect(notesTab).toBeVisible();
    await notesTab.click();

    await expect(page.locator('text=CONSULTA ASISTIDA POR VOZ (WHISPER + IA)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=S (Subjetivo):')).toBeVisible();
    await expect(page.locator('text=O (Objetivo):')).toBeVisible();
  });

  test('debe visualizar las métricas financieras de Stripe (MRR, Churn, LTV), ejecutar el cron de retención y reenganchar pacientes con >= 14 días inactivos', async ({ page }) => {
    // 1. Navegar al Dashboard clínico
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Dashboard/i);

    // 2. Validar que la tabla clínica identifica pacientes con >= 14 días inactivos
    await expect(page.locator('text=3 en Riesgo')).toBeVisible();
    await expect(page.locator('text=🚩 Inactivo 17d').first()).toBeVisible();

    // 3. Conmutar a la pestaña de Analítica de Negocio y Retención (Stripe)
    const analyticsTab = page.locator('[data-testid="tab-analytics"]');
    await expect(analyticsTab).toBeVisible();
    await analyticsTab.click();

    // 4. Validar KPIs de salud financiera sincronizados de Stripe
    await expect(page.locator('text=Métricas de Negocio & Retención (Stripe + Churn Engine)')).toBeVisible({ timeout: 6000 });
    // MRR
    await expect(page.locator('[data-testid="mrr-value"]')).toContainText('3476');
    await expect(page.locator('text=+12.8% MoM')).toBeVisible();
    // Churn Rate
    await expect(page.locator('[data-testid="churn-rate-value"]')).toContainText('2.3%');
    // LTV
    await expect(page.locator('[data-testid="ltv-value"]')).toContainText('687');

    // 5. Validar Radar Predictivo de Abandono (>= 14 días sin actividad en /mi-dieta)
    const criticalCountBadge = page.locator('[data-testid="critical-risk-count"]');
    await expect(criticalCountBadge).toHaveText('3');

    // Comprobar la tarjeta del paciente en riesgo crítico (Carlos Gómez Pardo - 17 días)
    const riskCardC2 = page.locator('[data-testid="risk-client-c2"]');
    await expect(riskCardC2).toBeVisible();
    await expect(riskCardC2.locator('text=17 días inactivo')).toBeVisible();

    // 6. Ejecutar script Cron de prevención de abandono bajo demanda
    const cronBtn = page.locator('[data-testid="run-retention-cron-btn"]');
    await expect(cronBtn).toBeVisible();
    await cronBtn.click();
    await expect(page.locator('text=Cron ejecutado con éxito')).toBeVisible({ timeout: 6000 });

    // 7. Enviar mensaje de rescate clínico por WhatsApp
    const rescueBtn = page.locator('[data-testid="rescue-whatsapp-c2"]');
    await expect(rescueBtn).toBeVisible();
    await rescueBtn.click();

    // Confirmar feedback y cambio de estado a "Contactado"
    await expect(page.locator('text=Mensaje de reenganche clínico enviado con éxito')).toBeVisible({ timeout: 5000 });
    await expect(riskCardC2.locator('text=Contactado')).toBeVisible();

    // 8. Validar endpoint de ejecución programada /api/cron/retention-check
    const cronApiRes = await page.request.get('/api/cron/retention-check');
    expect(cronApiRes.status()).toBe(200);
    const cronJson = await cronApiRes.json();
    expect(cronJson.success).toBe(true);
    expect(cronJson.evaluatedClientsCount).toBe(12);
    expect(cronJson.criticalAtRiskCount).toBe(3);
  });

  test('debe ejecutar micro-interacciones cinéticas de Framer Motion: drag & drop magnético con snap físico y transiciones de origen en modales', async ({ page }) => {
    // 1. Acceder al Diet Builder (/dietas/creador)
    await page.goto('/dietas/creador');
    await expect(page.locator('text=Definición Muscular 1900 kcal')).toBeVisible({ timeout: 6000 });

    // 2. Validar Transiciones de Origen (Shared Layout) en la alerta del CDSS
    // En el estado inicial, la Avena está en el Desayuno e interacciona con Levotiroxina
    const cdssCard = page.locator('[data-testid="cdss-alert-card-alert-levo-fiber-item-1"]');
    await expect(cdssCard).toBeVisible({ timeout: 5000 });
    await cdssCard.click();

    // Validar que el modal de evidencia ampliada se renderiza con el transformOrigin hacia el panel lateral
    const cdssModal = page.locator('[data-testid="cdss-alert-evidence-modal"]');
    await expect(cdssModal).toBeVisible();
    const cdssOrigin = await cdssModal.evaluate((el) => el.style.transformOrigin);
    expect(cdssOrigin).toContain('right');
    expect(cdssOrigin).toContain('center');
    await expect(cdssModal.locator('text=Interacción Fármaco-Nutriente Detectada')).toBeVisible();

    // Cerrar modal CDSS
    const closeCdssBtn = page.locator('[data-testid="close-alert-modal-btn"]');
    await closeCdssBtn.click();
    await expect(cdssModal).not.toBeVisible();

    // 3. Comprobar que los alimentos en el grid son arrastrables con feedback cinético
    const sourceCell = page.locator('[data-testid="slot-cell-1-desayuno"]');
    await expect(sourceCell).toBeVisible();
    const targetCell = page.locator('[data-testid="slot-cell-1-comida"]');
    await expect(targetCell).toBeVisible();

    // Comprobar la presencia del alimento con cursor grab y layout reactivo
    const foodItem = sourceCell.locator('text=Avena en copos suaves').first();
    await expect(foodItem).toBeVisible();

    // 4. Simular drag & drop con la API nativa de DragEvent y DataTransfer en el navegador
    await page.evaluate(() => {
      const source = document.querySelector('[data-testid="slot-cell-1-desayuno"] [draggable="true"]');
      const target = document.querySelector('[data-testid="slot-cell-1-comida"]');
      if (!source || !target) throw new Error('Elementos no encontrados para drag and drop');

      const dt = new DataTransfer();
      dt.setData('text/plain', 'item-1');
      (window as any).__clinicalDt = dt;

      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    });

    // Validar el feedback visual magnético (borde iluminado ring-2 y snap placeholder)
    await expect(targetCell).toHaveClass(/ring-2/);
    await expect(targetCell.locator('text=Soltar alimento (Snap Magnético)')).toBeVisible();

    // Completar el drop magnético con snap físico
    await page.evaluate(() => {
      const source = document.querySelector('[data-testid="slot-cell-1-desayuno"] [draggable="true"]');
      const target = document.querySelector('[data-testid="slot-cell-1-comida"]');
      const dt = (window as any).__clinicalDt || new DataTransfer();

      target?.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      source?.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    });

    // Validar que el alimento ahora se encuentra en la celda de Comida
    await expect(targetCell.locator('text=Avena en copos suaves')).toBeVisible({ timeout: 5000 });

    // 5. Validar Transiciones de Origen en el Asistente de Voz (/clients/client-1)
    await page.goto('/clients/client-1');
    await expect(page.locator('h1')).toContainText('Carlos Gómez Pardo');

    const voiceBtn = page.locator('[data-testid="voice-assistant-trigger-btn"]');
    await expect(voiceBtn).toBeVisible();
    await voiceBtn.click();

    // Validar que el modal de voz emerge con transformOrigin hacia la esquina superior derecha
    const voiceModal = page.locator('[data-testid="voice-modal-content"]');
    await expect(voiceModal).toBeVisible();
    const voiceOrigin = await voiceModal.evaluate((el) => el.style.transformOrigin);
    expect(voiceOrigin).toContain('right');
    expect(voiceOrigin).toContain('top');
    await expect(voiceModal.locator('text=Asistente de Consulta por Voz')).toBeVisible();
  });

  test('debe aplicar la jerarquía tipográfica clínica con alineación numérica tabular-nums y contraste monoespaciado para identificadores y métricas brutas', async ({ page }) => {
    // 1. Acceder a la ficha del paciente (/clients/client-1)
    await page.goto('/clients/client-1');
    await expect(page.locator('h1')).toContainText('Carlos Gómez Pardo');

    // 2. Validar que la regla tabular-nums está activa en el body y fuentes numéricas
    const bodyTabularCheck = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      return {
        fontVariantNumeric: bodyStyle.fontVariantNumeric,
        fontFeatureSettings: bodyStyle.fontFeatureSettings,
      };
    });
    expect(
      bodyTabularCheck.fontVariantNumeric.includes('tabular-nums') ||
      bodyTabularCheck.fontFeatureSettings.includes('tnum')
    ).toBe(true);

    // 3. Validar el contraste tipográfico del Identificador de Paciente (monoespaciado)
    const patientBadge = page.locator('[data-testid="patient-id-badge"]');
    await expect(patientBadge).toBeVisible();
    await expect(patientBadge).toHaveText('ID: client-1');
    
    const badgeFontFamily = await patientBadge.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(badgeFontFamily.toLowerCase()).toMatch(/(mono|geist_mono|jetbrains|consolas|menlo)/);

    // 4. Validar tipografía monoespaciada con tabular-nums en métricas cuantitativas personales (76.4 kg)
    const weightMetric = page.locator('text=76.4 kg').first();
    await expect(weightMetric).toBeVisible();
    const weightFont = await weightMetric.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
        fontVariantNumeric: style.fontVariantNumeric,
      };
    });
    expect(weightFont.fontFamily.toLowerCase()).toMatch(/(mono|geist_mono|jetbrains|consolas|menlo)/);

    // 5. Navegar al Diet Builder y verificar tabular-nums en totales de Kcal y macros
    await page.goto('/dietas/creador');
    await expect(page.locator('text=Definición Muscular 1900 kcal')).toBeVisible({ timeout: 6000 });

    const dailyKcalMetric = page.locator('text=kcal').first();
    await expect(dailyKcalMetric).toBeVisible();
    const kcalTabular = await dailyKcalMetric.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.fontVariantNumeric || style.fontFeatureSettings;
    });
    expect(kcalTabular).toMatch(/(tabular-nums|tnum)/);
  });

  test('debe visualizar los anillos SVG concéntricos de macronutrientes (Apple Watch style) en el portal del paciente /mi-dieta para adherencia psicológica', async ({ page }) => {
    // 1. Acceder al portal del paciente /mi-dieta
    await page.goto('/mi-dieta');
    await expect(page.locator('text=Plan Definición 1900 kcal')).toBeVisible({ timeout: 6000 });

    // 2. Validar presencia del componente de anillos concéntricos
    const ringsComponent = page.locator('[data-testid="concentric-macro-rings"]');
    await expect(ringsComponent).toBeVisible();
    await expect(ringsComponent.locator('text=Anillos de Adherencia Diaria')).toBeVisible();
    await expect(ringsComponent.locator('text=Apple Rings')).toBeVisible();

    // 3. Validar los 3 anillos concéntricos SVG (Proteína, Carbohidratos, Grasas)
    const proteinRow = page.locator('[data-testid="macro-ring-row-protein"]');
    await expect(proteinRow).toBeVisible();
    await expect(proteinRow).toContainText('Proteína');
    await expect(proteinRow).toContainText('140 g');

    const carbsRow = page.locator('[data-testid="macro-ring-row-carbs"]');
    await expect(carbsRow).toBeVisible();
    await expect(carbsRow).toContainText('Carbohidratos');
    await expect(carbsRow).toContainText('210 g');

    const fatRow = page.locator('[data-testid="macro-ring-row-fat"]');
    await expect(fatRow).toBeVisible();
    await expect(fatRow).toContainText('Grasas Saludables');
    await expect(fatRow).toContainText('55 g');

    // 4. Validar el núcleo central de Kcal con llama animada
    const currentKcal = page.locator('[data-testid="rings-current-kcal"]');
    await expect(currentKcal).toBeVisible();
    await expect(currentKcal).toHaveClass(/tabular-nums/);

    // 5. Validar renderizado de círculos SVG de progreso
    const svgCircles = ringsComponent.locator('svg circle');
    // Debe haber 6 círculos: 3 pistas de fondo + 3 anillos de progreso
    await expect(svgCircles).toHaveCount(6);

    // 6. Cambiar al Día 3 (Miércoles - Descanso) y comprobar adaptación dinámica de targets
    const wednesdayBtn = page.locator('nav[aria-label="Días de la semana"] button').nth(2);
    await wednesdayBtn.click();

    // Comprobar que los targets de carbos y kcal se actualizan al modo descanso
    await expect(ringsComponent.locator('text=1700 kcal')).toBeVisible();
    await expect(carbsRow).toContainText('125 g');
  });

  test('debe generar informe médico PDF hospitalario con portada automática, tipografías Serif (Playfair Display) y reglas @media print de corte de página', async ({ page }) => {
    // 1. Acceso al portal /mi-dieta y verificación del botón de exportación oficial
    await page.goto('/mi-dieta');
    const exportBtn = page.locator('[data-testid="export-hospital-pdf-btn"]');
    await expect(exportBtn).toBeVisible({ timeout: 6000 });
    const href = await exportBtn.getAttribute('href');
    expect(href).toContain('/api/export-pdf');

    // 2. Navegación directa al endpoint de exportación PDF
    const response = await page.goto('/api/export-pdf?client=Carlos%20P%C3%A9rez&diet=Plan%20Definici%C3%B3n%201900%20kcal');
    expect(response?.status()).toBe(200);

    // 3. Validar presencia de la Portada Automática Oficial del Hospital
    const hospitalTitle = page.locator('.hospital-titles h1');
    await expect(hospitalTitle).toBeVisible();
    await expect(hospitalTitle).toContainText(/HOSPITAL|CENTRO M[EÉ]DICO/i);

    const docCategory = page.locator('.document-category');
    await expect(docCategory).toBeVisible();
    await expect(docCategory).toContainText(/Prescripci[oó]n Terap[eé]utica Oficial/i);

    const patientCard = page.locator('.patient-clinical-card');
    await expect(patientCard).toBeVisible();
    await expect(patientCard).toContainText('Carlos Pérez');
    await expect(patientCard).toContainText('HC-2026-0042');

    // 4. Validar reglas de estilo @media print y fuentes Serif
    const pageStyles = await page.evaluate(() => {
      // Buscar enlace a Playfair Display o estilos aplicados
      const headHtml = document.head.innerHTML;
      const hasPlayfair = headHtml.includes('Playfair+Display') || headHtml.includes('Playfair Display');
      const hasSourceSerif = headHtml.includes('Source+Serif+4') || headHtml.includes('Source Serif 4');
      
      const actions = document.querySelector('.screen-actions');
      const actionsVisible = actions ? window.getComputedStyle(actions).display : null;

      return {
        hasPlayfair,
        hasSourceSerif,
        actionsVisible,
      };
    });

    expect(pageStyles.hasPlayfair).toBe(true);
    expect(pageStyles.hasSourceSerif).toBe(true);
    expect(pageStyles.actionsVisible).not.toBe('none'); // Visible en pantalla normal, oculto en print

    // 5. Validar que la cuadrícula dietética y el bloque de evidencias clínicas con DOIs están presentes
    const dietTable = page.locator('.diet-table');
    await expect(dietTable).toBeVisible();

    const doilinks = page.locator('.clinical-guidelines-box');
    await expect(doilinks).toBeVisible();
    await expect(doilinks).toContainText(/doi\.org/i);

    // 6. Validar firma médica y sello del facultativo
    const signatureBox = page.locator('.signature-box');
    await expect(signatureBox.first()).toBeVisible();
    await expect(signatureBox.first()).toContainText(/Dra\.\s*(?:C\.|Carmen)\s*G[oó]mez Pardo/i);
  });

  test('debe garantizar el aislamiento RLS multi-tenant a nivel de motor de base de datos entre clínicas (Clínica Vida vs Centro Médico Élite)', async ({ request }) => {
    // 1. Consultar auditoría completa del motor RLS multi-tenant
    const response = await request.get('/api/admin/tenants/audit');
    expect(response.status()).toBe(200);
    const data = await response.json();

    // 2. Verificar que el aislamiento a nivel de motor está 100% activo
    expect(data.success).toBe(true);
    expect(data.engine).toContain('PostgreSQL Row Level Security (RLS)');
    expect(data.isIsolatedAtEngineLevel).toBe(true);

    // 3. Verificar que Nutricionista de Clínica Vida sólo ve pacientes de Clínica Vida
    const vida = data.tenants.clinicaVida;
    expect(vida.activeClinic.name).toBe('Clínica Vida Saludable');
    expect(vida.totalVisibleClients).toBe(2);
    expect(vida.visiblePatients).toContain('Carlos Gómez Pardo');
    expect(vida.visiblePatients).toContain('Laura García Mendoza');
    expect(vida.crossTenantLeakage).toBe(false);
    expect(vida.foreignPatientsDetected).toHaveLength(0);

    // 4. Verificar que Nutricionista de Centro Médico Élite sólo ve pacientes de Centro Médico Élite
    const elite = data.tenants.centroElite;
    expect(elite.activeClinic.name).toBe('Centro Médico Élite Nutrición');
    expect(elite.totalVisibleClients).toBe(2);
    expect(elite.visiblePatients).toContain('Marcos Robles Silva');
    expect(elite.visiblePatients).toContain('Elena Santos Ramos');
    expect(elite.crossTenantLeakage).toBe(false);
    expect(elite.foreignPatientsDetected).toHaveLength(0);

    // 5. Verificar que el resumen certifica cero filtraciones cruzadas
    expect(data.verificationSummary.vidaOnlySeesVida).toBe(true);
    expect(data.verificationSummary.eliteOnlySeesElite).toBe(true);
    expect(data.verificationSummary.zeroCrossLeakage).toBe(true);

    // 6. Probar intento de inyección / escritura cruzada (Cross-Tenant Write)
    const crossWriteAttempt = await request.post('/api/admin/tenants/audit', {
      data: {
        activeClinicId: '11111111-1111-1111-1111-111111111111', // Clínica Vida
        targetClinicId: '22222222-2222-2222-2222-222222222222', // Intento forzado en Clínica Élite
        fullName: 'Paciente Malicioso Infiltrado',
      },
    });

    expect(crossWriteAttempt.status()).toBe(403);
    const errorData = await crossWriteAttempt.json();
    expect(errorData.blockedByRls).toBe(true);
    expect(errorData.error).toContain('Violación de Política RLS Multi-Tenant');
  });

});



