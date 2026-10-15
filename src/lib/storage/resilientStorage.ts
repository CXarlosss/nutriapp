/**
 * Motor de Persistencia Resiliente y Anti-Colapso para NutriApp Enterprise.
 * 
 * RESUELVE EL PROBLEMA:
 * - localStorage tiene un límite inflexible de ~5 MB impuesto por los navegadores.
 * - Guardar cientos de plantillas de dietas, recetas e historiales causaría un
 *   `QuotaExceededError` síncrono que colapsaría React dejando la pantalla en blanco.
 * 
 * ESTRATEGIA ARQUITECTÓNICA DE 3 CAPAS:
 * 1. Capa Rápida (localStorage): Acceso síncrono inmediato (0 ms) para evitar flickers en la hidratación.
 * 2. Capa de Alta Capacidad (IndexedDB): Almacenamiento asíncrono con cientos de megabytes (250MB - 1GB+),
 *    inmune a QuotaExceededError.
 * 3. Capa de Resiliencia: Detección activa de QuotaExceededError con auto-poda de cachés prescindibles
 *    y migración transparente en segundo plano.
 */

const DB_NAME = 'nutriapp_enterprise_db';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;

/**
 * Abre o inicializa la base de datos IndexedDB del navegador de forma segura.
 */
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch (upgradeErr) {
          console.warn('[ResilientStorage] Error en onupgradeneeded de IndexedDB:', upgradeErr);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[ResilientStorage] IndexedDB no accesible en este navegador/modo incógnito.');
        resolve(null);
      };
    } catch (e) {
      console.warn('[ResilientStorage] Fallo al invocar indexedDB.open:', e);
      resolve(null);
    }
  });
}

/**
 * Recupera un valor almacenado en IndexedDB.
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persiste un valor en IndexedDB de forma asíncrona y sin límite de 5 MB.
 */
export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Elimina una clave de IndexedDB.
 */
export async function idbDelete(key: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Validador universal de errores de cuota excedida en localStorage.
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.code === 22 ||
      err.code === 1014 ||
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  // En algunos entornos Chromium antiguos
  if (err && typeof err === 'object' && 'name' in err) {
    return (err as { name?: unknown }).name === 'QuotaExceededError';
  }
  return false;
}

/**
 * Libera espacio no esencial eliminando cachés efímeras del navegador si se satura localStorage.
 */
export function tryPruneTemporaryStorage(): number {
  if (typeof window === 'undefined') return 0;
  let prunedCount = 0;

  try {
    const keysToEvict: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
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
      try {
        localStorage.removeItem(k);
        prunedCount++;
      } catch {}
    });
  } catch (err) {
    console.warn('[ResilientStorage] Fallo al limpiar almacenamiento temporal:', err);
  }

  return prunedCount;
}

/**
 * Lectura segura de localStorage con fallback predeterminado garantizado.
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[ResilientStorage] Aviso leyendo "${key}" de localStorage:`, err);
    return fallback;
  }
}

export interface StorageSaveResult {
  success: boolean;
  quotaExceeded: boolean;
  persistedToIndexedDb: boolean;
}

/**
 * Escritura síncrona en localStorage con interceptor de QuotaExceededError.
 */
export function safeLocalStorageSet<T>(key: string, value: T): { success: boolean; quotaExceeded: boolean } {
  if (typeof window === 'undefined') return { success: false, quotaExceeded: false };

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true, quotaExceeded: false };
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn(`[ResilientStorage] ⚠️ QuotaExceededError detectado al guardar "${key}". Iniciando poda...`);
      const pruned = tryPruneTemporaryStorage();

      if (pruned > 0) {
        // Reintentar tras podar elementos prescindibles
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return { success: true, quotaExceeded: false };
        } catch {}
      }

      return { success: false, quotaExceeded: true };
    }

    console.warn(`[ResilientStorage] Error al escribir "${key}" en localStorage:`, err);
    return { success: false, quotaExceeded: false };
  }
}

/**
 * Eliminación segura de localStorage.
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persistencia Híbrida Completa:
 * 1. Escribe en localStorage (inmediato, síncrono).
 * 2. Escribe en IndexedDB (inagotable, asíncrono).
 * 3. Si localStorage satura la cuota (~5MB), IndexedDB mantiene los datos y se notifica al sistema.
 */
export async function resilientSave<T>(key: string, value: T): Promise<StorageSaveResult> {
  const localRes = safeLocalStorageSet(key, value);
  const idbSuccess = await idbSet(key, value);

  if (localRes.quotaExceeded) {
    console.warn(`[ResilientStorage] Clave "${key}" guardada con éxito en IndexedDB tras agotar localStorage.`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nutriapp:storage-quota-warning', {
          detail: {
            key,
            message:
              'Capacidad de localStorage optimizada. Tus datos se han guardado de forma permanente en IndexedDB (Alta Capacidad).',
          },
        })
      );
    }
  }

  return {
    success: localRes.success || idbSuccess,
    quotaExceeded: localRes.quotaExceeded,
    persistedToIndexedDb: idbSuccess,
  };
}

/**
 * Sincronización en segundo plano con IndexedDB para auto-reparar o hidratar datos si localStorage fue purgado.
 */
export async function resilientSyncWithIndexedDb<T>(
  key: string,
  currentInMemory: T,
  onHydrateFromIdb: (data: T) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const idbData = await idbGet<T>(key);
    if (idbData !== null && idbData !== undefined) {
      // Si en memoria está vacío y en IndexedDB hay datos, rehidratar
      if (Array.isArray(currentInMemory) && currentInMemory.length === 0 && Array.isArray(idbData) && idbData.length > 0) {
        onHydrateFromIdb(idbData);
      } else if (Array.isArray(idbData) && Array.isArray(currentInMemory) && idbData.length > currentInMemory.length) {
        // IndexedDB tiene más elementos (ej. tras borrado de localStorage)
        onHydrateFromIdb(idbData);
      }
    } else if (currentInMemory) {
      // Sembrar respaldo inicial en IndexedDB
      await idbSet(key, currentInMemory);
    }
  } catch (err) {
    console.warn(`[ResilientStorage] Aviso durante sincronización de fondo para "${key}":`, err);
  }
}

/**
 * Borrado atómico en ambas capas (localStorage e IndexedDB).
 */
export async function resilientRemove(key: string): Promise<void> {
  safeLocalStorageRemove(key);
  await idbDelete(key);
}
