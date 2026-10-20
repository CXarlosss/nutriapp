/**
 * Utilidades de validación y generación de identificadores estándar UUID v4 (RFC 4122).
 */

// Regex estricto para UUID v4 (o estándar RFC 4122 v1-v5)
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Comprueba si una cadena cumple estrictamente con el formato canónico UUID (36 caracteres con guiones).
 */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Genera un UUID v4 criptográficamente seguro compatible con Node.js y navegadores modernos.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback para entornos donde crypto.randomUUID no esté disponible
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * UUID determinista de fallback para la dieta demo en caso de pruebas locales
 */
export const DEMO_DIET_UUID = 'd0000000-0000-0000-0000-000000000001';
export const DEMO_CLIENT_UUID = 'a0000000-0000-0000-0000-000000000001';
export const DEMO_CLINIC_UUID = '11111111-1111-1111-1111-111111111111';
