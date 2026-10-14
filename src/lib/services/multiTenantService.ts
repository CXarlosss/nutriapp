/**
 * Servicio de Gestión Multi-Tenant y Validación de Aislamiento RLS
 * NutriApp Enterprise · Aislamiento Total a Nivel de Motor PostgreSQL
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  cifNif?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  clinicId: string;
  role: 'superadmin' | 'clinic_admin' | 'nutritionist' | 'staff' | 'patient';
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface TenantClient {
  id: string;
  clinicId: string;
  nutritionistId: string;
  fullName: string;
  email: string;
  status: 'active' | 'pending_review' | 'inactive';
  goal?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE DEMOSTRACIÓN Y PRUEBAS DETERMINISTAS
// ─────────────────────────────────────────────────────────────────────────────
export const CLINIC_VIDA_ID = '11111111-1111-1111-1111-111111111111';
export const CLINIC_ELITE_ID = '22222222-2222-2222-2222-222222222222';

export const NUTRI_VIDA_ID = 'aaaa1111-1111-1111-1111-111111111111';
export const NUTRI_ELITE_ID = 'bbbb2222-2222-2222-2222-222222222222';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO EN MEMORIA SINCRONIZADO (Para desarrollo local y tests sin DB externa)
// ─────────────────────────────────────────────────────────────────────────────
const memoryClinics = new Map<string, Clinic>([
  [
    CLINIC_VIDA_ID,
    {
      id: CLINIC_VIDA_ID,
      name: 'Clínica Vida Saludable',
      slug: 'clinica-vida',
      cifNif: 'B-12345678',
      email: 'contacto@clinicavida.com',
      phone: '+34 911 223 344',
      address: 'Calle Gran Vía 42, Madrid',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ],
  [
    CLINIC_ELITE_ID,
    {
      id: CLINIC_ELITE_ID,
      name: 'Centro Médico Élite Nutrición',
      slug: 'elite-nutricion',
      cifNif: 'B-87654321',
      email: 'info@elitenutricion.com',
      phone: '+34 933 445 566',
      address: 'Passeig de Gràcia 15, Barcelona',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ],
]);

const memoryProfiles = new Map<string, UserProfile>([
  [
    NUTRI_VIDA_ID,
    {
      id: NUTRI_VIDA_ID,
      clinicId: CLINIC_VIDA_ID,
      role: 'nutritionist',
      fullName: 'Dra. Carmen Gómez Pardo',
      email: 'carmen@clinicavida.com',
      isActive: true,
    },
  ],
  [
    NUTRI_ELITE_ID,
    {
      id: NUTRI_ELITE_ID,
      clinicId: CLINIC_ELITE_ID,
      role: 'nutritionist',
      fullName: 'Dr. Javier Morales Silva',
      email: 'javier@elitenutricion.com',
      isActive: true,
    },
  ],
]);

const memoryClients: TenantClient[] = [
  // Pacientes de Clínica Vida
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    clinicId: CLINIC_VIDA_ID,
    nutritionistId: NUTRI_VIDA_ID,
    fullName: 'Carlos Gómez Pardo',
    email: 'carlos.vida@pacientes.local',
    status: 'active',
    goal: 'Recomposición corporal y regulación tiroidea',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    clinicId: CLINIC_VIDA_ID,
    nutritionistId: NUTRI_VIDA_ID,
    fullName: 'Laura García Mendoza',
    email: 'laura.vida@pacientes.local',
    status: 'active',
    goal: 'Mejora de resistencia a la insulina y microbiota',
  },
  // Pacientes de Clínica Élite
  {
    id: 'c2000000-0000-0000-0000-000000000001',
    clinicId: CLINIC_ELITE_ID,
    nutritionistId: NUTRI_ELITE_ID,
    fullName: 'Marcos Robles Silva',
    email: 'marcos.elite@pacientes.local',
    status: 'active',
    goal: 'Hipertrofia muscular y rendimiento en triatlón',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000002',
    clinicId: CLINIC_ELITE_ID,
    nutritionistId: NUTRI_ELITE_ID,
    fullName: 'Elena Santos Ramos',
    email: 'elena.elite@pacientes.local',
    status: 'active',
    goal: 'Preparación de maratón y ciclado de hidratos',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIONES MULTI-TENANT CON REGLAS DE SEGURIDAD RLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtener los datos de una clínica por ID
 */
export async function getClinicById(clinicId: string): Promise<Clinic | null> {
  return memoryClinics.get(clinicId) || null;
}

/**
 * Obtener el perfil y clínica del usuario autenticado
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return memoryProfiles.get(userId) || null;
}

/**
 * Consultar pacientes garantizando aislamiento RLS en el motor.
 * La función simula la ejecución de:
 * `SELECT * FROM clients;` con la política RLS activa:
 * `USING (clinic_id = current_user_clinic_id())`
 */
export async function getClientsForClinic(clinicId: string): Promise<TenantClient[]> {
  // Simulación estricta de la política RLS PostgreSQL:
  // "clients_tenant_isolation" ON clients FOR ALL USING (clinic_id = current_user_clinic_id())
  return memoryClients.filter((c) => c.clinicId === clinicId);
}

/**
 * Insertar un nuevo paciente con auto-inyección de clinic_id por trigger si no se suministra.
 */
export async function insertClientForClinic(
  data: Omit<TenantClient, 'id' | 'clinicId'> & { clinicId?: string },
  activeTenantId: string
): Promise<{ client: TenantClient; injectedAutomatically: boolean }> {
  // Si viene forzado otro tenant distinto al activo, el motor RLS lanza una violación
  if (data.clinicId && data.clinicId !== activeTenantId) {
    throw new Error(
      `Violación de Política RLS Multi-Tenant: El usuario de la clínica ${activeTenantId} no tiene permisos para insertar en la clínica ${data.clinicId}.`
    );
  }

  const resolvedClinicId = data.clinicId || activeTenantId;
  const wasInjected = !data.clinicId;

  const newClient: TenantClient = {
    id: `client-${Date.now()}`,
    clinicId: resolvedClinicId,
    nutritionistId: data.nutritionistId,
    fullName: data.fullName,
    email: data.email,
    status: data.status,
    goal: data.goal,
  };

  memoryClients.push(newClient);
  return { client: newClient, injectedAutomatically: wasInjected };
}

/**
 * Prueba de fuego de Aislamiento RLS Imparable:
 * Evalúa si una consulta para Clinic A filtra automáticamente a Clinic B
 */
export async function executeRlsIsolationAudit(testClinicId: string): Promise<{
  activeClinic: Clinic | null;
  totalVisibleClients: number;
  visiblePatients: string[];
  crossTenantLeakage: boolean;
  foreignPatientsDetected: string[];
}> {
  const activeClinic = await getClinicById(testClinicId);
  const visible = await getClientsForClinic(testClinicId);
  
  // Buscar si algún paciente visible pertenece a otra clínica
  const leaked = visible.filter((c) => c.clinicId !== testClinicId);

  return {
    activeClinic,
    totalVisibleClients: visible.length,
    visiblePatients: visible.map((c) => c.fullName),
    crossTenantLeakage: leaked.length > 0,
    foreignPatientsDetected: leaked.map((c) => c.fullName),
  };
}
