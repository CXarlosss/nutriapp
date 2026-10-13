import type { DietItem, MealSlotType, DayDemandType } from '../../../../types/diet';

interface GenerateVariantRequest {
  dayIndex: number;
  dietId?: string;
  demandType?: DayDemandType;
  targetKcal?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  currentFoodNames?: string[];
}

export async function POST(req: Request) {
  try {
    const body: GenerateVariantRequest = await req.json();
    const dayIndex = body.dayIndex || 1;
    const demandType: DayDemandType = body.demandType || 'entrenamiento_pesado';
    const dietId = body.dietId || 'diet-demo-1';

    // Simulación de latencia de red de inferencia IA (1.5 segundos)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const timestamp = Date.now();

    let items: DietItem[] = [];
    let variantTitle = '';
    let rationale = '';

    if (demandType === 'entrenamiento_pesado' || demandType === 'refeed') {
      variantTitle =
        demandType === 'refeed'
          ? 'Variante Refeed Glucogénico (Carga Alta)'
          : 'Variante Atlética de Alto Rendimiento (High Carb)';
      rationale =
        'Composición glucogénica enfocada en repletar depósitos de glucógeno y sostener la potencia en sentadilla/pesos muertos sin exceder el aporte lipídico.';

      items = [
        // Desayuno
        {
          id: `ai-item-${dayIndex}-1-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 0,
          foodId: 'f-c-1',
          foodName: 'Copos de avena suaves en gachas',
          quantity: 80,
          unit: 'g',
          kcal: 303,
          proteinG: 10.8,
          carbsG: 54.4,
          fatG: 5.2,
          fiberG: 8.5,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-2-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 1,
          foodId: 'f-p-9',
          foodName: 'Claras de huevo pasteurizadas',
          quantity: 200,
          unit: 'g',
          kcal: 104,
          proteinG: 22.0,
          carbsG: 1.4,
          fatG: 0.4,
          fiberG: 0.0,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-3-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 2,
          foodId: 'f-fr-1',
          foodName: 'Plátano maduro en rodajas',
          quantity: 120,
          unit: 'g',
          kcal: 107,
          proteinG: 1.3,
          carbsG: 27.6,
          fatG: 0.4,
          fiberG: 3.1,
          isModified: true,
        },

        // Media Mañana
        {
          id: `ai-item-${dayIndex}-4-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'media_manana',
          position: 0,
          foodId: 'f-l-1',
          foodName: 'Yogur griego 0% grasa natural',
          quantity: 200,
          unit: 'g',
          kcal: 118,
          proteinG: 20.0,
          carbsG: 7.2,
          fatG: 0.0,
          calciumMg: 220,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-5-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'media_manana',
          position: 1,
          foodId: 'f-fr-2',
          foodName: 'Manzana con piel laminada',
          quantity: 180,
          unit: 'g',
          kcal: 94,
          proteinG: 0.5,
          carbsG: 25.2,
          fatG: 0.4,
          fiberG: 4.3,
          isModified: true,
        },

        // Comida
        {
          id: `ai-item-${dayIndex}-6-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 0,
          foodId: 'f-p-3',
          foodName: 'Lomo de ternera magra a la plancha',
          quantity: 180,
          unit: 'g',
          kcal: 324,
          proteinG: 46.8,
          carbsG: 0.0,
          fatG: 13.5,
          ironMg: 2.5,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-7-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 1,
          foodId: 'f-c-5',
          foodName: 'Boniato / Batata al horno',
          quantity: 300,
          unit: 'g',
          kcal: 270,
          proteinG: 6.0,
          carbsG: 62.1,
          fatG: 0.3,
          fiberG: 9.9,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-8-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 2,
          foodId: 'f-g-1',
          foodName: 'Aceite de oliva virgen extra',
          quantity: 10,
          unit: 'ml',
          kcal: 88,
          proteinG: 0.0,
          carbsG: 0.0,
          fatG: 10.0,
          isModified: true,
        },

        // Merienda
        {
          id: `ai-item-${dayIndex}-9-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'merienda',
          position: 0,
          foodId: 'f-p-10',
          foodName: 'Proteína de suero Whey isolate',
          quantity: 35,
          unit: 'g',
          kcal: 130,
          proteinG: 29.8,
          carbsG: 1.1,
          fatG: 0.5,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-10-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'merienda',
          position: 1,
          foodId: 'f-c-4',
          foodName: 'Pan de centeno 100% integral',
          quantity: 60,
          unit: 'g',
          kcal: 145,
          proteinG: 5.1,
          carbsG: 28.8,
          fatG: 0.9,
          fiberG: 3.9,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-11-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'merienda',
          position: 2,
          foodId: 'f-g-4',
          foodName: 'Crema de cacahuete 100% natural',
          quantity: 15,
          unit: 'g',
          kcal: 93,
          proteinG: 3.8,
          carbsG: 1.8,
          fatG: 7.5,
          isModified: true,
        },

        // Cena
        {
          id: `ai-item-${dayIndex}-12-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 0,
          foodId: 'f-p-6',
          foodName: 'Merluza fresca al vapor',
          quantity: 220,
          unit: 'g',
          kcal: 189,
          proteinG: 37.4,
          carbsG: 0.0,
          fatG: 4.0,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-13-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 1,
          foodId: 'f-c-2',
          foodName: 'Arroz blanco basmati hervido',
          quantity: 65,
          unit: 'g',
          kcal: 231,
          proteinG: 4.9,
          carbsG: 51.4,
          fatG: 0.4,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-14-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 2,
          foodId: 'f-v-1',
          foodName: 'Brócoli al vapor',
          quantity: 150,
          unit: 'g',
          kcal: 51,
          proteinG: 4.2,
          carbsG: 9.9,
          fatG: 0.6,
          fiberG: 3.9,
          isModified: true,
        },
      ];
    } else {
      // Día de Descanso o Moderado (Low Carb / Densidad Lipídica)
      variantTitle = 'Variante de Descanso y Recuperación (Low Carb)';
      rationale =
        'Estrategia reducida en carbohidratos complejos, con mayor presencia de ácidos grasos esenciales (Omega-3 de pescado azul y monoinsaturados de AOVE) para regeneración muscular y saciedad.';

      items = [
        // Desayuno
        {
          id: `ai-item-${dayIndex}-1-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 0,
          foodId: 'f-pg-2',
          foodName: 'Huevos camperos revueltos',
          quantity: 110,
          unit: 'g',
          kcal: 157,
          proteinG: 13.9,
          carbsG: 0.8,
          fatG: 10.5,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-2-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 1,
          foodId: 'f-p-9',
          foodName: 'Claras de huevo pasteurizadas',
          quantity: 120,
          unit: 'g',
          kcal: 62,
          proteinG: 13.2,
          carbsG: 0.8,
          fatG: 0.2,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-3-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 2,
          foodId: 'f-g-2',
          foodName: 'Aguacate Hass en rodajas',
          quantity: 60,
          unit: 'g',
          kcal: 96,
          proteinG: 1.2,
          carbsG: 5.1,
          fatG: 8.8,
          fiberG: 4.0,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-4-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'desayuno',
          position: 3,
          foodId: 'f-c-4',
          foodName: 'Pan de centeno 100% integral',
          quantity: 45,
          unit: 'g',
          kcal: 108,
          proteinG: 3.8,
          carbsG: 21.6,
          fatG: 0.7,
          fiberG: 2.9,
          isModified: true,
        },

        // Media Mañana
        {
          id: `ai-item-${dayIndex}-5-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'media_manana',
          position: 0,
          foodId: 'f-l-2',
          foodName: 'Queso fresco batido 0%',
          quantity: 200,
          unit: 'g',
          kcal: 92,
          proteinG: 17.0,
          carbsG: 7.0,
          fatG: 0.2,
          calciumMg: 240,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-6-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'media_manana',
          position: 1,
          foodId: 'f-g-3',
          foodName: 'Nueces crudas peladas',
          quantity: 15,
          unit: 'g',
          kcal: 98,
          proteinG: 2.3,
          carbsG: 2.1,
          fatG: 9.8,
          omega3G: 1.4,
          isModified: true,
        },

        // Comida
        {
          id: `ai-item-${dayIndex}-7-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 0,
          foodId: 'f-p-4',
          foodName: 'Lomo de cerdo magro a la plancha',
          quantity: 180,
          unit: 'g',
          kcal: 257,
          proteinG: 48.6,
          carbsG: 0.0,
          fatG: 6.8,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-8-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 1,
          foodId: 'f-c-6',
          foodName: 'Boniato / Batata al horno',
          quantity: 120,
          unit: 'g',
          kcal: 108,
          proteinG: 2.4,
          carbsG: 24.8,
          fatG: 0.1,
          fiberG: 4.0,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-9-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'comida',
          position: 2,
          foodId: 'f-g-1',
          foodName: 'Aceite de oliva virgen extra',
          quantity: 10,
          unit: 'ml',
          kcal: 88,
          proteinG: 0.0,
          carbsG: 0.0,
          fatG: 10.0,
          isModified: true,
        },

        // Merienda
        {
          id: `ai-item-${dayIndex}-10-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'merienda',
          position: 0,
          foodId: 'f-p-10',
          foodName: 'Proteína de suero Whey isolate',
          quantity: 30,
          unit: 'g',
          kcal: 111,
          proteinG: 25.5,
          carbsG: 0.9,
          fatG: 0.5,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-11-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'merienda',
          position: 1,
          foodId: 'f-fr-2',
          foodName: 'Manzana con piel',
          quantity: 120,
          unit: 'g',
          kcal: 62,
          proteinG: 0.4,
          carbsG: 16.8,
          fatG: 0.2,
          fiberG: 2.9,
          isModified: true,
        },

        // Cena
        {
          id: `ai-item-${dayIndex}-12-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 0,
          foodId: 'f-pg-1',
          foodName: 'Salmón fresco al horno con eneldo',
          quantity: 170,
          unit: 'g',
          kcal: 354,
          proteinG: 34.0,
          carbsG: 0.0,
          fatG: 22.1,
          omega3G: 3.7,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-13-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 1,
          foodId: 'f-v-1',
          foodName: 'Brócoli al vapor',
          quantity: 180,
          unit: 'g',
          kcal: 61,
          proteinG: 5.0,
          carbsG: 11.9,
          fatG: 0.7,
          fiberG: 4.7,
          isModified: true,
        },
        {
          id: `ai-item-${dayIndex}-14-${timestamp}`,
          dietId,
          dayIndex,
          mealSlot: 'cena',
          position: 2,
          foodId: 'f-g-1',
          foodName: 'Aceite de oliva virgen extra',
          quantity: 5,
          unit: 'ml',
          kcal: 44,
          proteinG: 0.0,
          carbsG: 0.0,
          fatG: 5.0,
          isModified: true,
        },
      ];
    }

    const totalKcal = items.reduce((acc, it) => acc + (it.kcal || 0), 0);
    const totalProteinG = Number(items.reduce((acc, it) => acc + (it.proteinG || 0), 0).toFixed(1));
    const totalCarbsG = Number(items.reduce((acc, it) => acc + (it.carbsG || 0), 0).toFixed(1));
    const totalFatG = Number(items.reduce((acc, it) => acc + (it.fatG || 0), 0).toFixed(1));

    const targetKcal = body.targetKcal || (demandType === 'entrenamiento_pesado' ? 2250 : 1700);
    const variancePercent = Number((Math.abs(totalKcal - targetKcal) / targetKcal * 100).toFixed(2));

    return Response.json({
      success: true,
      dayIndex,
      demandType,
      meta: {
        variantTitle,
        generationTimeMs: 1500,
        model: 'NutriApp-Clinical-Variant-Generator-v2',
        rationale,
      },
      summary: {
        totalKcal,
        totalProteinG,
        totalCarbsG,
        totalFatG,
        targetKcal,
        variancePercent,
      },
      items,
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err.message || 'Error al generar la variante con IA',
      },
      { status: 500 }
    );
  }
}
