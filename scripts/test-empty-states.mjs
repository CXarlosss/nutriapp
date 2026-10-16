import fs from 'fs';
import path from 'path';

console.log('🧪 Verificando sistema de Empty States con Alma (EmptyState.tsx)...');

let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Verificar existencia y presets en EmptyState.tsx
const emptyStatePath = path.resolve('src/components/ui/EmptyState.tsx');
assert(fs.existsSync(emptyStatePath), 'Archivo EmptyState.tsx existe');
const emptyStateCode = fs.readFileSync(emptyStatePath, 'utf-8');

assert(emptyStateCode.includes('calendar-clean'), 'Preset calendar-clean definido');
assert(emptyStateCode.includes('reviews-clean'), 'Preset reviews-clean definido');
assert(emptyStateCode.includes('recipe-search-empty'), 'Preset recipe-search-empty definido');
assert(emptyStateCode.includes('food-search-empty'), 'Preset food-search-empty definido');
assert(emptyStateCode.includes('clients-empty'), 'Preset clients-empty definido');
assert(emptyStateCode.includes('retention-clean'), 'Preset retention-clean definido');
assert(emptyStateCode.includes('template-search-empty'), 'Preset template-search-empty definido');
assert(emptyStateCode.includes('repeat: Infinity'), 'Icono animado flotante con Framer Motion');

// 2. Verificar DashboardView.tsx
const dashboardCode = fs.readFileSync(path.resolve('src/components/dashboard/DashboardView.tsx'), 'utf-8');
assert(dashboardCode.includes('preset="calendar-clean"'), 'DashboardView usa EmptyState para Citas de hoy');
assert(dashboardCode.includes('preset="reviews-clean"'), 'DashboardView usa EmptyState para Toca revisión');
assert(dashboardCode.includes('preset="clients-empty"'), 'DashboardView usa EmptyState para la tabla de pacientes');
assert(!dashboardCode.includes('Disfruta del día o revisa la agenda'), 'Texto plano anterior eliminado de DashboardView');

// 3. Verificar RecipeBankPanel.tsx
const recipeBankCode = fs.readFileSync(path.resolve('src/components/diet-editor/RecipeBankPanel.tsx'), 'utf-8');
assert(recipeBankCode.includes('preset="recipe-search-empty"'), 'RecipeBankPanel usa EmptyState para búsqueda de recetas');
assert(recipeBankCode.includes('setIsSaveModalOpen(true)'), 'EmptyState en RecipeBankPanel permite crear receta personalizada');
assert(!recipeBankCode.includes('No se encontraron platos que coincidan con la búsqueda.'), 'Texto triste plano anterior eliminado de RecipeBankPanel');

// 4. Verificar FoodFuzzySearch.tsx
const foodSearchCode = fs.readFileSync(path.resolve('src/components/diet-editor/FoodFuzzySearch.tsx'), 'utf-8');
assert(foodSearchCode.includes('preset="food-search-empty"'), 'FoodFuzzySearch usa EmptyState para catálogo de alimentos');
assert(foodSearchCode.includes('setIsSemanticMode(true)'), 'EmptyState en FoodFuzzySearch invita a activar Búsqueda Semántica con IA');

// 5. Verificar templates/page.tsx
const templatesCode = fs.readFileSync(path.resolve('src/app/templates/page.tsx'), 'utf-8');
assert(templatesCode.includes('preset="template-search-empty"'), 'TemplatesPage usa EmptyState para plantillas maestras');

// 6. Verificar clients/page.tsx
const clientsCode = fs.readFileSync(path.resolve('src/app/clients/page.tsx'), 'utf-8');
assert(clientsCode.includes('preset="clients-empty"'), 'ClientsPage usa EmptyState en tabla y en modo real');

// 7. Verificar RetentionBusinessDashboard.tsx
const retentionCode = fs.readFileSync(path.resolve('src/components/dashboard/RetentionBusinessDashboard.tsx'), 'utf-8');
assert(retentionCode.includes('preset="retention-clean"'), 'RetentionBusinessDashboard usa EmptyState para pacientes en riesgo');

console.log('\n─────────────────────────────────────────────────────────────');
if (failed === 0) {
  console.log('🎉 ¡Todos los Empty States con Alma han sido verificados con éxito!');
  process.exit(0);
} else {
  console.error(`💥 Se encontraron ${failed} fallos en la verificación.`);
  process.exit(1);
}
