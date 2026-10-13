import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';

export const metadata = {
  title: 'Dashboard | NutriApp',
  description: 'Panel de control principal y gestión clínica de pacientes.',
};

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
