'use client';

import React from 'react';
import { DietHeader } from '@/components/diet-editor/DietHeader';
import { DietGrid } from '@/components/diet-editor/DietGrid';

export default function DietCreatorPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans">
      {/* Barra superior y resumen del cliente */}
      <DietHeader />

      {/* Contenido principal: Hoja de cálculo limpia */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-4">
        <DietGrid />
      </main>
    </div>
  );
}
