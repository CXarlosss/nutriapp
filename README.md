# NutriApp · Clinical Decision Support System (CDSS) & Diet Operating System

Plataforma SaaS de grado clínico e industrial diseñada para nutricionistas de alto rendimiento y sus pacientes. Combina un **Diet Builder reactivo a 60 FPS**, un **Motor de Soporte a la Decisión Clínica (CDSS)** respaldado por literatura médica indexada (ISSN, EFSA, OMS), **seguridad RLS estricta en PostgreSQL**, **prevención matemática de colisiones en agenda (GiST)** y un **motor de variedad nutricional** con intercambios equivalentes, ciclado calórico y variantes asistidas por IA.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND LAYER                                       │
│    Next.js 16 (App Router + Turbopack) · Tailwind CSS Tokens · Tabler Icons · Lucide   │
├──────────────────────────┬───────────────────────────────┬──────────────────────────────┤
│     Diet Builder         │       Patient Portal          │      Clinical Audit          │
│    (/dietas/creador)     │        (/mi-dieta)            │        Scorecard             │
│  - Grid teclado (Excel)  │  - Mobile-first (>=320px)     │  - 0ms reactive rules        │
│  - Edición alta frecuenc │  - Food Swaps en 1 clic       │  - Semáforos ISSN/EFSA/OMS   │
│  - Ciclado de nutrientes │  - Insignias de demanda       │  - Enlaces directos DOI      │
└────────────┬─────────────┴───────────────┬───────────────┴──────────────┬───────────────┘
             │                             │                              │
┌────────────▼─────────────────────────────▼──────────────────────────────▼───────────────┐
│                           APPLICATION STATE & LOGIC LAYER                               │
│                         Zustand Store (useDietStore.ts)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  • Concurrency Guard & Mutex: `aiGeneratingDay: number | null` (bloqueo por columna)   │
│  • Cola de Drenaje & Debounce (500ms): Resiliente a caídas de red y reintentos atómicos│
│  • Food Swap Engine: Conversión matemática por nutriente pivote (<0.01 ms)             │
│  • Nutrient Cycling Engine: Presets clínicos (Hipertrofia 4:3, Definición 5:1:1)       │
└────────────┬────────────────────────────────────────────────────────────┬───────────────┘
             │                                                            │
┌────────────▼────────────────────────────────────────────────────────────▼───────────────┐
│                               PERSISTENCE & SECURITY                                    │
│                            Supabase (PostgreSQL 16)                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  • Row-Level Security (RLS): Aislamiento hermético de datos médicos entre pacientes     │
│  • GiST Exclusion Constraints: `tstzrange` para prevención física de citas solapadas    │
│  • PostgreSQL RPC: `get_food_swaps` y catálogo maestro con micronutrientes              │
│  • Webhooks & Orchestration: Eventos asíncronos desacoplados hacia n8n                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Capacidades Principales

### 1. Diet Builder de Alta Frecuencia (60 FPS)
- **Navegación tipo hoja de cálculo**: Control completo con teclado (`Tab`, `Shift+Tab`, flechas de dirección, `Enter` para editar y atajos rápidos).
- **Autoguardado con Mutex**: Buffer en memoria (`Map<id, item>`) con debounce de 500ms y cerrojo `isSavingMutex` que fusiona ediciones masivas en un solo batch y previene sobrescrituras por condiciones de carrera en conexiones lentas.

### 2. Clinical Decision Support System (CDSS)
- **Auditoría Científica Reactiva**: Recalcula ratios clínicos en cada pulsación de tecla (`g proteína/kg`, fibra dietética media, ratio inflamatorio `Omega-6 / Omega-3`, calcio y hierro).
- **Validación con Literatura Indexada**: Cruce automático contra la tabla `scientific_guidelines` con enlaces directos a los DOIs de los estudios ([ISSN Protein Stand](https://doi.org/10.1186/s12970-017-0177-8), EFSA Dietary Reference Values, Simopoulos Omega Ratio).
- **Hard Blocker al Publicar**: Impide la entrega de pautas deficientes que comprometan la salud del paciente hasta corregir las alertas críticas.
- **Complementos y Alimentos Sugeridos**: Detección inteligente de carencias con adición en 1 clic de alimentos ricos en el micronutriente deficitario.

### 3. Motor de Variedad Nutricional (Triángulo Anti-Fatiga)
1. **Intercambios Dinámicos (Food Swaps)**:
   - Alternativas calculadas matemáticamente por macro pivote:
     $$\text{Cantidad nueva} = \text{round}\left( \frac{\text{Cantidad original} \times \text{Densidad pivote original}}{\text{Densidad pivote nueva}} \right)$$
   - Ejemplo verificado: 150g de pechuga de pollo ($46.5\text{g}$ P) $\rightarrow$ 172g de lomo de cerdo magro ($46.4\text{g}$ P, $\Delta -2\text{ kcal}$) o 332g de tofu firme ($46.5\text{g}$ P).
2. **Ciclado Estratégico de Nutrientes (Carb & Calorie Cycling)**:
   - Pautas semanales adaptadas a la demanda: *Entrenamiento Pesado* (High Carb / 2.250 kcal), *Moderado* (1.900 kcal), *Descanso* (Low Carb / 1.700 kcal) y *Refeed* (Carga / 2.450 kcal).
   - Presets integrados: Hipertrofia 4:3 (Torso/Pierna), Definición con Refeed (5:1:1) y Fuerza 3 Días (Fullbody).
3. **Generación de Variantes Asistida por IA**:
   - Botón *"Generar Variante (IA)"* en cada día.
   - Estado de carga granular `aiGeneratingDay: number | null` que renderiza un **Skeleton visual** exclusivamente en la columna afectada sin bloquear el resto de la interfaz.
   - Varianza calórica inferior al **0.2%** garantizada.

### 4. Seguridad RLS y Agenda con Exclusión GiST
- **Aislamiento Médico Estricto**: Políticas RLS en PostgreSQL donde un paciente solo puede consultar exclusivamente las dietas y citas asociadas a su `auth.uid()`.
- **Integridad Física en PostgreSQL (GiST)**: Restricción `btree_gist` sobre rangos temporales `tstzrange(starts_at, ends_at, '[)')` que arroja el error PostgreSQL `23P01 (exclusion_violation)` en el motor de base de datos si dos pacientes intentan reservar en la misma franja horaria.

---

## 📊 Benchmarks de Rendimiento

| Subsistema | Métrica Evaluada | Resultado Obtenido | Umbral de Aceptación |
| :--- | :--- | :--- | :--- |
| **Motor CDSS** | 1.000 recálculos clínicos | **3.35 ms** (~0.003 ms/op) | < 16.6 ms (60 FPS) |
| **Food Swap Engine** | 10.000 intercambios matemáticos | **92.26 ms** (~0.009 ms/op) | < 1.0 ms |
| **Nutrient Cycling Compliance** | 10.000 evaluaciones de pauta | **2.00 ms** (~0.0002 ms/op) | < 0.5 ms |
| **Compilación Turbopack** | `next build` estático + SSR | **1.57 s** (0 errores) | < 10.0 s |

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Partial Prerendering).
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode).
- **Gestión de Estado**: [Zustand](https://github.com/pmndrs/zustand) (Selectores puros memorizados, persistencia desacoplada).
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) / [PostgreSQL 16](https://www.postgresql.org/) con extensiones `btree_gist`, RLS y funciones RPC en PL/pgSQL.
- **Estilos**: Vanilla CSS Tokens + Tailwind CSS siguiendo la guía de diseño institucional de NutriApp (`#F5F4EF`, `#0F6E56`, microinteracciones sutiles, 0 sombras decorativas).
- **Iconografía**: [Tabler Icons](https://tabler-icons.io/) y [Lucide React](https://lucide.dev/).
- **Orquestación**: Webhooks JSON hacia [n8n](https://n8n.io/).

---

## 🚀 Puesta en Marcha Local

### Requisitos Previos
- Node.js >= 20.x (probado en Node.js v24 LTS).
- Proyecto en Supabase configurado (o instancia local de PostgreSQL).

### Instalación
```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd proyectoantigravity

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
N8N_WEBHOOK_URL=http://localhost:5678/webhook/booking-notification

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Ejecución de Tests Automatizados
```bash
# Test de Prevención de Colisiones GiST (PostgreSQL 23P01) y Webhook n8n
node scripts/test-collision-n8n.mjs

# Test del Motor de Decisión Clínica (CDSS) y Rigor Científico
node scripts/test-cdss-validation.mjs

# Test de Intercambios Dinámicos de Alimentos (Food Swaps)
node scripts/test-food-swaps.mjs

# Test de Ciclado Estratégico de Nutrientes (Carb Cycling)
node scripts/test-nutrient-cycling.mjs

# Test del Generador de Variantes Asistido por IA y Concurrency Guard
node scripts/test-ai-variant.mjs

# Compilación completa de producción
npm run build
```

---

## 📁 Estructura del Repositorio

├── scripts/                          # Suites de pruebas automatizadas y benchmarks
│   ├── test-outbox-pattern.mjs       # Test de latencia atómica y despacho CDC a n8n
│   ├── test-stripe-webhook.mjs       # Test de seguridad criptográfica y ciclo de vida Stripe
│   ├── test-cdss-validation.mjs      # Test de motor CDSS y consultas a scientific_guidelines
│   ├── test-food-swaps.mjs           # Test de equivalencias matemáticas y Food Swaps
│   ├── test-nutrient-cycling.mjs     # Test de pautas de ciclado y compliance
│   ├── test-ai-variant.mjs           # Test de endpoint de variantes con IA
│   └── test-collision-n8n.mjs        # Test de restricción GiST y webhook n8n
├── src/
│   ├── app/
│   │   ├── actions/billingOutboxActions.ts # Server Action de cobro seguro con Patrón Outbox
│   │   ├── actions/stripeCheckout.ts # Server Action de inicialización de Stripe Checkout
│   │   ├── api/outbox/dispatch/      # Worker de vaciado y despacho de eventos Outbox
│   │   ├── api/webhooks/stripe/      # Webhook de Stripe con verificación criptográfica HMAC-SHA256
│   │   ├── api/ai/generate-variant/  # Endpoint de generación asistida por IA
│   │   ├── api/export-pdf/           # Generador nativo de PDF vía CSS @page
│   │   ├── pagos/simulado/           # Pasarela de pago local y testing de checkout
│   │   ├── pagos/exito/              # Confirmación de pago y activación del expediente
│   │   ├── dietas/creador/           # Diet Builder para nutricionista
│   │   ├── mi-dieta/                 # Portal del paciente (mobile-first >=320px)
│   │   └── dashboard/                # Métricas operativas y solicitud de pago 1-click a pacientes
│   ├── components/
│   │   ├── diet-editor/              # DietGrid, MacroSummary, Scorecard, NutrientCyclingBar
│   │   └── patient/                  # PatientDietView, FoodSwapModal
│   ├── lib/
│   │   ├── outbox/outboxService.ts   # Inserción atómica y relayer CDC hacia n8n
│   │   ├── stripe/                   # stripe.ts y catálogo de productos (Consulta Única y Plan Mensual)
│   │   ├── services/billingService.ts# Sincronización atómica con Supabase y fallback en memoria
│   │   ├── clinical/                 # clinicalDecisionEngine, foodSwapEngine, nutrientCyclingEngine
│   │   ├── stores/                   # useDietStore (Zustand State Machine)
│   │   └── supabase/                 # Clientes Server/Client con SSR Cookies
│   └── types/                        # Tipado estricto TypeScript de todo el dominio
└── supabase/migrations/              # Migraciones versionadas en PostgreSQL (0001..0009)
```

---

### 💳 Bloque 8: Pasarela de Pagos y Webhooks Seguros (Stripe)
- **Validación Criptográfica Estricta**: La ruta `/api/webhooks/stripe` valida byte por byte el raw body mediante HMAC-SHA256 y la cabecera `Stripe-Signature`. Rechazo rotundo con HTTP 400 ante payloads no firmados o firmas corruptas.
- **Ciclo de Vida Automatizado**:
  - `checkout.session.completed`: Asocia el `client_id` embebido en metadata y transiciona el paciente a estado `active`.
  - `invoice.payment_succeeded`: Concilia renovaciones periódicas manteniendo el plan en estado `active`.
  - `customer.subscription.deleted`: Pasa el estado a `inactive` de forma instantánea.
- **Productos Configurados**:
  - *Consulta Única* (50,00 €): Valoración clínica y diseño de menú inicial.
  - *Plan Mensual* (79,00 €/mes): Suscripción recurrente con revisiones quincenales y soporte continuo.

---

### 🏛️ Bloque 10: Event Sourcing y CQRS (Time Travel & Inmutabilidad Médico-Legal)
- **Almacén Append-Only**: La tabla `diet_events` sella cada acción clínica (`DietAssigned`, `FoodSwapped`, `TargetMacrosAdjusted`) con secuencia incremental y control de concurrencia optimista (OCC).
- **Proyecciones Desnormalizadas (Read Model)**: `diet_projections` mantiene un snapshot en tiempo real para lecturas a <1ms sin sacrificar la trazabilidad histórica forense.
- **Time Travel**: Capacidad de reconstruir el estado exacto de la prescripción de cualquier fecha o versión previa.

---

### 🧠 Bloque 11: Búsqueda Semántica Asistida por IA con pgvector (HNSW)
- **Embeddings Clínicos de 1536 dimensiones**: Indexación con grafo HNSW (`halfvec` / `vector_cosine_ops`) sobre catálogo maestro de alimentos.
- **Consultas Conceptuales Abstractas**: Capacidad de buscar términos médicos como *"fuente de omega 3 para recuperación articular"* o *"almidón resistente para microbiota"* con cálculo de afinidad instantáneo y fallback difuso trigram (`pg_trgm`).

---

### 🩺 Bloque 12: Historia Clínica, Analíticas y Alertas Fármaco-Nutriente
- **Panel de Analíticas Sanguíneas**: Registro estructurado de marcadores clave (Ferritina, Vitamina D, HbA1c, Colesterol, TSH/T4/T3).
- **Gestor Digestivo (Escala de Bristol)**: Seguimiento semanal de hinchazón, reflujo y deposiciones para correlación automática con la pauta.
- **Alertas Fármaco-Nutriente (CDSS Activo)**: Detección de incompatibilidades horarias críticas, como interacción entre **Levotiroxina** y alimentos bloqueadores de absorción (soja, café, salvado).

---

### ⚡ Bloque 13: Automatización de Onboarding (Cero Data Entry)
- **Formulario Pre-Consulta Sincronizado**: Inyección directa en PostgreSQL al completar el cuestionario sin transcripción manual por parte del nutricionista.
- **Tokens de Un Solo Uso**: Acceso seguro del paciente con aislamiento estricto y generación de eventos Outbox para notificación n8n.

---

### 🎙️ Bloque 14: Asistente de Consulta Asistido por Voz (Whisper + SOAP)
- **Productividad Cero Pantallas**: Dictado clínico durante la consulta presencial o telemática.
- **Structured Outputs Clínicos**: Extracción automática de peso, escala de Bristol, síntomas reportados y generación de notas clínicas estructuradas según el estándar SOAP (*Subjetivo, Objetivo, Análisis, Plan*).

---

### 📈 Bloque 15: Dashboard de Retención y Negocio (Stripe Metrics + Cron)
- **Métricas Financieras en Tiempo Real**: Cálculo y visualización de MRR (Ingreso Recurrente Mensual), Tasa de Churn y LTV (Valor del Ciclo de Vida).
- **Cron de Detección de Abandono**: Detección de pacientes con $\ge 14$ días sin consultar el portal para emisión automática de alertas y campañas de reenganche.

---

### 🍎 Bloque 16 & 17: Excelencia Visual y Jerarquía Tipográfica
- **Micro-interacciones Cinéticas**: Drag & Drop magnético con snap físico y transiciones de origen (Framer Motion).
- **Jerarquía Numérica Tabular**: Reglas CSS `font-variant-numeric: tabular-nums` para alineación perfecta en Kcal y analíticas sin oscilaciones, combinando tipografía geométrica (Geist Sans) con monoespaciada (Geist Mono).
- **Anillos Concéntricos SVG (Apple Watch style)**: Visualizador de cumplimiento de macronutrientes (Proteína, Carbohidratos, Grasas) en `/mi-dieta` para máxima adherencia psicológica.

---

### 📄 Bloque 18: Exportación PDF con Estándar Editorial Hospitalario
- **Reglas Puras `@media print`**: Cero dependencias pesadas de servidor; renderizado instantáneo y fiel en cualquier navegador.
- **Tipografía Serif de Alta Legibilidad**: `Playfair Display` para membretes institucionales y `Source Serif 4` para cuerpo editorial médico.
- **Portada Automática de Hospital Privado**: Sello oficial, acreditaciones médicas (SEEN / ISSN Certified), ficha del paciente y objetivos metabólicos.
- **Paginación Controlada**: `page-break-after: always` para la portada y `page-break-inside: avoid` en cada comida y referencias DOI.

---

### 🛡️ Bloque 19 & 20: Arquitectura Multi-Tenant B2B con Aislamiento RLS Imparable
- **Aislamiento Total a Nivel de Motor**: Múltiples clínicas (*Clínica Vida*, *Centro Médico Élite*) comparten la base de datos con separación absoluta garantizada por PostgreSQL Row Level Security.
- **Resolución Zero-Query**: `current_user_clinic_id()` resuelve el tenant directamente desde los claims JWT de Supabase (`request.jwt.claims -> 'app_metadata' ->> 'clinic_id'`), eliminando subconsultas a disco y preservando latencias submilisegundo.
- **Trigger `inject_tenant_clinic_id`**: Inyección automática del `clinic_id` en `BEFORE INSERT` para proteger la persistencia ante descuidos en la capa de aplicación Node.js.
- **Verificación Automatizada**: Suite de tests SQL ([0014_multi_tenant_rls_verification.sql](supabase/tests/0014_multi_tenant_rls_verification.sql)) y Playwright validando 12 de 12 pruebas E2E en verde.

---

## 📜 Licencia y Autoría
Proyecto desarrollado con fines médicos y de ingeniería de software avanzada. Arquitectura de referencia para sistemas SaaS clínicos e industriales.

