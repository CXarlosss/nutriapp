import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type {
  PreConsultationFormData,
  ClientOnboardingProfile,
} from '@/types/diet';
import { enqueueOutboxEvent } from '@/lib/outbox/outboxService';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO EN MEMORIA SINCRONIZADO (Para desarrollo local y tests sin red)
// ─────────────────────────────────────────────────────────────────────────────

const memoryOnboardingStore = new Map<string, ClientOnboardingProfile>();

// Sembrado inicial de clientes para pruebas locales inmediatas
memoryOnboardingStore.set('token_carlos_gomez_2026', {
  id: 'a0000000-0000-0000-0000-000000000001',
  fullName: 'Carlos Gómez Pardo',
  email: 'carlos.paciente@example.com',
  phone: '+34 600 11 22 33',
  planName: 'Plan Recomposición Corporal',
  onboardingToken: 'token_carlos_gomez_2026',
  onboardingStatus: 'completed',
  intakeCompletedAt: '2026-09-25T10:00:00.000Z',
  formData: {
    fullName: 'Carlos Gómez Pardo',
    email: 'carlos.paciente@example.com',
    phone: '+34 600 11 22 33',
    birthDate: '1992-04-12',
    age: 34,
    heightCm: 178,
    currentWeightKg: 76.4,
    goal: 'Recomposición corporal y aumento de masa muscular limpia',
    dietaryPreference: 'omnivoro',
    allergies: ['Gluten', 'Lactosa'],
    pathologies: ['Hipotiroidismo de Hashimoto'],
    foodAversions: ['Brócoli crudo', 'Vísceras', 'Pescado blanco hervido'],
    dailyRoutine: {
      wakeUpTime: '07:15',
      bedTime: '23:30',
      workType: 'Ingeniero de Software (Trabajo sentado)',
      mealsCount: 4,
      trainingSchedule: 'Fuerza e hipertrofia 4 días a las 18:30',
      stressLevel: 'Medio',
      waterLitersDaily: 2.5,
    },
    digestiveBaseline: {
      habitualBristol: 4,
      bloatingFrequency: 'Ocasional tras comidas copiosas',
      acidReflux: false,
      digestionNotes: 'Se siente mucho más ligero cuando separa la levotiroxina de los desayunos densos.',
    },
    medications: [
      {
        drugName: 'Levotiroxina',
        dosage: '75 mcg',
        timingSlot: 'desayuno',
        indication: 'Hipotiroidismo autoinmune',
      },
    ],
    generalNotes: 'Muy motivado con el plan. Prioriza recetas rápidas para los días de oficina.',
  },
});

memoryOnboardingStore.set('token_javier_navarro_2026', {
  id: 'c4',
  fullName: 'Javier Navarro Soler',
  email: 'javier.navarro@example.com',
  phone: '+34 622 44 55 66',
  planName: 'Salud Intestinal',
  onboardingToken: 'token_javier_navarro_2026',
  onboardingStatus: 'pending',
  formData: {
    fullName: 'Javier Navarro Soler',
    email: 'javier.navarro@example.com',
    phone: '+34 622 44 55 66',
    heightCm: 181,
    currentWeightKg: 82.0,
    goal: 'Reducción de distensión abdominal y tránsito regular',
    dietaryPreference: 'omnivoro',
    allergies: ['Fructosa'],
    pathologies: ['Síndrome de Intestino Irritable (SII)'],
    foodAversions: ['Legumbres enteras', 'Cebolla cruda'],
    dailyRoutine: {
      wakeUpTime: '08:00',
      bedTime: '00:00',
      workType: 'Comercial (Turnos activos)',
      mealsCount: 3,
      trainingSchedule: 'Pádel 2 días a la semana',
      stressLevel: 'Alto',
      waterLitersDaily: 1.8,
    },
    digestiveBaseline: {
      habitualBristol: 2,
      bloatingFrequency: 'Frecuente por las tardes',
      acidReflux: true,
      digestionNotes: 'Molestias habituales tras comer fuera de casa.',
    },
    medications: [],
  },
});

memoryOnboardingStore.set('token_marta_morales_2026', {
  id: 'c1',
  fullName: 'Marta Morales Sánchez',
  email: 'marta.morales@example.com',
  phone: '+34 611 77 88 99',
  planName: 'Plan Definición 8S',
  onboardingToken: 'token_marta_morales_2026',
  onboardingStatus: 'completed',
  intakeCompletedAt: '2026-10-01T11:00:00.000Z',
  formData: {
    fullName: 'Marta Morales Sánchez',
    email: 'marta.morales@example.com',
    phone: '+34 611 77 88 99',
    heightCm: 165,
    currentWeightKg: 61.5,
    goal: 'Definición muscular para competición amateur',
    dietaryPreference: 'omnivoro',
    allergies: ['Frutos secos'],
    pathologies: ['Resistencia a la Insulina'],
    foodAversions: ['Carne roja grasa', 'Cilantro'],
    dailyRoutine: {
      wakeUpTime: '06:45',
      bedTime: '22:45',
      workType: 'Docente (Activa de pie)',
      mealsCount: 4,
      trainingSchedule: 'CrossFit 3 días / Pilates 2 días a las 08:00',
      stressLevel: 'Medio',
      waterLitersDaily: 2.2,
    },
    digestiveBaseline: {
      habitualBristol: 4,
      bloatingFrequency: 'Baja',
      acidReflux: false,
    },
    medications: [
      {
        drugName: 'Metformina',
        dosage: '850 mg',
        timingSlot: 'cena',
        indication: 'Resistencia a la insulina',
      },
    ],
  },
});

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIOS PÚBLICOS DEL ONBOARDING PRE-CONSULTA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil del cliente a partir de su token único de pre-consulta.
 * Usado por la pantalla pública del paciente /pre-consulta/[token].
 */
export async function getClientByOnboardingToken(
  token: string
): Promise<ClientOnboardingProfile | null> {
  // 1. Revisar memoria local primero
  if (memoryOnboardingStore.has(token)) {
    return memoryOnboardingStore.get(token)!;
  }

  // 2. Consultar Supabase
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('onboarding_token', token)
        .maybeSingle();

      if (!error && data) {
        const profile: ClientOnboardingProfile = {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
          onboardingToken: data.onboarding_token,
          onboardingStatus: data.onboarding_status || 'pending',
          intakeCompletedAt: data.intake_completed_at,
          formData: {
            fullName: data.full_name,
            email: data.email,
            phone: data.phone || '',
            heightCm: Number(data.height_cm) || 170,
            currentWeightKg: Number(data.current_weight_kg) || 70,
            goal: data.goal || 'Salud general',
            dietaryPreference: (data.dietary_preference as any) || 'omnivoro',
            allergies: data.allergies || [],
            pathologies: data.pathologies || [],
            foodAversions: data.food_aversions || [],
            dailyRoutine: data.daily_routine || {},
            digestiveBaseline: data.digestive_baseline || {},
            medications: [],
            generalNotes: data.notes || '',
          },
        };
        memoryOnboardingStore.set(token, profile);
        return profile;
      }
    } catch (err) {
      console.warn('[OnboardingService] Error al consultar Supabase:', err);
    }
  }

  return null;
}

/**
 * Persiste los datos introducidos por el paciente en el cuestionario digital:
 * 1. Actualiza PostgreSQL (`clients`) con alergias, patologías, aversiones y rutinas.
 * 2. Encola un evento Outbox 'onboarding.completed' para notificar a n8n.
 * 3. Actualiza el estado a 'completed'.
 */
export async function submitPreConsultationForm(
  token: string,
  formData: PreConsultationFormData
): Promise<{ success: boolean; clientName?: string; error?: string }> {
  const profile = await getClientByOnboardingToken(token);
  if (!profile) {
    return { success: false, error: 'Token de pre-consulta no válido.' };
  }

  const nowIso = new Date().toISOString();

  // 1. Actualizar estado en memoria
  profile.formData = formData;
  profile.onboardingStatus = 'completed';
  profile.intakeCompletedAt = nowIso;
  memoryOnboardingStore.set(token, profile);

  // 2. Actualizar PostgreSQL si está disponible
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.rpc('complete_client_preconsultation', {
        p_token: token,
        p_weight_kg: formData.currentWeightKg,
        p_height_cm: formData.heightCm,
        p_allergies: formData.allergies,
        p_pathologies: formData.pathologies,
        p_food_aversions: formData.foodAversions,
        p_daily_routine: formData.dailyRoutine,
        p_digestive_baseline: formData.digestiveBaseline,
        p_dietary_preference: formData.dietaryPreference,
        p_notes: formData.generalNotes,
      });

      // Insertar medicamentos comunicados en client_medications
      if (formData.medications && formData.medications.length > 0) {
        for (const med of formData.medications) {
          await supabase.from('client_medications').insert({
            client_id: profile.id,
            drug_name: med.drugName,
            dosage: med.dosage,
            timing_slot: med.timingSlot,
            indication: med.indication,
            active: true,
          }).maybeSingle();
        }
      }
    } catch (err) {
      console.warn('[OnboardingService] Error persistiendo en Supabase RPC, guardado en memoria:', err);
    }
  }

  // 3. Encolar evento Outbox para n8n ('onboarding.completed')
  try {
    await enqueueOutboxEvent({
      eventType: 'onboarding.completed',
      aggregateType: 'client',
      aggregateId: profile.id,
      payload: {
        client_id: profile.id,
        client_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        allergies: formData.allergies,
        pathologies: formData.pathologies,
        food_aversions: formData.foodAversions,
        current_weight_kg: formData.currentWeightKg,
        completed_at: nowIso,
        channel: 'n8n_webhook',
      },
      maxAttempts: 5,
    });
  } catch (err) {
    console.warn('[OnboardingService] Error encolando outbox onboarding.completed:', err);
  }

  return {
    success: true,
    clientName: profile.fullName,
  };
}

/**
 * Disparador Automático Post-Pago (Cero Data Entry):
 * En cuanto el paciente realiza el pago en Stripe, se genera su token único
 * y se encola un evento Outbox 'onboarding.invitation_ready' para que n8n
 * le envíe automáticamente el enlace por WhatsApp / Email.
 */
export async function triggerPostPaymentOnboarding(
  clientId: string,
  clientName: string,
  clientEmail: string,
  clientPhone?: string
): Promise<{ token: string; onboardingUrl: string }> {
  // Buscar si ya tiene token
  let existingToken = '';
  for (const [t, prof] of memoryOnboardingStore.entries()) {
    if (prof.id === clientId) {
      existingToken = t;
      break;
    }
  }

  const token = existingToken || `token_${clientId.replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const onboardingUrl = `${appBaseUrl}/pre-consulta/${token}`;

  // Registrar en memoria si es nuevo
  if (!existingToken) {
    memoryOnboardingStore.set(token, {
      id: clientId,
      fullName: clientName,
      email: clientEmail,
      phone: clientPhone,
      onboardingToken: token,
      onboardingStatus: 'pending',
      formData: {
        fullName: clientName,
        email: clientEmail,
        phone: clientPhone || '',
        heightCm: 175,
        currentWeightKg: 75,
        goal: 'Revisión y plan nutricional',
        dietaryPreference: 'omnivoro',
        allergies: [],
        pathologies: [],
        foodAversions: [],
        dailyRoutine: {},
        digestiveBaseline: {},
        medications: [],
      },
    });
  }

  // Encolar evento en Outbox para despacho a n8n
  await enqueueOutboxEvent({
    eventType: 'onboarding.invitation_ready',
    aggregateType: 'client',
    aggregateId: clientId,
    payload: {
      client_id: clientId,
      client_name: clientName,
      email: clientEmail,
      phone: clientPhone,
      onboarding_token: token,
      onboarding_url: onboardingUrl,
      whatsapp_message: `¡Hola ${clientName}! Tu pago ha sido confirmado. Para preparar tu primera consulta personalizada y no perder tiempo tecleando datos en la visita, rellena tu formulario digital aquí (3 minutos): ${onboardingUrl}`,
      email_subject: `NutriApp: Cuestionario Pre-Consulta para ${clientName}`,
      channel: 'whatsapp_and_email',
    },
    maxAttempts: 5,
  });

  return { token, onboardingUrl };
}

/**
 * Consulta la anamnesis pre-consulta estructurada de un cliente para la ficha médica.
 */
export async function getClientOnboardingData(
  clientId: string
): Promise<ClientOnboardingProfile | null> {
  // Buscar por clientId
  for (const profile of memoryOnboardingStore.values()) {
    if (profile.id === clientId || profile.id.startsWith(clientId)) {
      return profile;
    }
  }

  // Fallback para Carlos Gómez Pardo ('client-1' o UUID)
  if (clientId === 'client-1' || clientId === 'c2' || clientId.includes('000000000001')) {
    return memoryOnboardingStore.get('token_carlos_gomez_2026') || null;
  }

  // Fallback para Javier Navarro ('c4')
  if (clientId === 'c4') {
    return memoryOnboardingStore.get('token_javier_navarro_2026') || null;
  }

  // Fallback para Marta Morales ('c1')
  if (clientId === 'c1') {
    return memoryOnboardingStore.get('token_marta_morales_2026') || null;
  }

  return null;
}
