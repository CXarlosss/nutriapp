import fs from 'fs';
import path from 'path';

console.log('🧪 Verificando generador de PDF (dietPdfGenerator.ts)...');

const filePath = path.resolve('src/lib/pdf/dietPdfGenerator.ts');
const content = fs.readFileSync(filePath, 'utf-8');

const checks = [
  { name: 'Tipografía Playfair Display', target: 'Playfair+Display' },
  { name: 'Tipografía EB Garamond', target: 'EB+Garamond' },
  { name: 'Tipografía Geist Mono', target: 'Geist+Mono' },
  { name: 'Nombre de la hermana: Dra. Laura Martínez Castillo', target: 'Dra. Laura Martínez Castillo' },
  { name: 'Número de Colegiada Oficial (AND-00482)', target: 'AND-00482' },
  { name: 'Monograma oficial LM en sello', target: '<div class="hospital-seal">LM</div>' },
  { name: 'Monograma mini LM en cabecera de página 2', target: '<span class="header-seal-mini">LM</span>' },
  { name: 'Teléfono / WhatsApp de contacto (+34 612 345 678)', target: '+34 612 345 678' },
  { name: 'Email de contacto (laura@nutriapp.es)', target: 'laura@nutriapp.es' },
  { name: 'Portal del Paciente (www.nutriapp.es/laura)', target: 'www.nutriapp.es/laura' },
  { name: 'Firma y Validación Digital de Laura en portada', target: 'signature-card-box' },
  { name: 'Pie de página con contacto directo en página 2', target: 'footer-contact-inline' },
  { name: 'Sin residuos de Dra. C. Gómez Pardo', target: 'Dra. C. Gómez Pardo', shouldNotExist: true },
];

let failed = 0;
for (const check of checks) {
  const exists = content.includes(check.target);
  if (check.shouldNotExist) {
    if (exists) {
      console.error(`  ❌ FAIL: Se encontró texto obsoleto no deseado: "${check.target}"`);
      failed++;
    } else {
      console.log(`  ✅ PASS: No existe texto obsoleto "${check.target}"`);
    }
  } else {
    if (!exists) {
      console.error(`  ❌ FAIL: Falta: ${check.name} ("${check.target}")`);
      failed++;
    } else {
      console.log(`  ✅ PASS: ${check.name}`);
    }
  }
}

if (failed === 0) {
  console.log('\n🎉 ¡Todas las verificaciones del PDF del Paciente han pasado con éxito!');
  process.exit(0);
} else {
  console.error(`\n💥 Se encontraron ${failed} fallos en el generador de PDF.`);
  process.exit(1);
}
