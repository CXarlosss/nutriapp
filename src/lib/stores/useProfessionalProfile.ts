'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorageGet, resilientSave } from '@/lib/storage/resilientStorage';

export interface ProfessionalProfile {
  fullName: string;
  licenseNumber: string;
  email: string;
  timezone: string;
  sessionDuration: string;
  bufferMargin: string;
}

export const STORAGE_KEY_PROFESSIONAL = 'nutriapp_professional_settings';

export const DEFAULT_PROFESSIONAL_PROFILE: ProfessionalProfile = {
  fullName: 'Elena Pérez',
  licenseNumber: 'AND-00482',
  email: 'elenap.nutricionista@gmail.com',
  timezone: 'Europe/Madrid (UTC+2)',
  sessionDuration: '45 minutos',
  bufferMargin: '15 minutos entre citas',
};

/**
 * Obtiene el perfil actual de forma segura para SSR y cliente.
 */
export function getProfessionalProfile(): ProfessionalProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_PROFESSIONAL_PROFILE;
  }
  const saved = safeLocalStorageGet<Partial<ProfessionalProfile>>(
    STORAGE_KEY_PROFESSIONAL,
    DEFAULT_PROFESSIONAL_PROFILE
  );
  return {
    ...DEFAULT_PROFESSIONAL_PROFILE,
    ...saved,
  };
}

/**
 * Guarda el perfil en almacenamiento resiliente (localStorage + IndexedDB)
 * y emite un evento global para actualizar toda la interfaz en tiempo real.
 */
export async function saveProfessionalProfile(profile: ProfessionalProfile): Promise<boolean> {
  const result = await resilientSave(STORAGE_KEY_PROFESSIONAL, profile);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nutriapp:professional-settings-updated', {
        detail: profile,
      })
    );
  }
  return result.success;
}

/**
 * Hook reactivo para sincronizar el perfil en cualquier componente (AppShell, Dashboard, Settings, etc.).
 */
export function useProfessionalProfile() {
  const [profile, setProfile] = useState<ProfessionalProfile>(DEFAULT_PROFESSIONAL_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Cargar estado inicial
    setProfile(getProfessionalProfile());
    setIsLoaded(true);

    // 2. Escuchar cambios entre pestañas o desde la página de Ajustes
    const handleUpdate = (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        setProfile((prev) => ({ ...prev, ...e.detail }));
      } else {
        setProfile(getProfessionalProfile());
      }
    };

    window.addEventListener('nutriapp:professional-settings-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nutriapp:professional-settings-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = useCallback(async (newProfile: ProfessionalProfile) => {
    setProfile(newProfile);
    return await saveProfessionalProfile(newProfile);
  }, []);

  // Iniciales del avatar (ej. "Elena Pérez" -> "EP", "Elena" -> "E")
  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EP';

  // Primer nombre para saludos (ej. "Elena")
  const firstName = profile.fullName.trim().split(/\s+/)[0] || 'Elena';

  return {
    profile,
    updateProfile,
    initials,
    firstName,
    isLoaded,
  };
}
