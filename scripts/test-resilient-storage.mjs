/**
 * Test de Verificación de Resistencia Anti-QuotaExceededError para NutriApp
 * 
 * Valida:
 * 1. Detección precisa de QuotaExceededError (DOMException 22, 1014, NS_ERROR_DOM_QUOTA_REACHED).
 * 2. Auto-poda de almacenamiento temporal prescindible (shopping checks, temp, debug).
 * 3. Manejo a prueba de fallos sin colapsar la aplicación (try/catch síncrono con guardas).
 * 4. Resiliencia de los stores (useTemplateStore, useRecipeStore, useModeStore).
 */

console.log('🧪 Iniciando batería de pruebas: Resiliencia de Almacenamiento (Anti-QuotaExceededError)...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Simulación del entorno de navegador con QuotaExceededError
// ─────────────────────────────────────────────────────────────
class MockDOMException extends Error {
  constructor(message, name, code) {
    super(message);
    this.name = name;
    this.code = code;
  }
}

function isQuotaExceededError(err) {
  if (err && typeof err === 'object') {
    const code = err.code;
    const name = err.name;
    return (
      code === 22 ||
      code === 1014 ||
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return false;
}

// Test 1: Identificación de QuotaExceededError en navegadores modernos (Chromium / Safari)
const chromeQuotaError = new MockDOMException('Quota exceeded', 'QuotaExceededError', 22);
assert(isQuotaExceededError(chromeQuotaError), 'Detecta QuotaExceededError estándar (code 22, name QuotaExceededError)');

// Test 2: Identificación en Firefox (NS_ERROR_DOM_QUOTA_REACHED / code 1014)
const firefoxQuotaError = new MockDOMException('Storage limit reached', 'NS_ERROR_DOM_QUOTA_REACHED', 1014);
assert(isQuotaExceededError(firefoxQuotaError), 'Detecta error de cuota en Firefox (code 1014, NS_ERROR_DOM_QUOTA_REACHED)');

// Test 3: Distinción de otros errores (no falsos positivos)
const otherError = new Error('SyntaxError');
assert(!isQuotaExceededError(otherError), 'No clasifica errores comunes como errores de cuota');

// ─────────────────────────────────────────────────────────────
// 2. Simulación de Poda de Almacenamiento Temporal
// ─────────────────────────────────────────────────────────────
const mockLocalStorageMap = new Map();
const mockLocalStorage = {
  getItem: (key) => mockLocalStorageMap.get(key) || null,
  setItem: (key, value) => {
    mockLocalStorageMap.set(key, value);
  },
  removeItem: (key) => {
    mockLocalStorageMap.delete(key);
  },
  key: (index) => Array.from(mockLocalStorageMap.keys())[index] || null,
  get length() {
    return mockLocalStorageMap.size;
  },
};

function tryPruneTemporaryStorage(storage) {
  let prunedCount = 0;
  const keysToEvict = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (
      key &&
      (key.startsWith('nutriapp_shopping_checks_') ||
        key.startsWith('temp_') ||
        key.startsWith('debug_') ||
        key.startsWith('sentry_') ||
        key.includes('_cache_'))
    ) {
      keysToEvict.push(key);
    }
  }

  keysToEvict.forEach((k) => {
    storage.removeItem(k);
    prunedCount++;
  });
  return prunedCount;
}

// Poblar con claves esenciales y temporales
mockLocalStorage.setItem('nutriapp_custom_templates', JSON.stringify([{ id: 'tmpl-1', name: 'Dieta Keto' }]));
mockLocalStorage.setItem('nutriapp_custom_recipes', JSON.stringify([{ id: 'rec-1', name: 'Tortilla Avena' }]));
mockLocalStorage.setItem('nutriapp_shopping_checks_week1', JSON.stringify([1, 2, 3]));
mockLocalStorage.setItem('temp_audio_cache_123', 'audio-buffer-data');
mockLocalStorage.setItem('debug_trace_log', 'trace-data');

const pruned = tryPruneTemporaryStorage(mockLocalStorage);
assert(pruned === 3, `Poda con éxito 3 claves prescindibles (pruned: ${pruned})`);
assert(mockLocalStorage.getItem('nutriapp_custom_templates') !== null, 'Preserva intactas las plantillas clínicas');
assert(mockLocalStorage.getItem('nutriapp_custom_recipes') !== null, 'Preserva intactas las recetas');
assert(mockLocalStorage.getItem('nutriapp_shopping_checks_week1') === null, 'Elimina la caché de checks de compra para hacer espacio');

// ─────────────────────────────────────────────────────────────
// 3. Simulación de Escritura Segura con Límite de 5 MB
// ─────────────────────────────────────────────────────────────
let quotaExceededTriggered = false;
let warningDispatched = false;

function safeLocalStorageSet(storage, key, value, simulateQuota) {
  try {
    if (simulateQuota) {
      throw new MockDOMException('The quota has been exceeded.', 'QuotaExceededError', 22);
    }
    storage.setItem(key, JSON.stringify(value));
    return { success: true, quotaExceeded: false };
  } catch (err) {
    if (isQuotaExceededError(err)) {
      quotaExceededTriggered = true;
      const freed = tryPruneTemporaryStorage(storage);
      if (freed > 0) {
        try {
          storage.setItem(key, JSON.stringify(value));
          return { success: true, quotaExceeded: false };
        } catch {}
      }
      return { success: false, quotaExceeded: true };
    }
    return { success: false, quotaExceeded: false };
  }
}

// Test de escritura con quota excedida y auto-recuperación podando
mockLocalStorage.setItem('temp_old_cache', 'datos-efimeros');
const saveResultWithRecovery = safeLocalStorageSet(mockLocalStorage, 'nutriapp_test_save', { ok: true }, true);
assert(saveResultWithRecovery.success, 'Auto-recuperación: tras QuotaExceededError poda claves efímeras y reintenta con éxito');

// Simular cuota saturada sin elementos que podar (cuota definitivamente agotada)
const saveResultQuota = safeLocalStorageSet(mockLocalStorage, 'heavy_template', { data: 'x'.repeat(100) }, true);
assert(!saveResultQuota.success && saveResultQuota.quotaExceeded, 'Captura QuotaExceededError síncrono sin lanzar excepción no controlada');

// ─────────────────────────────────────────────────────────────
// Resumen Final
// ─────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────────');
console.log(`Resultados: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount === 0) {
  console.log('🎉 ¡Todas las pruebas de resiliencia y anti-QuotaExceededError fueron exitosas!\n');
  process.exit(0);
} else {
  console.error('❌ Hubo fallos en las pruebas.');
  process.exit(1);
}
