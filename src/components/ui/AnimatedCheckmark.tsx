'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'success' | 'gold' | 'brand';
  className?: string;
  showSparkles?: boolean;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  size = 'md',
  variant = 'success',
  className = '',
  showSparkles = true,
}) => {
  const pixelSizes = {
    sm: 38,
    md: 56,
    lg: 76,
  };

  const px = pixelSizes[size];

  const colors = {
    success: {
      stroke: '#10B981',
      bg: 'bg-emerald-500/15',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
      sparkle: 'text-emerald-500',
    },
    gold: {
      stroke: '#F59E0B',
      bg: 'bg-amber-500/15',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      sparkle: 'text-amber-500',
    },
    brand: {
      stroke: '#0F6E56',
      bg: 'bg-teal-500/15',
      glow: 'shadow-[0_0_25px_rgba(15,110,86,0.35)]',
      sparkle: 'text-teal-500',
    },
  };

  const activeColor = colors[variant];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Halo de luz de fondo con micro-respiración */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: [1, 1.12, 1] }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className={`absolute inset-0 rounded-full ${activeColor.bg} ${activeColor.glow} blur-xs`}
      />

      {/* Contenedor del SVG con animación de entrada elástica */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: 0.05,
        }}
        className="relative z-10 flex items-center justify-center"
        style={{ width: px, height: px }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Círculo exterior que se dibuja solo */}
          <motion.circle
            cx="26"
            cy="26"
            r="23"
            stroke={activeColor.stroke}
            strokeWidth="3.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.55,
              ease: [0.65, 0, 0.35, 1],
            }}
          />

          {/* Trazo del Check (V) que se dibuja de forma encadenada */}
          <motion.path
            d="M15 27 L23 35 L37 18"
            stroke={activeColor.stroke}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.35,
              ease: [0.65, 0, 0.35, 1],
            }}
          />
        </svg>

        {/* Chispas flotantes alrededor del checkmark */}
        {showSparkles && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className={`absolute -top-1 -right-1 text-xs ${activeColor.sparkle}`}
            >
              ✨
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className={`absolute -bottom-1 -left-1 text-[10px] ${activeColor.sparkle}`}
            >
              ✦
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};
