'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IconSearch,
  IconClock,
  IconFlame,
  IconGripVertical,
  IconPlus,
  IconToolsKitchen2,
  IconTag,
  IconCheck,
  IconTrash,
  IconBookmarkPlus,
} from '@tabler/icons-react';
import { Badge, Button, Input, EmptyState } from '@/components/ui/nutri-ui';
import { Recipe, RecipeDragPayload, DietItem } from '@/types/diet';
import { useDietStore } from '@/lib/stores/useDietStore';
import { useRecipeStore } from '@/lib/stores/useRecipeStore';
import { SaveAsRecipeModal } from './SaveAsRecipeModal';

interface RecipeBankPanelProps {
  onRecipeAdded?: (recipeName: string) => void;
}

export const RecipeBankPanel: React.FC<RecipeBankPanelProps> = ({ onRecipeAdded }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [addedRecipeId, setAddedRecipeId] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modalInitialItems, setModalInitialItems] = useState<DietItem[]>([]);

  const { focusedCell, getItemsForSlot, unpackRecipeToSlot } = useDietStore();
  const { recipes, deleteRecipe } = useRecipeStore();

  const categories = [
    { key: 'todos', label: 'Todos' },
    { key: 'desayuno', label: 'Desayuno' },
    { key: 'comida', label: 'Comidas' },
    { key: 'cena', label: 'Cenas' },
    { key: 'merienda', label: 'Meriendas' },
  ];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchCat =
        selectedCategory === 'todos' || recipe.category === selectedCategory;
      const matchSearch =
        recipe.name.toLowerCase().includes(search.toLowerCase()) ||
        recipe.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        recipe.ingredients.some((i) =>
          (i.foodName || i.foodId).toLowerCase().includes(search.toLowerCase())
        );
      return matchCat && matchSearch;
    });
  }, [recipes, search, selectedCategory]);

  const handleDragStart = (e: React.DragEvent, recipe: Recipe) => {
    const payload: RecipeDragPayload = {
      type: 'RECIPE',
      recipeId: recipe.id,
      name: recipe.name,
      items: recipe.ingredients.map((ing) => ({
        foodId: ing.foodId,
        foodName: ing.foodName || ing.foodId.replace('food-', '').replace(/-/g, ' '),
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
        foodName: ing.foodName || ing.foodId.replace('food-', '').replace(/-/g, ' '),
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nutriapp:recipe-unpacked', {
          detail: { dayIndex: targetDay, mealSlot: targetSlot, name: recipe.name },
        })
      );
    }
    setAddedRecipeId(recipe.id);
    if (onRecipeAdded) onRecipeAdded(recipe.name);
    setTimeout(() => setAddedRecipeId(null), 1500);
  };

  // Guardar los alimentos de la celda actualmente seleccionada en la cuadrícula como una nueva receta
  const handleOpenSaveCurrentSlot = () => {
    if (focusedCell) {
      const itemsInSlot = getItemsForSlot(focusedCell.dayIndex, focusedCell.mealSlot);
      setModalInitialItems(itemsInSlot);
    } else {
      setModalInitialItems([]);
    }
    setIsSaveModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-3 p-3 overflow-hidden text-[13px]">
      {/* Banner de instrucción Drag & Drop y botón de Guardar Receta */}
      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <span className="text-[14px]">🧲</span>
          <div className="leading-snug">
            <strong className="font-semibold block text-[12px]">Desempaquetado Mágico (Drag & Drop)</strong>
            <span>Arrastra cualquier plato a la cuadrícula: se descompondrá en sus ingredientes atómicos a 60 FPS.</span>
          </div>
        </div>
      </div>

      {/* Botón destacado: Guardar Receta */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          onClick={handleOpenSaveCurrentSlot}
          className="w-full h-[32px] px-3 text-[12px] border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 flex items-center justify-center gap-1.5 shadow-xs"
          title="Crear una receta a partir de los alimentos de la celda activa o desde cero"
        >
          <IconBookmarkPlus size={15} className="text-purple-600 dark:text-purple-400" />
          <span>+ Guardar Nueva Receta</span>
        </Button>
      </div>

      {/* Buscador de recetas */}
      <div className="relative">
        <Input
          icon={<IconSearch size={14} className="text-[var(--text-secondary)]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar entre las 20 recetas..."
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
          <EmptyState
            preset="recipe-search-empty"
            size="sm"
            title={search ? `Sin platos para "${search}"` : 'No hay recetas en esta categoría'}
            description={
              search
                ? '¿Tienes una combinación favorita? Puedes crear una nueva receta personalizada o limpiar el buscador.'
                : 'Añade tu primera receta personalizada para agilizar la planificación semanal.'
            }
            actionLabel="Crear receta personalizada"
            onAction={() => {
              setModalInitialItems(
                focusedCell ? getItemsForSlot(focusedCell.dayIndex, focusedCell.mealSlot) : []
              );
              setIsSaveModalOpen(true);
            }}
            secondaryActionLabel={search ? 'Limpiar búsqueda' : undefined}
            onSecondaryAction={search ? () => setSearch('') : undefined}
          />
        ) : (
          filteredRecipes.map((recipe) => {
            const isJustAdded = addedRecipeId === recipe.id;
            const kcal = recipe.totalKcal || recipe.macros?.kcal || 0;
            const protein = recipe.proteinG || recipe.macros?.protein || 0;
            const carbs = recipe.carbsG || recipe.macros?.carbs || 0;
            const fats = recipe.fatG || recipe.macros?.fats || 0;
            const isCustom = recipe.id.startsWith('rec-custom-');

            return (
              <motion.div
                key={recipe.id}
                draggable
                onDragStart={(e: any) => handleDragStart(e, recipe)}
                whileHover={{ scale: 1.018 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="group relative p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-purple-500/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <IconGripVertical
                      size={16}
                      className="text-[var(--text-muted)] group-hover:text-purple-500 shrink-0 mt-0.5"
                    />
                    <h4 className="text-[13px] font-[600] text-[var(--text)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug line-clamp-2">
                      {recipe.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isCustom && (
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.88 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecipe(recipe.id);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--danger-text)] p-0.5 cursor-pointer"
                        title="Eliminar receta personalizada"
                      >
                        <IconTrash size={12} />
                      </motion.button>
                    )}
                    <Badge variant="brand" className="text-[10px] px-1.5 py-0.5 font-mono">
                      {kcal} kcal
                    </Badge>
                  </div>
                </div>

                {/* Macros */}
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-mono mb-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    P: {protein}g
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    C: {carbs}g
                  </span>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    G: {fats}g
                  </span>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 truncate max-w-[80px]">
                        {recipe.tags[0]}
                      </span>
                    </>
                  )}
                </div>

                {/* Desglose de Ingredientes Atómicos */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.ingredients.map((ing, idx) => {
                    const cleanName = ing.foodName || ing.foodId.replace('food-', '').replace(/-/g, ' ');
                    return (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded-[4px] bg-[var(--card-subtle)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)]"
                      >
                        {cleanName} <strong className="font-mono text-[var(--text)]">{ing.grams}g</strong>
                      </span>
                    );
                  })}
                </div>

                {/* Botón de Inserción Rápida con 1 clic al slot enfocado */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                  <span>Arrastra o pulsa +</span>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddDirectly(recipe);
                    }}
                    className={`h-[22px] px-2 rounded-[5px] text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
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
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal para Guardar Receta */}
      <SaveAsRecipeModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        defaultCategory={focusedCell?.mealSlot || 'desayuno'}
        initialItems={modalInitialItems}
      />
    </div>
  );
};
