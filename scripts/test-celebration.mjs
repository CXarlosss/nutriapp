import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('🧪 Verificando Sistema de Dopamina y Gamificación (Celebraciones)...');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ FALLO: ${message}`);
    allPassed = false;
  }
}

// 1. package.json has canvas-confetti
const pkgPath = path.join(projectRoot, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
assert(pkg.dependencies && pkg.dependencies['canvas-confetti'], 'package.json incluye canvas-confetti en dependencies');

// 2. src/lib/ui/confetti.ts
const confettiFilePath = path.join(projectRoot, 'src', 'lib', 'ui', 'confetti.ts');
assert(fs.existsSync(confettiFilePath), 'src/lib/ui/confetti.ts existe');
const confettiCode = fs.readFileSync(confettiFilePath, 'utf8');
assert(confettiCode.includes('fireCelebrationConfetti'), 'confetti.ts exporta fireCelebrationConfetti');
assert(confettiCode.includes('firePaymentCelebration'), 'confetti.ts exporta firePaymentCelebration');
assert(confettiCode.includes('firePublishCelebration'), 'confetti.ts exporta firePublishCelebration');
assert(confettiCode.includes("import('canvas-confetti')"), 'confetti.ts usa dynamic import para seguridad SSR');

// 3. src/components/ui/AnimatedCheckmark.tsx
const checkmarkFilePath = path.join(projectRoot, 'src', 'components', 'ui', 'AnimatedCheckmark.tsx');
assert(fs.existsSync(checkmarkFilePath), 'src/components/ui/AnimatedCheckmark.tsx existe');
const checkmarkCode = fs.readFileSync(checkmarkFilePath, 'utf8');
assert(checkmarkCode.includes('AnimatedCheckmark'), 'AnimatedCheckmark componente definido');
assert(checkmarkCode.includes('pathLength'), 'AnimatedCheckmark usa animación pathLength para dibujarse solo');
assert(checkmarkCode.includes('framer-motion') || checkmarkCode.includes('motion'), 'AnimatedCheckmark usa motion de Framer Motion');

// 4. src/components/ui/nutri-ui.tsx
const nutriUiPath = path.join(projectRoot, 'src', 'components', 'ui', 'nutri-ui.tsx');
const nutriUiCode = fs.readFileSync(nutriUiPath, 'utf8');
assert(nutriUiCode.includes('AnimatedCheckmark'), 'nutri-ui.tsx re-exporta AnimatedCheckmark');
assert(nutriUiCode.includes('fireCelebrationConfetti'), 'nutri-ui.tsx re-exporta fireCelebrationConfetti');

// 5. ManualPaymentModal.tsx
const manualPaymentModalPath = path.join(projectRoot, 'src', 'components', 'clients', 'ManualPaymentModal.tsx');
const manualPaymentCode = fs.readFileSync(manualPaymentModalPath, 'utf8');
assert(manualPaymentCode.includes('AnimatedCheckmark'), 'ManualPaymentModal integra AnimatedCheckmark');
assert(manualPaymentCode.includes('fireCelebrationConfetti') || manualPaymentCode.includes('firePaymentCelebration'), 'ManualPaymentModal dispara confeti al cobrar');
assert(manualPaymentCode.includes('¡Cobro Registrado con Éxito!'), 'ManualPaymentModal muestra pantalla de celebración con ahorro de Stripe');

// 6. DietHeader.tsx
const dietHeaderPath = path.join(projectRoot, 'src', 'components', 'diet-editor', 'DietHeader.tsx');
const dietHeaderCode = fs.readFileSync(dietHeaderPath, 'utf8');
assert(dietHeaderCode.includes('fireCelebrationConfetti') || dietHeaderCode.includes('firePublishCelebration'), 'DietHeader dispara confeti al publicar dieta');

// 7. PublishedDietModal.tsx
const publishedModalPath = path.join(projectRoot, 'src', 'components', 'diet-editor', 'PublishedDietModal.tsx');
const publishedModalCode = fs.readFileSync(publishedModalPath, 'utf8');
assert(publishedModalCode.includes('AnimatedCheckmark'), 'PublishedDietModal integra AnimatedCheckmark autodibujado');
assert(publishedModalCode.includes('fireCelebrationConfetti') || publishedModalCode.includes('firePublishCelebration'), 'PublishedDietModal dispara celebración');

if (!allPassed) {
  console.error('\n❌ Algunas verificaciones fallaron.');
  process.exit(1);
} else {
  console.log('\n🎉 ¡TODAS LAS COMPROBACIONES DE DOPAMINA Y GAMIFICACIÓN PASARON CON ÉXITO!');
  process.exit(0);
}
