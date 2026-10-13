'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Button, Input } from '@/components/ui/nutri-ui';
import { IconSettings, IconClock, IconBrandGoogleFilled } from '@tabler/icons-react';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn max-w-[800px]">
        <div>
          <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
            Ajustes
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Configuración de consulta, zona horaria y sincronización de calendarios.
          </p>
        </div>

        <Card className="space-y-4">
          <h2 className="text-[14px] font-[500] text-[var(--text)]">Datos profesionales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Nombre completo</label>
              <Input defaultValue="Laura Martínez Castillo" />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Número de colegiada</label>
              <Input defaultValue="AND-00482" />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Email de notificaciones</label>
              <Input defaultValue="laura@nutriapp.es" />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Zona horaria</label>
              <Input defaultValue="Europe/Madrid (UTC+2)" readOnly />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[14px] font-[500] text-[var(--text)]">Duración y franjas de consulta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Duración por sesión</label>
              <Input defaultValue="45 minutos" />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Margen de buffer</label>
              <Input defaultValue="15 minutos entre citas" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button variant="primary">Guardar ajustes</Button>
        </div>
      </div>
    </AppShell>
  );
}
