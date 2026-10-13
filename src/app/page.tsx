import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';

export const metadata = {
  title: 'NutriApp | Plataforma de Nutrición',
  description: 'Plataforma web interna para nutricionistas.',
};

export default function Home() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
