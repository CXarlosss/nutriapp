import { Recipe } from '@/types/diet';

export const mockRecipes: Recipe[] = [
  // 🌅 DESAYUNOS (5)
  {
    id: 'rec-des-01',
    name: 'Porridge Protéico de Avena y Frutos Rojos',
    category: 'desayuno',
    tags: ['Fitness', 'Saciante', 'Alto en Fibra'],
    macros: { kcal: 380, protein: 30, carbs: 45, fats: 8 },
    ingredients: [
      { foodId: 'food-avena', foodName: 'Avena en copos integrales', grams: 50, notes: 'Hervir con agua o leche vegetal' },
      { foodId: 'food-whey', foodName: 'Proteína Whey isolate', grams: 30, notes: 'Mezclar al final en frío para no cuajar' },
      { foodId: 'food-arandanos', foodName: 'Arándanos silvestres frescos', grams: 100, notes: 'Añadir frescos por encima' },
      { foodId: 'food-canela', foodName: 'Canela de Ceylán', grams: 2, notes: 'Efecto hipoglucemiante' }
    ]
  },
  {
    id: 'rec-des-02',
    name: 'Tostada de Masa Madre, Aguacate y Huevo Poché',
    category: 'desayuno',
    tags: ['Salud Hormonal', 'Omega 3', 'Vegetariano'],
    macros: { kcal: 420, protein: 16, carbs: 30, fats: 24 },
    ingredients: [
      { foodId: 'food-pan-masamadre', foodName: 'Pan de masa madre integral', grams: 70, notes: 'Tostar ligeramente' },
      { foodId: 'food-aguacate', foodName: 'Aguacate Hass maduro', grams: 80, notes: 'Machacar con tenedor y lima' },
      { foodId: 'food-huevo', foodName: 'Huevo campero pochado', grams: 65, notes: '1 huevo M pochado 3 minutos' },
      { foodId: 'food-semillas-canamo', foodName: 'Semillas de cáñamo peladas', grams: 10, notes: 'Espolvorear' }
    ]
  },
  {
    id: 'rec-des-03',
    name: 'Overnight Oats Probiótico (Avena Nocturna)',
    category: 'desayuno',
    tags: ['Microbiota', 'Rápido', 'Meal Prep'],
    macros: { kcal: 350, protein: 18, carbs: 40, fats: 12 },
    ingredients: [
      { foodId: 'food-avena', foodName: 'Avena suave en copos', grams: 40, notes: 'Dejar en remojo toda la noche' },
      { foodId: 'food-kefir', foodName: 'Kéfir de leche ecológico', grams: 150, notes: 'Base líquida probiótica' },
      { foodId: 'food-chia', foodName: 'Semillas de chía', grams: 15, notes: 'Gelifica durante la noche' },
      { foodId: 'food-platano', foodName: 'Plátano maduro de Canarias', grams: 100, notes: 'Medio plátano en rodajas' }
    ]
  },
  {
    id: 'rec-des-04',
    name: 'Revuelto Keto de Espinacas y Feta',
    category: 'desayuno',
    tags: ['Keto', 'Low-Carb', 'Sin Gluten'],
    macros: { kcal: 320, protein: 22, carbs: 4, fats: 25 },
    ingredients: [
      { foodId: 'food-huevo', foodName: 'Huevos camperos enteros', grams: 130, notes: '2 huevos enteros M' },
      { foodId: 'food-espinaca-fresca', foodName: 'Espinacas baby frescas', grams: 50, notes: 'Saltear primero' },
      { foodId: 'food-queso-feta', foodName: 'Queso feta auténtico D.O.P.', grams: 30, notes: 'Desmenuzar al final' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 10, notes: 'Para la sartén' }
    ]
  },
  {
    id: 'rec-des-05',
    name: 'Batido Hipercalórico Volumen',
    category: 'desayuno',
    tags: ['Volumen', 'Líquido', 'Deportivo'],
    macros: { kcal: 650, protein: 40, carbs: 70, fats: 22 },
    ingredients: [
      { foodId: 'food-leche-entera', foodName: 'Leche entera o bebida de avena', grams: 300, notes: 'O bebida de avena' },
      { foodId: 'food-whey', foodName: 'Proteína Whey sabor vainilla', grams: 30, notes: 'Proteína sabor vainilla' },
      { foodId: 'food-crema-cacahuete', foodName: 'Crema de cacahuete 100%', grams: 30, notes: '100% cacahuete, sin azúcar' },
      { foodId: 'food-platano', foodName: 'Plátano de Canarias maduro', grams: 120, notes: 'Plátano maduro' },
      { foodId: 'food-avena', foodName: 'Avena en copos finos', grams: 40, notes: 'Triturar bien todo junto' }
    ]
  },

  // 🍲 COMIDAS (5)
  {
    id: 'rec-com-01',
    name: 'Salmón Salvaje con Boniato y Espárragos',
    category: 'comida',
    tags: ['Antiinflamatorio', 'Omega 3', 'Paleo'],
    macros: { kcal: 510, protein: 35, carbs: 45, fats: 20 },
    ingredients: [
      { foodId: 'food-salmon', foodName: 'Lomo de salmón salvaje fresco', grams: 150, notes: 'Al horno o plancha' },
      { foodId: 'food-boniato', foodName: 'Boniato asado en bastones', grams: 200, notes: 'Asado en bastones' },
      { foodId: 'food-esparragos', foodName: 'Espárragos verdes trigueros', grams: 150, notes: 'Salteados con un toque de ajo' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 10, notes: 'Aliño en crudo' }
    ]
  },
  {
    id: 'rec-com-02',
    name: 'Clásico Fitness: Pollo, Arroz y Brócoli',
    category: 'comida',
    tags: ['Clásico', 'Bajo FODMAP', 'Baja Grasa'],
    macros: { kcal: 480, protein: 45, carbs: 60, fats: 6 },
    ingredients: [
      { foodId: 'food-pechuga-pollo', foodName: 'Pechuga de pollo a la plancha', grams: 180, notes: 'A la plancha con especias' },
      { foodId: 'food-arroz-basmati', foodName: 'Arroz blanco basmati aromático', grams: 70, notes: 'Peso en crudo' },
      { foodId: 'food-brocoli', foodName: 'Brócoli al vapor al dente', grams: 200, notes: 'Al vapor (al dente)' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 5, notes: 'Para hacer la pechuga' }
    ]
  },
  {
    id: 'rec-com-03',
    name: 'Ensalada de Quinoa, Garbanzos y Tahini',
    category: 'comida',
    tags: ['Vegano', 'Alto Hierro', 'Fibra'],
    macros: { kcal: 540, protein: 22, carbs: 65, fats: 18 },
    ingredients: [
      { foodId: 'food-quinoa', foodName: 'Quinoa real cocida', grams: 60, notes: 'Lavar bien antes de cocer' },
      { foodId: 'food-garbanzos-cocidos', foodName: 'Garbanzos cocidos en conserva', grams: 150, notes: 'Bien lavados y escurridos' },
      { foodId: 'food-tomate-cherry', foodName: 'Tomates cherry variados', grams: 100, notes: 'Cortados a la mitad' },
      { foodId: 'food-tahini', foodName: 'Tahini blanco 100% sésamo', grams: 20, notes: 'Para la vinagreta con limón' }
    ]
  },
  {
    id: 'rec-com-04',
    name: 'Pasta Integral con Boloñesa de Soja Texturizada',
    category: 'comida',
    tags: ['Vegetariano', 'Pre-Entreno', 'Rico en Calcio'],
    macros: { kcal: 580, protein: 32, carbs: 80, fats: 12 },
    ingredients: [
      { foodId: 'food-pasta-integral', foodName: 'Pasta 100% integral', grams: 90, notes: 'Peso en crudo' },
      { foodId: 'food-soja-texturizada-fina', foodName: 'Soja texturizada fina', grams: 40, notes: 'Hidratar 15 min antes' },
      { foodId: 'food-tomate-triturado', foodName: 'Tomate triturado natural', grams: 150, notes: 'Sin azúcares añadidos' },
      { foodId: 'food-queso-parmesano', foodName: 'Parmesano Reggiano curado', grams: 15, notes: 'Rallado por encima' }
    ]
  },
  {
    id: 'rec-com-05',
    name: 'Lentejas Estofadas Ligeras con Verduras',
    category: 'comida',
    tags: ['Tradicional', 'Hierro', 'Cuchara'],
    macros: { kcal: 450, protein: 25, carbs: 60, fats: 8 },
    ingredients: [
      { foodId: 'food-lenteja-pardina', foodName: 'Lenteja pardina selecta', grams: 80, notes: 'Peso en crudo' },
      { foodId: 'food-zanahoria', foodName: 'Zanahoria fresca', grams: 80, notes: 'En brunoise' },
      { foodId: 'food-puerro', foodName: 'Puerro limpio en rodajas', grams: 50, notes: 'En rodajas finas' },
      { foodId: 'food-patata', foodName: 'Patata agria chascada', grams: 100, notes: 'Chascada para espesar' }
    ]
  },

  // 🌙 CENAS (5)
  {
    id: 'rec-cen-01',
    name: 'Merluza al Papillote con Calabacín',
    category: 'cena',
    tags: ['Ligero', 'Baja Grasa', 'Fácil Digestión'],
    macros: { kcal: 280, protein: 32, carbs: 10, fats: 10 },
    ingredients: [
      { foodId: 'food-merluza', foodName: 'Lomo limpio de merluza de pincho', grams: 180, notes: 'Lomo limpio' },
      { foodId: 'food-calabacin', foodName: 'Calabacín en espirales', grams: 200, notes: 'En rodajas finas o espirales' },
      { foodId: 'food-cebolla', foodName: 'Cebolla dulce en juliana', grams: 50, notes: 'En juliana' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 10, notes: 'Cerrar bien el papel de aluminio' }
    ]
  },
  {
    id: 'rec-cen-02',
    name: 'Tortilla Francesa y Ensalada de Tomate',
    category: 'cena',
    tags: ['Rápido', 'Bajo Carbohidrato', 'Clásico'],
    macros: { kcal: 310, protein: 18, carbs: 12, fats: 20 },
    ingredients: [
      { foodId: 'food-huevo', foodName: 'Huevos camperos frescos', grams: 130, notes: '2 huevos enteros M' },
      { foodId: 'food-tomate-ensalada', foodName: 'Tomate de ensalada maduro', grams: 200, notes: 'En rodajas' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 15, notes: '10g para tomate, 5g sartén' },
      { foodId: 'food-oregano', foodName: 'Orégano seco silvestre', grams: 1, notes: 'Espolvorear sobre el tomate' }
    ]
  },
  {
    id: 'rec-cen-03',
    name: 'Tofu Salteado estilo Asiático con Setas',
    category: 'cena',
    tags: ['Vegano', 'Proteico', 'Sin Lactosa'],
    macros: { kcal: 340, protein: 24, carbs: 15, fats: 18 },
    ingredients: [
      { foodId: 'food-tofu-firme', foodName: 'Tofu firme prensado ecológico', grams: 150, notes: 'Escurrir bien y cortar en dados' },
      { foodId: 'food-setas-shiitake', foodName: 'Setas Shiitake en láminas', grams: 100, notes: 'En láminas' },
      { foodId: 'food-salsa-soja', foodName: 'Tamari o Salsa de soja baja en sodio', grams: 15, notes: 'Baja en sodio' },
      { foodId: 'food-aceite-sesamo', foodName: 'Aceite de sésamo tostado', grams: 5, notes: 'Añadir al final del salteado' }
    ]
  },
  {
    id: 'rec-cen-04',
    name: 'Crema de Calabaza con Huevo Duro',
    category: 'cena',
    tags: ['Reconfortante', 'Otoño', 'Fácil Masticación'],
    macros: { kcal: 320, protein: 16, carbs: 35, fats: 14 },
    ingredients: [
      { foodId: 'food-calabaza', foodName: 'Calabaza asada dulce', grams: 300, notes: 'Asada o hervida' },
      { foodId: 'food-huevo', foodName: 'Huevo duro de gallinas camperas', grams: 65, notes: '1 huevo duro picado por encima' },
      { foodId: 'food-pipas-calabaza', foodName: 'Semillas de calabaza tostadas', grams: 10, notes: 'Tostadas para decorar' },
      { foodId: 'food-aove', foodName: 'Aceite de oliva virgen extra', grams: 5, notes: 'Un hilo en crudo al servir' }
    ]
  },
  {
    id: 'rec-cen-05',
    name: 'Pizza con Base de Coliflor (Fit)',
    category: 'cena',
    tags: ['Keto', 'Cheat Meal Fit', 'Saciante'],
    macros: { kcal: 410, protein: 35, carbs: 20, fats: 22 },
    ingredients: [
      { foodId: 'food-coliflor', foodName: 'Coliflor fresca triturada', grams: 200, notes: 'Triturada y escurrida (para la base)' },
      { foodId: 'food-huevo', foodName: 'Huevo campero para ligar', grams: 65, notes: 'Para amasar la base' },
      { foodId: 'food-mozzarella-ligera', foodName: 'Mozzarella rallada ligera', grams: 50, notes: 'Para gratinar' },
      { foodId: 'food-jamon-cocido', foodName: 'Jamón cocido extra >92%', grams: 50, notes: 'En tiras' }
    ]
  },

  // 🍎 SNACKS Y MERIENDAS (5)
  {
    id: 'rec-snk-01',
    name: 'Yogur Griego con Nueces y Chocolate 85%',
    category: 'merienda',
    tags: ['Saciante', 'Grasas Saludables', 'Antioxidante'],
    macros: { kcal: 290, protein: 12, carbs: 15, fats: 22 },
    ingredients: [
      { foodId: 'food-yogur-griego', foodName: 'Yogur griego auténtico natural', grams: 150, notes: 'Natural sin azúcar' },
      { foodId: 'food-nueces', foodName: 'Nueces de California crudas', grams: 15, notes: 'Picadas' },
      { foodId: 'food-chocolate-85', foodName: 'Chocolate negro 85% cacao', grams: 15, notes: 'Rallado o en trozos pequeños' }
    ]
  },
  {
    id: 'rec-snk-02',
    name: 'Hummus Clásico con Crudités',
    category: 'merienda',
    tags: ['Vegano', 'Picoteo Sano', 'Fibra'],
    macros: { kcal: 250, protein: 10, carbs: 25, fats: 14 },
    ingredients: [
      { foodId: 'food-hummus', foodName: 'Hummus tradicional de garbanzo', grams: 70, notes: 'Ración generosa' },
      { foodId: 'food-zanahoria', foodName: 'Bastones de zanahoria fresca', grams: 100, notes: 'En bastones (crudités)' },
      { foodId: 'food-apio', foodName: 'Bastones de apio crujiente', grams: 50, notes: 'En bastones' }
    ]
  },
  {
    id: 'rec-snk-03',
    name: 'Manzana con Crema de Cacahuete',
    category: 'merienda',
    tags: ['Rápido', 'Pre-Entreno Ligero', 'Dulce'],
    macros: { kcal: 210, protein: 6, carbs: 25, fats: 10 },
    ingredients: [
      { foodId: 'food-manzana', foodName: 'Manzana Fuji con piel', grams: 150, notes: '1 manzana mediana en gajos' },
      { foodId: 'food-crema-cacahuete', foodName: 'Crema de cacahuete pura 100%', grams: 20, notes: 'Untada en los gajos' }
    ]
  },
  {
    id: 'rec-snk-04',
    name: 'Queso Fresco Batido con Almendras',
    category: 'merienda',
    tags: ['Proteico', 'Saciante', 'Low-Carb'],
    macros: { kcal: 220, protein: 20, carbs: 10, fats: 12 },
    ingredients: [
      { foodId: 'food-queso-fresco-batido', foodName: 'Queso fresco batido 0%', grams: 200, notes: '0% M.G.' },
      { foodId: 'food-almendras-tostadas', foodName: 'Almendras tostadas sin sal', grams: 20, notes: 'Sin sal añadida' },
      { foodId: 'food-frambuesas', foodName: 'Frambuesas frescas', grams: 50, notes: 'Para dar sabor y color' }
    ]
  },
  {
    id: 'rec-snk-05',
    name: 'Edamame Especiado y Té Verde',
    category: 'merienda',
    tags: ['Ligero', 'Salado', 'Antioxidante'],
    macros: { kcal: 120, protein: 11, carbs: 10, fats: 5 },
    ingredients: [
      { foodId: 'food-edamame', foodName: 'Edamame al vapor', grams: 100, notes: 'Cocido, peso sin vaina' },
      { foodId: 'food-pimenton-picante', foodName: 'Pimentón de la Vera picante', grams: 2, notes: 'Espolvorear con sal en escamas' },
      { foodId: 'food-te-verde', foodName: 'Infusión de Té verde Sencha', grams: 200, notes: 'Infusión, sin calorías' }
    ]
  }
];

export const RECIPES_CATALOG = mockRecipes;
