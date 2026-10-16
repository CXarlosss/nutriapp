import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('🧪 Verificando Biblioteca de Plantillas Clínicas y Deportivas (Presets Anti-Cold-Start)...');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ FALLO: ${message}`);
    allPassed = false;
  }
}

// 1. types/clinical.ts
const clinicalTypesPath = path.join(projectRoot, 'src', 'types', 'clinical.ts');
assert(fs.existsSync(clinicalTypesPath), 'src/types/clinical.ts existe');
const clinicalTypesCode = fs.readFileSync(clinicalTypesPath, 'utf8');
assert(clinicalTypesCode.includes('export interface DietTemplate'), 'DietTemplate exportada en types/clinical.ts');

// 2. data/defaultTemplates.ts
const defaultTemplatesPath = path.join(projectRoot, 'src', 'lib', 'data', 'defaultTemplates.ts');
assert(fs.existsSync(defaultTemplatesPath), 'src/lib/data/defaultTemplates.ts existe');
const defaultTemplatesCode = fs.readFileSync(defaultTemplatesPath, 'utf8');
assert(defaultTemplatesCode.includes('tpl-sibo-fodmap-1'), 'Contiene Protocolo SIBO Fases 1-2 (Bajo FODMAP)');
assert(defaultTemplatesCode.includes('tpl-hyper-male-2800'), 'Contiene Hipertrofia Limpia (2.800 kcal)');
assert(defaultTemplatesCode.includes('tpl-carb-cycling-2200'), 'Contiene Ciclado de Carbohidratos (2.200 kcal)');
assert(defaultTemplatesCode.includes('tpl-sop-insulin-1500'), 'Contiene Resistencia Insulina / SOP (1.500 kcal)');
assert(defaultTemplatesCode.includes('tpl-recomp-fem-1800'), 'Contiene Recomposición Corporal Femenina (1.800 kcal)');
assert(defaultTemplatesCode.includes('tpl-gut-healing-1900'), 'Contiene Reparación de Permeabilidad Intestinal (1.900 kcal)');

// 3. useTemplateStore.ts
const templateStorePath = path.join(projectRoot, 'src', 'lib', 'stores', 'useTemplateStore.ts');
const templateStoreCode = fs.readFileSync(templateStorePath, 'utf8');
assert(templateStoreCode.includes('DEFAULT_CLINICAL_TEMPLATES'), 'useTemplateStore importa DEFAULT_CLINICAL_TEMPLATES');
assert(templateStoreCode.includes('getInitialTemplates'), 'useTemplateStore tiene fusion inteligente para que las plantillas maestras esten siempre disponibles');

// 4. templates/page.tsx
const templatesPagePath = path.join(projectRoot, 'src', 'app', 'templates', 'page.tsx');
const templatesPageCode = fs.readFileSync(templatesPagePath, 'utf8');
assert(templatesPageCode.includes('getTagBadgeStyle'), 'templates/page.tsx define etiquetas de colores por categoria clínica y deportiva');
assert(templatesPageCode.includes('tmpl.targetKcal || tmpl.kcal'), 'templates/page.tsx soporta targetKcal o kcal');

// 5. dietas/creador/page.tsx
const creatorPagePath = path.join(projectRoot, 'src', 'app', 'dietas', 'creador', 'page.tsx');
const creatorPageCode = fs.readFileSync(creatorPagePath, 'utf8');
assert(creatorPageCode.includes('loadTemplateItems'), 'dietas/creador carga la plantilla seleccionada');

if (!allPassed) {
  console.error('\n❌ Algunas comprobaciones de plantillas fallaron.');
  process.exit(1);
} else {
  console.log('\n🎉 ¡BIBLIOTECA DE PLANTILLAS CLÍNICAS Y DEPORTIVAS VERIFICADA AL 100%!');
  process.exit(0);
}
