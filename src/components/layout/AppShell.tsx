'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLeaf,
  IconLayoutDashboard,
  IconUsers,
  IconCalendar,
  IconTable,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconX,
  IconDatabase,
} from '@tabler/icons-react';
import { Avatar } from '@/components/ui/nutri-ui';
import { ModeToggle, DemoNoticeBanner } from './ModeToggle';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: IconUsers },
  { href: '/appointments', label: 'Citas', icon: IconCalendar },
  { href: '/templates', label: 'Plantillas', icon: IconTable },
  { href: '/settings', label: 'Ajustes', icon: IconSettings },
];

function NavLinks() {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="mt-[24px] flex flex-col gap-[4px]">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`h-[36px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] transition-colors select-none ${
              active
                ? 'bg-[rgba(0,0,0,0.06)] text-[var(--text)] font-[500]'
                : 'text-[var(--text-secondary)] font-[400] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
            }`}
            title={item.label}
          >
            <Icon size={18} className="shrink-0" stroke={1.5} />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks() {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--card)] border-t border-[var(--border)] flex items-center justify-around px-2 z-40">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-[8px] transition-colors ${
              active ? 'text-[var(--brand-solid)] font-[500]' : 'text-[var(--text-secondary)] font-[400]'
            }`}
          >
            <Icon size={20} stroke={1.5} />
            <span className="text-[11px] leading-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleQuotaWarning = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setQuotaWarning(
        customEvent.detail?.message ||
          'Capacidad de almacenamiento local ampliada: tus datos se han respaldado en la base de datos de alta capacidad (IndexedDB).'
      );
      setTimeout(() => setQuotaWarning(null), 8000);
    };

    window.addEventListener('nutriapp:storage-quota-warning', handleQuotaWarning);
    return () => {
      window.removeEventListener('nutriapp:storage-quota-warning', handleQuotaWarning);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[var(--bg)] font-sans antialiased text-[var(--text)]">
      {/* ─────────────────────────────────────────────────────────────
          BARRA SUPERIOR MÓVIL (< 768px) CON LOGO Y BOTÓN HAMBURGUESA (☰)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden h-[54px] bg-[var(--card)] border-b border-[var(--border)] px-4 flex items-center justify-between shrink-0 z-30 select-none">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <IconLeaf size={20} className="text-[var(--brand-solid)]" stroke={1.75} />
          <span className="text-[16px] font-[600] text-[var(--text)] tracking-tight">
            NutriApp
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Botón de Hamburguesa */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 rounded-[8px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer border border-[var(--border)]"
            aria-label="Abrir menú"
            title="Abrir menú de navegación"
          >
            <IconMenu2 size={20} stroke={1.75} />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          DRAWER / MENÚ DESPLEGABLE OFF-CANVAS EN MÓVIL (< 768px)
          ───────────────────────────────────────────────────────────── */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Fondo oscuro con desenfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Panel deslizante lateral */}
          <div className="relative w-[280px] max-w-[80vw] bg-[var(--card)] border-r border-[var(--border)] h-full flex flex-col justify-between p-5 z-50 shadow-2xl animate-scaleUp">
            <div>
              {/* Cabecera del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center gap-2"
                >
                  <IconLeaf size={22} className="text-[var(--brand-solid)]" stroke={1.75} />
                  <span className="text-[17px] font-[700] text-[var(--text)] tracking-tight">
                    NutriApp
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Selector de modo en drawer */}
              <div className="mt-4">
                <ModeToggle />
              </div>

              {/* Enlaces de Navegación */}
              <nav className="mt-6 flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard' || pathname === '/'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`h-[42px] px-3 rounded-[10px] flex items-center gap-3 text-[14px] transition-colors select-none ${
                        active
                          ? 'bg-[var(--brand-bg)] text-[var(--brand-solid)] font-[600]'
                          : 'text-[var(--text-secondary)] font-[400] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Icon size={20} className="shrink-0" stroke={1.75} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Perfil en el pie del Drawer */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar initials="LN" size={36} />
                <div className="min-w-0">
                  <div className="text-[13px] font-[600] text-[var(--text)] truncate leading-tight">
                    Laura Nutricionista
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    laura@nutriapp.es
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
                aria-label="Cerrar sesión"
              >
                <IconLogout size={18} stroke={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BARRA LATERAL FIJA (Escritorio >= 1024px: 232px | Tablet >= 768px: 64px)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col justify-between shrink-0 h-full bg-[var(--card)] border-r border-[var(--border)] transition-all md:w-[64px] lg:w-[232px] p-[16px_12px] z-30">
        <div>
          {/* Logotipo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-[10px] px-[8px] py-[4px] rounded-[8px] hover:opacity-90 select-none"
          >
            <IconLeaf size={20} className="text-[var(--brand-solid)] shrink-0" stroke={1.5} />
            <span className="text-[15px] font-[500] text-[var(--text)] tracking-tight hidden lg:inline">
              NutriApp
            </span>
          </Link>

          {/* Selector de Modo: Consulta Real vs Demo */}
          <div className="mt-3 hidden lg:block">
            <ModeToggle />
          </div>

          {/* Navegación en columna protegida con Suspense */}
          <Suspense fallback={<div className="mt-[24px] h-[180px]" />}>
            <NavLinks />
          </Suspense>
        </div>

        {/* Anclado abajo: Perfil Nutricionista + Cerrar sesión */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar initials="LN" size={32} />
            <div className="hidden lg:block min-w-0">
              <div className="text-[13px] font-[500] text-[var(--text)] truncate leading-none mb-1">
                Laura Nutricionista
              </div>
              <div className="text-[12px] text-[var(--text-muted)] truncate leading-none">
                laura@nutriapp.es
              </div>
            </div>
          </div>

          <button
            type="button"
            className="h-8 w-8 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-subtle)] transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <IconLogout size={18} stroke={1.5} />
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          ÁREA DE CONTENIDO (Scroll vertical independiente)
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto pb-20 md:pb-0">
        <div className="p-[16px_12px] sm:p-[24px_32px] max-w-[1200px] mx-auto min-h-full">
          {/* Banner informativo de modo demostración */}
          <DemoNoticeBanner />

          {children}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          BARRA INFERIOR FIJA MÓVIL (< 768px)
          ───────────────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <MobileNavLinks />
      </Suspense>

      {/* ─────────────────────────────────────────────────────────────
          TOAST RESILIENTE DE ALMACENAMIENTO DE ALTA CAPACIDAD (INDEXEDDB)
          ───────────────────────────────────────────────────────────── */}
      {quotaWarning && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-md bg-[var(--card)] border border-emerald-500/40 text-[var(--text)] px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-scaleUp"
        >
          <div className="shrink-0 mt-0.5 p-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconDatabase size={18} stroke={1.75} />
          </div>
          <div className="text-[13px] leading-snug font-[400] text-[var(--text-secondary)]">
            <span className="font-[600] text-[var(--text)] block mb-0.5">Almacenamiento Ampliado</span>
            {quotaWarning}
          </div>
          <button
            type="button"
            onClick={() => setQuotaWarning(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] ml-auto shrink-0 text-sm font-semibold cursor-pointer p-0.5"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
