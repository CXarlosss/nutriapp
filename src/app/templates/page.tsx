'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconPlus,
  IconCopy,
  IconEdit,
  IconSearch,
} from '@tabler/icons-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Badge, Button, Input } from '@/components/ui/nutri-ui';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  targetKcal: number;
  tags: string[];
  version: number;
  archived?: boolean;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 't1',
    name: 'Déficit Calórico Moderado',
    description: 'Estructura equilibrada con alta saciedad, rica en proteínas y verduras fibrosas para mantenimiento muscular.',
    targetKcal: 1800,
    tags: ['Pérdida de Grasa', 'Alta Proteína'],
    version: 2,
  },
  {
    id: 't2',
    name: 'Recomposición Normocalórica',
    description: 'Distribución ciclada de carbohidratos en días de entrenamiento de fuerza para máxima recuperación.',
    targetKcal: 2200,
    tags: ['Recomposición', 'Fuerza'],
    version: 3,
  },
  {
    id: 't3',
    name: 'Superávit Hipertrofia Limpia',
    description: 'Enfoque denso nutricionalmente con grasas monoinsaturadas y carbohidratos de fácil asimilación.',
    targetKcal: 2750,
    tags: ['Volumen', 'Atletas'],
    version: 1,
  },
  {
    id: 't4',
    name: 'Pauta Antiinflamatoria FODMAP',
    description: 'Fase de eliminación de hidratos de carbono fermentables para sintomatología de disbiosis o colon irritable.',
    targetKcal: 1950,
    tags: ['Salud Intestinal', 'Bajo FODMAP'],
    version: 1,
  },
  {
    id: 't5',
    name: 'Pauta Vegetariana Rendimiento',
    description: 'Combinaciones de legumbres, cereales y frutos secos para aminograma completo en deportistas.',
    targetKcal: 2100,
    tags: ['Vegetariano', 'Deporte'],
    version: 2,
  },
  {
    id: 't6',
    name: 'Ketogénica Adaptativa (Archivada)',
    description: 'Protocolo de inducción a cetosis con 75% grasas y menos de 30g de carbohidratos netos diarios.',
    targetKcal: 1700,
    tags: ['Keto', 'Antigua'],
    version: 1,
    archived: true,
  },
];

export default function TemplatesPage() {
  const [selectedTag, setSelectedTag] = useState('Todos');
  const [search, setSearch] = useState('');

  const allTags = ['Todos', 'Pérdida de Grasa', 'Recomposición', 'Fuerza', 'Salud Intestinal', 'Vegetariano'];

  const filtered = TEMPLATES.filter((t) => {
    const matchTag = selectedTag === 'Todos' || t.tags.includes(selectedTag);
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <AppShell>
      <div className="space-y-[16px] animate-fadeIn">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-[500] text-[var(--text)] tracking-tight leading-tight">
              Plantillas
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Matrices base reutilizables para clonado independiente en dietas de clientes.
            </p>
          </div>

          <Link href="/dietas/creador">
            <Button variant="primary">
              <IconPlus size={16} stroke={1.5} />
              <span>Nueva plantilla</span>
            </Button>
          </Link>
        </div>

        {/* Filtros por etiqueta y buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`h-[30px] px-3 rounded-[8px] text-[12px] font-[500] whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[var(--brand-solid)] text-white'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-[200px]">
            <Input
              icon={<IconSearch size={14} stroke={1.5} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plantilla"
            />
          </div>
        </div>

        {/* Rejilla de tarjetas (3 columnas en escritorio, 2 en tablet, 1 en móvil) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
          {filtered.map((tmpl) => {
            const isArchived = tmpl.archived;

            return (
              <Card
                key={tmpl.id}
                className={`flex flex-col justify-between transition-colors ${
                  isArchived ? 'bg-[var(--card-subtle)]' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className={`text-[14px] font-[500] leading-snug ${
                        isArchived ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'
                      }`}
                    >
                      {tmpl.name}
                    </h2>
                    {isArchived ? (
                      <Badge variant="neutral">Archivada</Badge>
                    ) : (
                      <Badge variant="brand">{tmpl.targetKcal} kcal</Badge>
                    )}
                  </div>

                  <p
                    className={`text-[13px] leading-relaxed line-clamp-2 ${
                      isArchived ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {tmpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tmpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-[2px] rounded-[6px] bg-[var(--card-subtle)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] font-[400]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pie de tarjeta: Versión y botones */}
                <div className="pt-4 mt-3 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                  <span>v{tmpl.version}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" className="h-[28px] px-2 text-[12px]">
                      <IconCopy size={14} />
                      <span>Duplicar</span>
                    </Button>
                    <Link href={`/dietas/creador?template=${tmpl.id}`}>
                      <Button variant="secondary" className="h-[28px] px-2.5 text-[12px]">
                        <IconEdit size={14} />
                        <span>Editar</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
