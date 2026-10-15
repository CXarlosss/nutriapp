'use client';

import React, { useState } from 'react';
import {
  IconX,
  IconToolsKitchen2,
  IconCheck,
  IconPlus,
  IconTag,
  IconFlame,
  IconClock,
  IconTrash,
} from '@tabler/icons-react';
import { Button, Input, Badge } from '@/components/ui/nutri-ui';
import { useRecipeStore } from '@/lib/stores/useRecipeStore';
import { RecipeIngredient, MealSlotType, DietItem } from '@/types/diet';

interface SaveAsRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: MealSlotType | 'general';
  initialItems?: DietItem[];
  onSuccess?: (recipeName: string) => void;
}

const POPULAR_TAGS = [
  'Alto en Proteína',
  'Omega 3',
  'Antiinflamatorio',
  'Saciante',
  'Bajo FODMAP',
  'Sin Gluten',
  'Keto',
  'Rápido',
  'Meal Prep',
  'Vegano',
];

export const SaveAsRecipeModal: React.FC<SaveAsRecipeModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'desayuno',
  initialItems = [],
  onSuccess,
}) => {
  const { addRecipe } = useRecipeStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>(defaultCategory || 'desayuno');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Saciante']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Ingredientes editables
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((item) => ({
        foodId: item.foodId || `f-${Date.now()}`,
        foodName: item.foodName,
        grams: item.quantity || 100,
        unit: item.unit || 'g',
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        notes: item.notes,
      }));
    }
    return [
      { foodId: 'food-avena', foodName: 'Avena en copos suaves', grams: 50, kcal: 190, proteinG: 6.8, carbsG: 34.0, fatG: 3.3 },
      { foodId: 'food-yogur', foodName: 'Yogur griego 0%', grams: 150, kcal: 89, proteinG: 15.0, carbsG: 5.4, fatG: 0 },
    ];
  });

  if (!isOpen) return null;

  // Totales calculados
  const totalKcal = Math.round(ingredients.reduce((acc, curr) => acc + (curr.kcal || 0), 0));
  const totalProtein = Number(ingredients.reduce((acc, curr) => acc + (curr.proteinG || 0), 0).toFixed(1));
  const totalCarbs = Number(ingredients.reduce((acc, curr) => acc + (curr.carbsG || 0), 0).toFixed(1));
  const totalFat = Number(ingredients.reduce((acc, curr) => acc + (curr.fatG || 0), 0).toFixed(1));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addRecipe({
      name: name.trim(),
      category,
      prepTimeMinutes,
      totalKcal,
      proteinG: totalProtein,
      carbsG: totalCarbs,
      fatG: totalFat,
      tags: selectedTags,
      notes: notes.trim(),
      ingredients,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (onSuccess) onSuccess(name.trim());
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <IconToolsKitchen2 size={20} stroke={1.75} />
            </div>
            <div>
              <h2 className="text-[16px] font-[600] text-[var(--text)]">
                Guardar en Banco de Recetas
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Crea un plato reutilizable listo para arrastrar y desempaquetar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto text-[13px] flex-1">
          {/* Métricas estimadas */}
          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border)] text-center font-mono">
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Calorías</span>
              <span className="text-[13px] font-bold text-[var(--text)]">{totalKcal} kcal</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 uppercase block">Proteína</span>
              <span className="text-[13px] font-bold text-emerald-600">{totalProtein}g</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-600 uppercase block">Carbos</span>
              <span className="text-[13px] font-bold text-amber-600">{totalCarbs}g</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-600 uppercase block">Grasas</span>
              <span className="text-[13px] font-bold text-blue-600">{totalFat}g</span>
            </div>
          </div>

          {/* Nombre y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium text-[var(--text)] block mb-1">
                Nombre de la receta *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tortilla Rápida de Espinacas"
                required
                autoFocus
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--text)] block mb-1">
                Comida recomendada
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-[36px] rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-2.5 text-[12px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)]"
              >
                <option value="desayuno">Desayuno</option>
                <option value="comida">Comida</option>
                <option value="merienda">Merienda</option>
                <option value="cena">Cena</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          {/* Ingredientes de la receta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[var(--text)] flex items-center gap-1.5">
                <IconToolsKitchen2 size={14} className="text-purple-500" />
                <span>Ingredientes Atómicos ({ingredients.length})</span>
              </label>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--card-subtle)] border border-[var(--border)] text-[12px]"
                >
                  <div className="truncate flex-1">
                    <span className="font-medium text-[var(--text)]">{ing.foodName || ing.foodId}</span>
                    {ing.notes && <span className="text-[11px] text-[var(--text-muted)] block truncate">{ing.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-[12px] text-[var(--text-secondary)]">{ing.grams}g</span>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger-text)] p-0.5"
                      >
                        <IconTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Etiquetas / Tags */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[var(--text)] flex items-center gap-1.5">
              <IconTag size={14} className="text-[var(--text-secondary)]" />
              <span>Etiquetas clínicas</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-[5px] text-[11px] font-medium transition-colors border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-[var(--card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border)]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Añadir otra etiqueta..."
                className="flex-1 h-[28px] rounded-[6px] border border-[var(--border)] bg-[var(--card)] px-2.5 text-[11px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)]"
              />
              <Button type="button" variant="secondary" onClick={handleAddCustomTag} className="h-[28px] px-2 text-[11px]">
                <IconPlus size={12} /> Añadir
              </Button>
            </div>
          </div>

          {/* Notas de preparación */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text)] block mb-1">
              Instrucciones de preparación (Meal Prep)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Saltear en sartén antiadherente a fuego medio durante 4 minutos..."
              className="w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)] resize-none"
            />
          </div>

          {/* Footer del Modal */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] shrink-0">
            <span className="text-[11px] text-[var(--text-secondary)]">
              Disponible al instante en <strong>Banco de Platos</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="h-[34px] px-3 text-[12px]">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || ingredients.length === 0 || isSaved}
                className="h-[34px] px-4 text-[12px] bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                {isSaved ? (
                  <>
                    <IconCheck size={14} className="text-white" />
                    <span>¡Guardada!</span>
                  </>
                ) : (
                  <>
                    <IconToolsKitchen2 size={14} />
                    <span>Guardar Receta</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
