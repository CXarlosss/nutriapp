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
    await expect(page).toHaveURL(/\/dietas\/diet-demo-1/);
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

});
