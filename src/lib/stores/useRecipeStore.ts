import { create } from 'zustand';
import { Recipe } from '@/types/diet';
import { mockRecipes } from '@/lib/data/mockRecipes';
import {
  safeLocalStorageGet,
  resilientSave,
  resilientSyncWithIndexedDb,
} from '@/lib/storage/resilientStorage';

interface RecipeStoreState {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Recipe;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

const STORAGE_KEY = 'nutriapp_custom_recipes';

function getInitialRecipes(): Recipe[] {
  const customList = safeLocalStorageGet<Recipe[]>(STORAGE_KEY, []);
  if (Array.isArray(customList) && customList.length > 0) {
    // Unir recetas custom guardadas por el usuario con las recetas maestras base
    const customIds = new Set(customList.map((r: Recipe) => r.id));
    const filteredDefaults = mockRecipes.filter((r) => !customIds.has(r.id));
    return [...customList, ...filteredDefaults];
  }
  return mockRecipes;
}

export const useRecipeStore = create<RecipeStoreState>((set, get) => ({
  recipes: getInitialRecipes(),

  addRecipe: (data) => {
    const calculatedKcal =
      data.totalKcal ||
      data.macros?.kcal ||
      data.ingredients.reduce((acc, curr) => acc + (curr.kcal || 0), 0) ||
      350;

    const calculatedProtein =
      data.proteinG ||
      data.macros?.protein ||
      data.ingredients.reduce((acc, curr) => acc + (curr.proteinG || 0), 0) ||
      20;

    const calculatedCarbs =
      data.carbsG ||
      data.macros?.carbs ||
      data.ingredients.reduce((acc, curr) => acc + (curr.carbsG || 0), 0) ||
      30;

    const calculatedFats =
      data.fatG ||
      data.macros?.fats ||
      data.ingredients.reduce((acc, curr) => acc + (curr.fatG || 0), 0) ||
      10;

    const newRecipe: Recipe = {
      id: `rec-custom-${Date.now()}`,
      name: data.name.trim() || 'Receta Personalizada',
      category: data.category || 'general',
      prepTimeMinutes: data.prepTimeMinutes || 15,
      totalKcal: calculatedKcal,
      proteinG: calculatedProtein,
      carbsG: calculatedCarbs,
      fatG: calculatedFats,
      macros: {
        kcal: calculatedKcal,
        protein: calculatedProtein,
        carbs: calculatedCarbs,
        fats: calculatedFats,
      },
      tags: data.tags?.length > 0 ? data.tags : ['Personalizada'],
      notes: data.notes || '',
      ingredients: data.ingredients,
    };

    set((state) => {
      const updated = [newRecipe, ...state.recipes];
      const onlyCustom = updated.filter((r) => r.id.startsWith('rec-custom-'));
      // Persistencia híbrida a prueba de QuotaExceededError (IndexedDB + localStorage)
      resilientSave(STORAGE_KEY, onlyCustom);
      return { recipes: updated };
    });

    return newRecipe;
  },

  deleteRecipe: (id: string) => {
    set((state) => {
      const updated = state.recipes.filter((r) => r.id !== id);
      const onlyCustom = updated.filter((r) => r.id.startsWith('rec-custom-'));
      // Persistencia híbrida a prueba de QuotaExceededError (IndexedDB + localStorage)
      resilientSave(STORAGE_KEY, onlyCustom);
      return { recipes: updated };
    });
  },

  getRecipeById: (id: string) => {
    return get().recipes.find((r) => r.id === id);
  },
}));

// Sincronización transparente con IndexedDB (capacidad ilimitada) en cliente
if (typeof window !== 'undefined') {
  resilientSyncWithIndexedDb<Recipe[]>(
    STORAGE_KEY,
    safeLocalStorageGet<Recipe[]>(STORAGE_KEY, []),
    (idbCustomRecipes) => {
      if (Array.isArray(idbCustomRecipes) && idbCustomRecipes.length > 0) {
        const customIds = new Set(idbCustomRecipes.map((r) => r.id));
        const filteredDefaults = mockRecipes.filter((r) => !customIds.has(r.id));
        useRecipeStore.setState({ recipes: [...idbCustomRecipes, ...filteredDefaults] });
      }
    }
  );
}
