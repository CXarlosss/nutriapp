'use client';

import React, { Suspense } from 'react';
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
} from '@tabler/icons-react';
import { Avatar } from '@/components/ui/nutri-ui';

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
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--bg)] font-sans antialiased text-[var(--text)]">
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
        <div className="p-[20px_16px] sm:p-[24px_32px] max-w-[1200px] mx-auto min-h-full">
          {children}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          BARRA INFERIOR FIJA MÓVIL (< 768px)
          ───────────────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <MobileNavLinks />
      </Suspense>
    </div>
  );
}
