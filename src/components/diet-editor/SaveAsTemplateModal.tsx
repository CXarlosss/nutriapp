'use client';

import React, { useState } from 'react';
import {
  IconX,
  IconBookmark,
  IconCheck,
  IconSparkles,
  IconPlus,
  IconTag,
  IconFlame,
  IconCalendarWeek,
  IconToolsKitchen2,
} from '@tabler/icons-react';
import { Button, Input, Badge } from '@/components/ui/nutri-ui';
import { useTemplateStore } from '@/lib/stores/useTemplateStore';
import { DietItem, DayCyclingConfig } from '@/types/diet';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  items: DietItem[];
  dayCyclingConfigs?: Record<number, DayCyclingConfig>;
  onSuccess?: (templateName: string) => void;
}

const POPULAR_TAGS = [
  'Pérdida de Grasa',
  'Alta Proteína',
  'Recomposición',
  'Keto',
  'Bajo FODMAP',
  'Sin Gluten',
  'Vegetariano',
  'Mediterránea',
  'Hipertrofia',
];

export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  isOpen,
  onClose,
  defaultTitle,
  items,
  dayCyclingConfigs,
  onSuccess,
}) => {
  const { saveAsTemplate } = useTemplateStore();

  const [title, setTitle] = useState(defaultTitle || 'Plantilla Nutricional');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Alta Proteína']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  // Estadísticas calculadas de los items de Zustand
  const totalFoods = items.length;
  const uniqueDays = new Set(items.map((i) => i.dayIndex)).size;
  const totalKcal = items.reduce((acc, curr) => acc + (curr.kcal || 0), 0);
  const avgKcalPerDay = uniqueDays > 0 ? Math.round(totalKcal / uniqueDays) : 0;

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    saveAsTemplate({
      name: title.trim(),
      description: description.trim() || `Estructura base de 7 días (${avgKcalPerDay} kcal/día)`,
      targetKcal: avgKcalPerDay > 0 ? avgKcalPerDay : 1800,
      tags: selectedTags,
      items,
      dayCyclingConfigs,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (onSuccess) onSuccess(title.trim());
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--card-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <IconBookmark size={20} stroke={1.75} />
            </div>
            <div>
              <h2 className="text-[16px] font-[600] text-[var(--text)]">
                Guardar como Plantilla Reutilizable
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Vuelca todos los alimentos y pautas de los 7 días a tu biblioteca
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card)] transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-[13px]">
          {/* Métricas del volcado de Zustand */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[var(--card-subtle)] border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <IconToolsKitchen2 size={16} className="text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">Alimentos</span>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{totalFoods} items</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconCalendarWeek size={16} className="text-blue-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">Cobertura</span>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{uniqueDays} días</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconFlame size={16} className="text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">Media Calórica</span>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{avgKcalPerDay} kcal</span>
              </div>
            </div>
          </div>

          {/* Título de la Plantilla */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text)] block mb-1">
              Nombre de la plantilla *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Definición Hombre 1800 kcal"
              required
              className="text-[13px]"
              autoFocus
            />
          </div>

          {/* Descripción opcional */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text)] block mb-1">
              Descripción clínica u objetivo <span className="text-[var(--text-secondary)] font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Alta densidad nutricional con hidratos ciclados para entrenamientos pesados..."
              className="w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)] resize-none"
            />
          </div>

          {/* Etiquetas / Tags */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[var(--text)] flex items-center gap-1.5">
              <IconTag size={14} className="text-[var(--text-secondary)]" />
              <span>Etiquetas de filtrado</span>
            </label>
            
            {/* Chips rápidos populares */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-colors border ${
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

            {/* Input para etiqueta personalizada */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Añadir otra etiqueta..."
                className="flex-1 h-[30px] rounded-[6px] border border-[var(--border)] bg-[var(--card)] px-2.5 text-[12px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCustomTag}
                className="h-[30px] px-2 text-[11px]"
              >
                <IconPlus size={13} />
                <span>Añadir</span>
              </Button>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-secondary)]">
              Se guardará en tu biblioteca de <strong>Plantillas</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="h-[34px] px-3 text-[12px]">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!title.trim() || isSaved}
                className="h-[34px] px-4 text-[12px] bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                {isSaved ? (
                  <>
                    <IconCheck size={14} className="text-white" />
                    <span>¡Guardada!</span>
                  </>
                ) : (
                  <>
                    <IconBookmark size={14} />
                    <span>Guardar Plantilla</span>
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
