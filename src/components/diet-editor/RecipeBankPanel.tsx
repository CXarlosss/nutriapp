'use client';

import React, { useState, useMemo } from 'react';
import {
  IconSearch,
  IconClock,
  IconFlame,
  IconGripVertical,
  IconPlus,
  IconToolsKitchen2,
  IconTag,
  IconCheck,
} from '@tabler/icons-react';
import { Badge, Button, Input } from '@/components/ui/nutri-ui';
import { RECIPES_CATALOG } from '@/lib/data/mockRecipes';
import { Recipe, RecipeDragPayload } from '@/types/diet';
import { useDietStore } from '@/lib/stores/useDietStore';

interface RecipeBankPanelProps {
  onRecipeAdded?: (recipeName: string) => void;
}

export const RecipeBankPanel: React.FC<RecipeBankPanelProps> = ({ onRecipeAdded }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [addedRecipeId, setAddedRecipeId] = useState<string | null>(null);

  const { focusedCell, unpackRecipeToSlot } = useDietStore();

  const categories = [
    { key: 'todos', label: 'Todos' },
    { key: 'desayuno', label: 'Desayuno' },
    { key: 'comida', label: 'Comidas' },
    { key: 'merienda', label: 'Meriendas' },
  ];

  const filteredRecipes = useMemo(() => {
    return RECIPES_CATALOG.filter((recipe) => {
      const matchCat =
        selectedCategory === 'todos' || recipe.category === selectedCategory;
      const matchSearch =
        recipe.name.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        recipe.ingredients.some((i) => i.foodName.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const handleDragStart = (e: React.DragEvent, recipe: Recipe) => {
    const payload: RecipeDragPayload = {
      type: 'RECIPE',
      recipeId: recipe.id,
      name: recipe.name,
      items: recipe.ingredients.map((ing) => ({
        foodId: ing.foodId,
        foodName: ing.foodName,
        grams: ing.grams,
        unit: ing.unit || 'g',
        kcal: ing.kcal,
        proteinG: ing.proteinG,
        carbsG: ing.carbsG,
        fatG: ing.fatG,
        notes: ing.notes,
      })),
    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', recipe.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddDirectly = (recipe: Recipe) => {
    const targetDay = focusedCell?.dayIndex || 1;
    const targetSlot = focusedCell?.mealSlot || 'desayuno';

    const payload: RecipeDragPayload = {
      type: 'RECIPE',
      recipeId: recipe.id,
      name: recipe.name,
      items: recipe.ingredients.map((ing) => ({
        foodId: ing.foodId,
        foodName: ing.foodName,
        grams: ing.grams,
        unit: ing.unit || 'g',
        kcal: ing.kcal,
        proteinG: ing.proteinG,
        carbsG: ing.carbsG,
        fatG: ing.fatG,
        notes: ing.notes,
      })),
    };

    unpackRecipeToSlot(targetDay, targetSlot, payload);
    setAddedRecipeId(recipe.id);
    if (onRecipeAdded) onRecipeAdded(recipe.name);
    setTimeout(() => setAddedRecipeId(null), 1500);
  };

  return (
    <div className="flex flex-col h-full space-y-3 p-3 overflow-hidden text-[13px]">
      {/* Banner de instrucción Drag & Drop */}
      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-2">
        <span className="text-[14px]">🧲</span>
        <div>
          <strong className="font-semibold block text-[12px]">Desempaquetado Mágico (Drag & Drop)</strong>
          Arrastra cualquier plato a la cuadrícula: se descompondrá en sus ingredientes individuales atómicos a 60 FPS.
        </div>
      </div>

      {/* Buscador de recetas */}
      <div className="relative">
        <Input
          icon={<IconSearch size={14} className="text-[var(--text-secondary)]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receta o ingrediente..."
          className="text-[12px] h-[32px]"
        />
      </div>

      {/* Filtros de categoría */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-colors shrink-0 ${
              selectedCategory === cat.key
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de Recetas Draggables */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)] text-[12px]">
            No se encontraron platos que coincidan con la búsqueda.
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const isJustAdded = addedRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                draggable
                onDragStart={(e) => handleDragStart(e, recipe)}
                className="group relative p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-purple-500/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <IconGripVertical
                      size={16}
                      className="text-[var(--text-muted)] group-hover:text-purple-500 shrink-0 mt-0.5"
                    />
                    <h4 className="text-[13px] font-[600] text-[var(--text)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug line-clamp-2">
                      {recipe.name}
                    </h4>
                  </div>
                  <Badge variant="brand" className="shrink-0 text-[10px] px-1.5 py-0.5">
                    {recipe.totalKcal} kcal
                  </Badge>
                </div>

                {/* Macros y tiempo */}
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-mono mb-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    P: {recipe.proteinG}g
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    C: {recipe.carbsG}g
                  </span>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    G: {recipe.fatG}g
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <IconClock size={11} /> {recipe.prepTimeMinutes}m
                  </span>
                </div>

                {/* Desglose de Ingredientes Atómicos (Píldoras) */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-[4px] bg-[var(--card-subtle)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)]"
                    >
                      {ing.foodName} <strong className="font-mono text-[var(--text)]">{ing.grams}g</strong>
                    </span>
                  ))}
                </div>

                {/* Botón de Inserción Rápida con 1 clic al slot enfocado */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                  <span>Arrastra o pulsa +</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddDirectly(recipe);
                    }}
                    className={`h-[22px] px-2 rounded-[5px] text-[10px] font-medium flex items-center gap-1 transition-colors ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-500/20'
                    }`}
                    title="Insertar en el día y horario actualmente seleccionado"
                  >
                    {isJustAdded ? (
                      <>
                        <IconCheck size={11} />
                        <span>¡Desempaquetado!</span>
                      </>
                    ) : (
                      <>
                        <IconPlus size={11} />
                        <span>Añadir a selección</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
