'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  IconPlus,
  IconCopy,
  IconEdit,
  IconSearch,
  IconTrash,
  IconToolsKitchen2,
  IconSparkles,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Input, EmptyState } from '@/components/ui/nutri-ui';
import { useTemplateStore, SavedTemplate } from '@/lib/stores/useTemplateStore';

function getTagBadgeStyle(tag: string): string {
  switch (tag) {
    case 'Deportiva':
    case 'Hipertrofia':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
    case 'Clínica':
    case 'Salud Intestinal':
    case 'SIBO':
    case 'FODMAP':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
    case 'Mujer':
      return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/40';
    case 'Pérdida Grasa':
    case 'Recomposición':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    case 'Ciclado Carbs':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
    default:
      return 'bg-[var(--card-subtle)] text-[var(--text-secondary)] border-[var(--border)]';
  }
}

export default function TemplatesPage() {
  const { templates, deleteTemplate } = useTemplateStore();

  const [selectedTag, setSelectedTag] = useState('Todos');
  const [search, setSearch] = useState('');

  // Extraer dinámicamente todas las etiquetas únicas
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return ['Todos', ...Array.from(tagSet)];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchTag = selectedTag === 'Todos' || t.tags.includes(selectedTag);
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchTag && matchSearch;
    });
  }, [templates, selectedTag, search]);

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
              Plantillas Nutricionales
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Matrices base de 7 días reutilizables para clonado instantáneo en la pauta de cualquier paciente.
            </p>
          </div>

          <Link href="/dietas/creador">
            <Button variant="primary" className="flex items-center gap-1.5">
              <IconPlus size={16} stroke={1.5} />
              <span>Abrir Diet Builder</span>
            </Button>
          </Link>
        </div>

        {/* Filtros por etiqueta y buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`h-[30px] px-3 rounded-[8px] text-[12px] font-[500] whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-[220px]">
            <Input
              icon={<IconSearch size={14} stroke={1.5} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plantilla o tag..."
            />
          </div>
        </div>

        {/* Rejilla de tarjetas */}
        {filtered.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)] p-4">
            <EmptyState
              preset="template-search-empty"
              size="md"
              title={search ? `Sin plantillas para "${search}"` : 'No hay plantillas con esta etiqueta'}
              description={
                search || selectedTag !== 'Todos'
                  ? 'Prueba a restablecer la búsqueda para explorar todas tus pautas guardadas.'
                  : 'Crea tu primera plantilla de 7 días desde el Diet Builder pulsando en "Guardar como Plantilla".'
              }
              actionLabel={search || selectedTag !== 'Todos' ? 'Restablecer filtros' : 'Ir al Diet Builder'}
              actionHref={search || selectedTag !== 'Todos' ? undefined : '/diet-builder'}
              onAction={
                search || selectedTag !== 'Todos'
                  ? () => {
                      setSearch('');
                      setSelectedTag('Todos');
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
            {filtered.map((tmpl) => {
              const itemsCount = tmpl.items?.length || 0;
              const calories = tmpl.targetKcal || tmpl.kcal || 1800;

              return (
                <Card
                  key={tmpl.id}
                  className="flex flex-col justify-between hover:border-purple-500/30 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[14px] font-[600] text-[var(--text)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                        {tmpl.name}
                      </h2>
                      <Badge variant="brand">{calories} kcal</Badge>
                    </div>

                    <p className="text-[12px] leading-relaxed line-clamp-2 text-[var(--text-secondary)]">
                      {tmpl.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {itemsCount > 0 && (
                        <span className="px-2 py-[2px] rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {itemsCount} alimentos
                        </span>
                      )}
                      {tmpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-[2px] rounded-[6px] border text-[11px] font-[500] transition-colors ${getTagBadgeStyle(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pie de tarjeta: Versión y botones */}
                  <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {new Date(tmpl.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {tmpl.id.startsWith('tmpl-') && (
                        <button
                          type="button"
                          onClick={() => deleteTemplate(tmpl.id)}
                          className="p-1.5 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--danger-text)] hover:bg-[var(--card-subtle)] transition-colors"
                          title="Eliminar plantilla"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}

                      <Link href={`/dietas/creador?template=${tmpl.id}`}>
                        <Button
                          variant="secondary"
                          className="h-[28px] px-2.5 text-[12px] hover:border-purple-500/40 hover:text-purple-600"
                        >
                          <IconEdit size={14} />
                          <span>Cargar en Creador</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
