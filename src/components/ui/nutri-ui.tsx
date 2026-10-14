import React from 'react';

// ==============================================================================
// NUTRIAPP DESIGN SYSTEM COMPONENTS (Fidelidad 100% tokens oficiales)
// ==============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border)] rounded-[12px] ${
        noPadding ? '' : 'p-[16px_20px]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MetricCardProps {
  label: string;
  value: number | string;
  isWarning?: boolean;
  className?: string;
}

export function MetricCard({ label, value, isWarning = false, className = '' }: MetricCardProps) {
  const isAmber = isWarning && Number(value) > 0;

  return (
    <div
      className={`rounded-[8px] p-[12px_16px] transition-colors ${
        isAmber
          ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
          : 'bg-[var(--card-subtle)] text-[var(--text)]'
      } ${className}`}
    >
      <div
        className={`text-[12px] font-[400] leading-none mb-2 ${
          isAmber ? 'text-[var(--warning-text)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[24px] font-[500] leading-tight ${
          isAmber ? 'text-[var(--warning-text)]' : 'text-[var(--text)]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  brand: 'bg-[var(--brand-bg)] text-[var(--brand-text)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  info: 'bg-[var(--info-bg)] text-[var(--info-text)]',
  neutral: 'bg-[var(--neutral-bg)] text-[var(--neutral-text)]',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export function Badge({ variant = 'neutral', children, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-[8px] text-[11px] sm:text-[12px] font-[500] leading-none whitespace-nowrap ${BADGE_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'secondary', type = 'button', children, className = '', ...props }: ButtonProps) {
  const baseStyles =
    'h-[36px] px-3.5 rounded-[8px] text-[14px] font-[500] inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = 'bg-[var(--brand-solid)] text-[var(--brand-solid-text)] hover:opacity-95';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-transparent border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--card-subtle)]';
  } else if (variant === 'ghost') {
    variantStyles = 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--card-subtle)] hover:text-[var(--text)]';
  }

  return (
    <button type={type} className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative inline-flex items-center w-full">
      {icon && (
        <span className="absolute left-2.5 text-[var(--text-muted)] flex items-center justify-center pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={`h-[36px] w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[14px] text-[var(--text)] placeholder-[var(--text-muted)] font-[400] transition-colors focus-visible:border-[var(--brand-border)] ${
          icon ? 'pl-8 pr-3' : 'px-3'
        } ${className}`}
        {...props}
      />
    </div>
  );
}

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="rounded-full bg-[var(--brand-bg)] text-[var(--brand-text)] flex items-center justify-center text-[13px] font-[500] shrink-0 select-none"
    >
      {initials}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#EFEDE6] rounded-[8px] animate-pulse ${className}`} />;
}
