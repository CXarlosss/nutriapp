/**
 * Motor de Celebración & Gamificación (Dopamina UX) - NutriApp
 * Lanza ráfagas sutiles, elegantes y de alto impacto psicológico
 * al completar hitos clínicos (Publicar dieta, Cobro confirmado, etc.)
 */

export interface ConfettiOptions {
  type?: 'payment' | 'publish' | 'success';
}

export async function fireCelebrationConfetti(options: ConfettiOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  const { type = 'success' } = options;

  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;

    if (type === 'payment') {
      // Celebración de Cobro (Tonos Esmeralda y Oro / Ahorro de comisiones)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.68 },
        colors: ['#10B981', '#059669', '#F59E0B', '#FBBF24', '#34D399', '#D97706'],
        disableForReducedMotion: true,
        ticks: 200,
        gravity: 1.1,
        scalar: 0.9,
      });

      // Segunda ráfaga más dispersa a los 120ms
      setTimeout(() => {
        confetti({
          particleCount: 25,
          angle: 90,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#10B981', '#FFFFFF'],
          disableForReducedMotion: true,
          ticks: 180,
          gravity: 0.9,
          scalar: 0.75,
        });
      }, 120);
    } else if (type === 'publish') {
      // Celebración de Dieta Publicada (Doble cañón desde los laterales)
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0.05, y: 0.65 },
        colors: ['#0F6E56', '#5DCAA5', '#8B5CF6', '#A78BFA', '#10B981'],
        disableForReducedMotion: true,
        ticks: 220,
      });

      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#0F6E56', '#5DCAA5', '#8B5CF6', '#A78BFA', '#10B981'],
          disableForReducedMotion: true,
          ticks: 220,
        });
      }, 100);
    } else {
      // Celebración genérica de éxito
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#0F6E56', '#10B981', '#F59E0B', '#3B82F6'],
        disableForReducedMotion: true,
      });
    }
  } catch (error) {
    console.warn('[NutriApp] No se pudo lanzar el confeti:', error);
  }
}

export const firePaymentCelebration = (): Promise<void> => fireCelebrationConfetti({ type: 'payment' });
export const firePublishCelebration = (): Promise<void> => fireCelebrationConfetti({ type: 'publish' });

