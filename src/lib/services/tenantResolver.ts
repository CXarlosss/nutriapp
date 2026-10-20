import { createClient } from '@/lib/supabase/server';
import { DEMO_CLINIC_UUID, isValidUUID } from '@/lib/utils/uuid';

/**
 * Resuelve el identificador de clínica (clinic_id) para el contexto actual:
 * 
 * 1. Si se proporciona un clinic_id explícito válido, se utiliza directamente.
 * 2. Si hay un usuario autenticado en sesión, se extrae de su JWT claims o perfil en la BD.
 * 3. Si no hay sesión activa (procesos asíncronos en segundo plano, webhooks de Stripe/n8n, 
 *    o acciones públicas de reserva/pre-consulta), devuelve la clínica principal del sistema.
 */
export async function resolveCurrentClinicId(explicitClinicId?: string | null): Promise<string> {
  if (explicitClinicId && isValidUUID(explicitClinicId)) {
    return explicitClinicId;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Claims del JWT
      const claimClinicId = user.app_metadata?.clinic_id || user.user_metadata?.clinic_id;
      if (claimClinicId && isValidUUID(claimClinicId)) {
        return claimClinicId;
      }

      // 2. Consulta en user_profiles
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.clinic_id && isValidUUID(userProfile.clinic_id)) {
        return userProfile.clinic_id;
      }

      // 3. Fallback a profiles legacy
      const { data: legacyProfile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .maybeSingle();

      if (legacyProfile?.clinic_id && isValidUUID(legacyProfile.clinic_id)) {
        return legacyProfile.clinic_id;
      }
    }
  } catch (err) {
    // En caso de fallo de red o SSR sin credenciales completas, continuar al fallback
  }

  return DEMO_CLINIC_UUID;
}
