'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Button, Input } from '@/components/ui/nutri-ui';
import { IconSettings, IconClock, IconBrandGoogleFilled, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';

import {
  ProfessionalProfile,
  DEFAULT_PROFESSIONAL_PROFILE,
  getProfessionalProfile,
  saveProfessionalProfile,
} from '@/lib/stores/useProfessionalProfile';

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProfessionalProfile>(DEFAULT_PROFESSIONAL_PROFILE);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar ajustes guardados del almacenamiento local en el navegador
  useEffect(() => {
    setSettings(getProfessionalProfile());
  }, []);

  const handleChange = (field: keyof ProfessionalProfile, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfessionalProfile(settings);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 3500);
    } catch (e) {
      console.error('Error al guardar ajustes:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn max-w-[800px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
              Ajustes
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Configuración de consulta, zona horaria y sincronización de notificaciones.
            </p>
          </div>

          {isSaved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium animate-fadeIn">
              <IconCheck className="w-4 h-4" />
              <span>Ajustes guardados correctamente</span>
            </div>
          )}
        </div>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <IconSettings className="w-4 h-4 text-[var(--text-secondary)]" />
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Datos profesionales</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Nombre completo</label>
              <Input
                value={settings.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Nombre del facultativo o nutricionista"
              />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Número de colegiada</label>
              <Input
                value={settings.licenseNumber}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                placeholder="Ej. AND-00482"
              />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Email de notificaciones</label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              <span className="text-[11px] text-[var(--text-secondary)] mt-1 block">
                Este correo recibirá los resúmenes clínicos y alertas de pacientes.
              </span>
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Zona horaria</label>
              <Input
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="Europe/Madrid (UTC+2)"
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-[var(--text-secondary)]" />
            <h2 className="text-[14px] font-[500] text-[var(--text)]">Duración y franjas de consulta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Duración por sesión</label>
              <Input
                value={settings.sessionDuration}
                onChange={(e) => handleChange('sessionDuration', e.target.value)}
                placeholder="45 minutos"
              />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Margen de buffer</label>
              <Input
                value={settings.bufferMargin}
                onChange={(e) => handleChange('bufferMargin', e.target.value)}
                placeholder="15 minutos entre citas"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--text-secondary)]">
            {isSaved ? 'Todos los cambios están sincronizados.' : 'Recuerda guardar los cambios.'}
          </span>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <IconDeviceFloppy className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar ajustes'}</span>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
