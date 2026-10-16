'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IconCalendarHeart,
  IconCalendarCheck,
  IconChefHat,
  IconToolsKitchen2,
  IconSearch,
  IconUsers,
  IconSparkles,
  IconArrowRight,
  IconPlus,
  IconRefresh,
  IconApple,
  IconMoodSmile,
  IconShieldCheck,
} from '@tabler/icons-react';

export type EmptyStatePreset =
  | 'calendar-clean'
  | 'reviews-clean'
  | 'recipe-search-empty'
  | 'food-search-empty'
  | 'clients-empty'
  | 'retention-clean'
  | 'template-search-empty'
  | 'custom';

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  badge?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  actionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  tip?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface PresetConfig {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  glowColor: string;
  ringColor: string;
  iconBg: string;
  iconColor: string;
}

const PRESET_CONFIGS: Record<Exclude<EmptyStatePreset, 'custom'>, PresetConfig> = {
  'calendar-clean': {
    icon: <IconCalendarHeart size={28} stroke={1.6} />,
    badge: 'Agenda Libre Hoy ✨',
    title: 'Tu agenda está libre hoy',
    description:
      'No tienes consultas programadas para este momento. ¡Buen momento para investigar nuevas recetas, crear pautas o revisar expedientes!',
    actionLabel: 'Investigar nuevas recetas',
    actionHref: '/templates',
    actionIcon: <IconToolsKitchen2 size={16} stroke={1.8} />,
    secondaryActionLabel: 'Ver agenda de la semana',
    secondaryActionHref: '/appointments',
    glowColor: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    ringColor: 'border-emerald-500/20 dark:border-emerald-500/30',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  'reviews-clean': {
    icon: <IconCalendarCheck size={28} stroke={1.6} />,
    badge: 'Revisiones al Día 🎯',
    title: '¡Todo al día y en orden!',
    description:
      'Ningún paciente tiene revisiones pendientes de supervisión en este momento. La cartera clínica avanza según lo previsto.',
    glowColor: 'from-teal-500/15 via-emerald-500/10 to-transparent',
    ringColor: 'border-teal-500/20 dark:border-teal-500/30',
    iconBg: 'bg-teal-50 dark:bg-teal-950/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  'recipe-search-empty': {
    icon: <IconChefHat size={28} stroke={1.6} />,
    badge: 'Banco de Platos 🥣',
    title: 'No encontramos ese plato',
    description:
      '¿Tienes una combinación en mente? Puedes crear tu propia receta y guardarla en tu banco personalizado con un solo clic.',
    actionLabel: 'Crear receta personalizada',
    actionIcon: <IconPlus size={16} stroke={1.8} />,
    glowColor: 'from-purple-500/15 via-fuchsia-500/10 to-transparent',
    ringColor: 'border-purple-500/20 dark:border-purple-500/30',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  'food-search-empty': {
    icon: <IconSearch size={26} stroke={1.6} />,
    badge: 'Catálogo de Alimentos 🥑',
    title: 'Alimento no encontrado',
    description:
      'Prueba con un término más corto o activa la Búsqueda Semántica IA para detectar sinónimos clínicos y equivalencias biológicas.',
    glowColor: 'from-amber-500/15 via-orange-500/10 to-transparent',
    ringColor: 'border-amber-500/20 dark:border-amber-500/30',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  'clients-empty': {
    icon: <IconUsers size={28} stroke={1.6} />,
    badge: 'Gestión de Pacientes 👥',
    title: 'No hay pacientes con este criterio',
    description:
      'No se encontraron coincidencias con los filtros seleccionados. Puedes restablecer la búsqueda o dar de alta a un nuevo paciente.',
    actionLabel: 'Limpiar filtros',
    actionIcon: <IconRefresh size={16} stroke={1.8} />,
    glowColor: 'from-blue-500/15 via-indigo-500/10 to-transparent',
    ringColor: 'border-blue-500/20 dark:border-blue-500/30',
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'retention-clean': {
    icon: <IconShieldCheck size={28} stroke={1.6} />,
    badge: 'Adherencia Máxima 🛡️',
    title: '¡Excelente adherencia clínica!',
    description:
      'Ningún paciente supera los 14 días de inactividad. Todos tus pacientes han interactuado recientemente con su pauta en la app.',
    glowColor: 'from-emerald-500/15 via-green-500/10 to-transparent',
    ringColor: 'border-emerald-500/20 dark:border-emerald-500/30',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  'template-search-empty': {
    icon: <IconToolsKitchen2 size={28} stroke={1.6} />,
    badge: 'Plantillas Maestras 📋',
    title: 'Sin plantillas para este filtro',
    description:
      'Guarda tus combinaciones de 7 días favoritas desde el Diet Builder pulsando en "Guardar como Plantilla" para reutilizarlas.',
    actionLabel: 'Ir al Diet Builder',
    actionHref: '/diet-builder',
    actionIcon: <IconArrowRight size={16} stroke={1.8} />,
    glowColor: 'from-indigo-500/15 via-purple-500/10 to-transparent',
    ringColor: 'border-indigo-500/20 dark:border-indigo-500/30',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
};

export function EmptyState({
  preset = 'custom',
  icon: customIcon,
  badge: customBadge,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  actionHref: customActionHref,
  actionIcon: customActionIcon,
  secondaryActionLabel: customSecLabel,
  onSecondaryAction,
  secondaryActionHref: customSecHref,
  tip,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const presetConfig = preset !== 'custom' ? PRESET_CONFIGS[preset] : null;

  const icon = customIcon || presetConfig?.icon || <IconMoodSmile size={28} stroke={1.6} />;
  const badge = customBadge || presetConfig?.badge;
  const title = customTitle || presetConfig?.title || 'No hay elementos disponibles';
  const description =
    customDescription ||
    presetConfig?.description ||
    'No se encontraron datos en esta sección actualmente.';
  const actionLabel = customActionLabel || presetConfig?.actionLabel;
  const actionHref = customActionHref || presetConfig?.actionHref;
  const actionIcon = customActionIcon || presetConfig?.actionIcon;
  const secondaryActionLabel = customSecLabel || presetConfig?.secondaryActionLabel;
  const secondaryActionHref = customSecHref || presetConfig?.secondaryActionHref;

  const glowColor = presetConfig?.glowColor || 'from-emerald-500/15 via-teal-500/10 to-transparent';
  const ringColor = presetConfig?.ringColor || 'border-[var(--border)]';
  const iconBg = presetConfig?.iconBg || 'bg-[var(--card-subtle)]';
  const iconColor = presetConfig?.iconColor || 'text-[var(--brand-solid)]';

  // Ajustes de tamaño
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const containerPadding = isSm ? 'py-5 px-3' : isLg ? 'py-14 px-6' : 'py-8 px-4';
  const iconSizeBox = isSm ? 'w-11 h-11' : isLg ? 'w-16 h-16' : 'w-13 h-13';
  const titleSize = isSm ? 'text-[13px] font-[600]' : isLg ? 'text-[17px] font-[600]' : 'text-[15px] font-[600]';
  const descSize = isSm ? 'text-[11.5px] max-w-xs' : isLg ? 'text-[13.5px] max-w-lg' : 'text-[12.5px] max-w-md';

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl ${containerPadding} ${className}`}
    >
      {/* Fondo con halo sutil de respiración */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${glowColor} opacity-70 pointer-events-none rounded-2xl`}
      />

      {/* Círculo decorativo pulsante */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--brand-solid)]/5 blur-3xl pointer-events-none rounded-full" />

      {/* Contenido del Empty State */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Badge superior si existe */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-[600] tracking-wide uppercase bg-[var(--card)]/90 backdrop-blur-xs border border-[var(--border)] text-[var(--text-secondary)] shadow-2xs"
          >
            {badge}
          </motion.div>
        )}

        {/* Icono animado flotante con doble anillo */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-3 flex items-center justify-center"
        >
          {/* Anillo exterior sutil */}
          <div
            className={`absolute inset-0 rounded-2xl border ${ringColor} scale-125 opacity-60`}
          />

          {/* Caja interior del icono */}
          <div
            className={`${iconSizeBox} rounded-2xl ${iconBg} ${iconColor} border border-[var(--border)] shadow-xs flex items-center justify-center transition-transform`}
          >
            {icon}
          </div>

          {/* Chispa sutil decorativa */}
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1.5 -right-1.5 text-amber-500 dark:text-amber-400"
          >
            <IconSparkles size={isSm ? 12 : 15} />
          </motion.div>
        </motion.div>

        {/* Título empático y positivo */}
        <h3 className={`${titleSize} text-[var(--text)] tracking-tight mb-1`}>
          {title}
        </h3>

        {/* Descripción accionable */}
        <p className={`${descSize} text-[var(--text-secondary)] leading-relaxed mx-auto`}>
          {description}
        </p>

        {/* Tip clínico opcional */}
        {tip && (
          <div className="mt-2.5 px-3 py-1 rounded-lg bg-[var(--card)]/80 border border-[var(--border)] text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 shadow-2xs">
            <span className="text-emerald-600 dark:text-emerald-400">💡</span>
            <span>{tip}</span>
          </div>
        )}

        {/* Acciones principales y secundarias */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {actionLabel && (
              actionHref ? (
                <Link href={actionHref}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-[500] bg-[var(--brand-solid)] text-[var(--brand-solid-text)] hover:opacity-95 shadow-xs transition-colors cursor-pointer select-none"
                  >
                    {actionIcon}
                    <span>{actionLabel}</span>
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  type="button"
                  onClick={onAction}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-[500] bg-[var(--brand-solid)] text-[var(--brand-solid-text)] hover:opacity-95 shadow-xs transition-colors cursor-pointer select-none"
                >
                  {actionIcon}
                  <span>{actionLabel}</span>
                </motion.button>
              )
            )}

            {secondaryActionLabel && (
              secondaryActionHref ? (
                <Link
                  href={secondaryActionHref}
                  className="text-[12px] font-[500] text-[var(--text-secondary)] hover:text-[var(--text)] hover:underline px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  {secondaryActionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="text-[12px] font-[500] text-[var(--text-secondary)] hover:text-[var(--text)] hover:underline px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  {secondaryActionLabel}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
