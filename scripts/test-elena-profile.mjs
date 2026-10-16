import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('🧪 Verificando Identidad y Persistencia de Elena (elenap.nutricionista@gmail.com)...');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ FALLO: ${message}`);
    allPassed = false;
  }
}

// 1. useProfessionalProfile.ts
const profileHookPath = path.join(projectRoot, 'src', 'lib', 'stores', 'useProfessionalProfile.ts');
assert(fs.existsSync(profileHookPath), 'useProfessionalProfile.ts existe');
const profileHookCode = fs.readFileSync(profileHookPath, 'utf8');
assert(profileHookCode.includes('elenap.nutricionista@gmail.com'), 'Email por defecto es elenap.nutricionista@gmail.com');
assert(profileHookCode.includes('Elena'), 'Nombre por defecto incluye Elena');
assert(profileHookCode.includes('nutriapp:professional-settings-updated'), 'Emite evento de actualización reactiva en tiempo real');

// 2. AppShell.tsx
const appShellPath = path.join(projectRoot, 'src', 'components', 'layout', 'AppShell.tsx');
const appShellCode = fs.readFileSync(appShellPath, 'utf8');
assert(appShellCode.includes('useProfessionalProfile'), 'AppShell usa useProfessionalProfile hook');
assert(appShellCode.includes('elenap.nutricionista@gmail.com'), 'AppShell tiene fallback a elenap.nutricionista@gmail.com');
assert(!appShellCode.includes('laura@nutriapp.es'), 'AppShell ya no contiene laura@nutriapp.es');

// 3. DashboardView.tsx
const dashboardPath = path.join(projectRoot, 'src', 'components', 'dashboard', 'DashboardView.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
assert(dashboardCode.includes('useProfessionalProfile'), 'DashboardView usa useProfessionalProfile');
assert(dashboardCode.includes('Buenos días, Elena') || dashboardCode.includes('Buenos días, ${firstName}'), 'DashboardView saluda a Elena de forma dinámica');
assert(!dashboardCode.includes('Buenos días, Laura'), 'DashboardView ya no contiene Buenos días, Laura');

// 4. SettingsPage.tsx
const settingsPath = path.join(projectRoot, 'src', 'app', 'settings', 'page.tsx');
const settingsCode = fs.readFileSync(settingsPath, 'utf8');
assert(settingsCode.includes('saveProfessionalProfile'), 'SettingsPage usa saveProfessionalProfile');
assert(!settingsCode.includes('laura@nutriapp.es'), 'SettingsPage no contiene laura@nutriapp.es');

// 5. dietPdfGenerator.ts
const pdfPath = path.join(projectRoot, 'src', 'lib', 'pdf', 'dietPdfGenerator.ts');
const pdfCode = fs.readFileSync(pdfPath, 'utf8');
assert(pdfCode.includes('elenap.nutricionista@gmail.com'), 'dietPdfGenerator usa elenap.nutricionista@gmail.com');
assert(pdfCode.includes('Elena'), 'dietPdfGenerator usa Dra. Elena');

// 6. Ningún laura@nutriapp.es en src
function checkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkDir(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('laura@nutriapp.es')) {
        console.error(`  ❌ Encontrado laura@nutriapp.es en: ${fullPath}`);
        allPassed = false;
      }
    }
  }
}
checkDir(path.join(projectRoot, 'src'));
assert(!allPassed ? false : true, 'Cero referencias residuales a laura@nutriapp.es en todo src');

if (!allPassed) {
  console.error('\n❌ Algunas comprobaciones fallaron.');
  process.exit(1);
} else {
  console.log('\n🎉 ¡IDENTIDAD Y PERSISTENCIA DE ELENA VERIFICADAS AL 100%!');
  process.exit(0);
}
