'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { searchFoodsInSupabase } from '@/lib/services/foodService';
import { searchFoodsSemanticallyAction } from '@/app/actions/semanticSearchActions';
import type { FoodWithSimilarity } from '@/lib/services/clinicalEmbeddingService';
import { Food } from '@/types/diet';
import {
  Search,
  Flame,
  Loader2,
  Sparkles,
  Zap,
  Tag,
  Check,
  Brain,
  SlidersHorizontal,
} from 'lucide-react';

interface FoodFuzzySearchProps {
  onSelectFood: (food: Food) => void;
  onCancel: () => void;
  placeholder?: string;
  initialValue?: string;
  defaultToSemantic?: boolean;
}

const CLINICAL_SUGGESTION_PRESETS = [
  { label: '🐟 Omega 3 articular', query: 'fuente de omega 3 para recuperacion articular' },
  { label: '🌱 Snack vegano hierro', query: 'snack vegano alto en hierro bajo en sodio para hipertensos' },
  { label: '❤️ Bajo sodio hipertensión', query: 'alimento hipotensor bajo en sodio para dieta dash' },
  { label: '💪 Proteína magra limpia', query: 'proteina limpia maxima para hipertrofia y definicion' },
];

export const FoodFuzzySearch: React.FC<FoodFuzzySearchProps> = ({
  onSelectFood,
  onCancel,
  placeholder,
  initialValue = '',
  defaultToSemantic = true,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isSemanticMode, setIsSemanticMode] = useState(defaultToSemantic);
  const [results, setResults] = useState<FoodWithSimilarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executionStats, setExecutionStats] = useState<{
    latencyMs: number;
    source: string;
    requestCount: number;
  }>({ latencyMs: 0, source: 'pgvector', requestCount: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-foco inmediato al abrir el popover
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const dynamicPlaceholder = placeholder || (isSemanticMode
    ? 'Búsqueda clínica IA: ej. snack vegano alto en hierro, omega 3 articular...'
    : 'Búsqueda tradicional: ej. Avena, Pechuga de pollo, Aguacate...');

  // Ejecuta la búsqueda (con debounce de 300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const startTime = performance.now();

      if (isSemanticMode) {
        // Modo IA Semántica (pgvector HNSW + embeddings D=1536)
        const res = await searchFoodsSemanticallyAction(trimmed);
        if (res.success) {
          setResults(res.foods);
          setExecutionStats((prev) => ({
            latencyMs: res.executionTimeMs,
            source: res.source === 'pgvector_rpc' ? 'pgvector (HNSW)' : 'pgvector local',
            requestCount: prev.requestCount + 1,
          }));
        } else {
          setResults([]);
        }
      } else {
        // Modo Tradicional (ILIKE text matching)
        const res = await searchFoodsInSupabase(trimmed);
        const elapsed = performance.now() - startTime;
        setResults(res.foods.map((f) => ({ ...f, similarity: 1.0 })));
        setExecutionStats((prev) => ({
          latencyMs: Number(elapsed.toFixed(2)),
          source: res.fromDatabase ? 'PostgreSQL ILIKE' : 'catálogo fallback',
          requestCount: prev.requestCount + 1,
        }));
      }

      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isSemanticMode]);

  // Manejo de teclado: flechas, enter, escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectFood(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const applyPreset = (presetQuery: string) => {
    setIsSemanticMode(true);
    setQuery(presetQuery);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full z-50 font-sans">
      {/* Barra de Búsqueda con selector de Modo IA / Modo Tradicional */}
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 shadow-2xl backdrop-blur-md transition-all ${
          isSemanticMode
            ? 'border-purple-500/60 bg-slate-900/95 ring-2 ring-purple-500/20'
            : 'border-emerald-500/50 bg-slate-900/95 ring-2 ring-emerald-500/20'
        }`}
      >
        {isSemanticMode ? (
          <Brain className="h-4 w-4 text-purple-400 shrink-0 animate-pulse" />
        ) : (
          <Search className="h-4 w-4 text-emerald-400 shrink-0" />
        )}

        <input
          ref={inputRef}
          data-testid="semantic-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dynamicPlaceholder}
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none"
        />

        {/* Botón Switch Modo IA vs Fuzzy */}
        <button
          type="button"
          data-testid="semantic-mode-toggle"
          onClick={() => setIsSemanticMode(!isSemanticMode)}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
            isSemanticMode
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:bg-purple-600/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
          }`}
          title={isSemanticMode ? 'Modo Semántico pgvector activo' : 'Cambiar a Búsqueda Semántica con IA'}
        >
          <Sparkles className="h-3 w-3" />
          <span>{isSemanticMode ? 'Modo IA' : 'Fuzzy'}</span>
        </button>

        {loading ? (
          <Loader2 className={`h-4 w-4 animate-spin shrink-0 ${isSemanticMode ? 'text-purple-400' : 'text-emerald-400'}`} />
        ) : null}
      </div>

      {/* Sugerencias Rápidas Clínicas (Chips) */}
      {!query && (
        <div className="mt-1.5 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-xl backdrop-blur-md">
          <div className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>Consultas Semánticas Clínicas Frecuentes:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {CLINICAL_SUGGESTION_PRESETS.map((preset, pIdx) => (
              <button
                key={preset.label}
                data-testid={`semantic-preset-${pIdx}`}
                type="button"
                onClick={() => applyPreset(preset.query)}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-purple-950/50 text-[10px] text-slate-300 hover:text-purple-200 border border-slate-700/60 hover:border-purple-500/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados desplegables */}
      {(results.length > 0 || (query.trim() && !loading)) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl z-50">
          {results.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No se encontraron alimentos para &quot;{query}&quot;
            </div>
          ) : (
            results.map((food, idx) => {
              const isSelected = idx === selectedIndex;
              const simPercent = food.similarity ? Math.round(food.similarity * 100) : null;

              return (
                <div
                  key={food.id || food.name}
                  data-testid="semantic-food-result"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => onSelectFood(food)}
                  className={`flex flex-col gap-1 cursor-pointer rounded-md p-2 text-xs transition-all mb-1 border ${
                    isSelected
                      ? isSemanticMode
                        ? 'bg-purple-950/40 text-white border-purple-500/50 shadow-sm'
                        : 'bg-emerald-950/40 text-white border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900/50 text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 text-[12px]">{food.name}</span>
                        {simPercent !== null && isSemanticMode && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              simPercent >= 80
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : simPercent >= 50
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {simPercent}% afinidad
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{food.category}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Flame className="h-3 w-3" />
                        {food.kcal} kcal
                      </span>
                      <span className="text-emerald-400">P: {food.protein_g}g</span>
                      <span className="text-sky-400">C: {food.carbs_g}g</span>
                      <span className="text-rose-400">G: {food.fat_g}g</span>
                    </div>
                  </div>

                  {/* Etiquetas clínicas o justificación semántica */}
                  {food.clinical_tags && food.clinical_tags.length > 0 && isSemanticMode && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {food.clinical_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-purple-300 border border-purple-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {food.semanticMatchReason && isSelected && isSemanticMode && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-950/60 p-1.5 rounded border border-slate-800/80 mt-0.5">
                      {food.semanticMatchReason}
                    </p>
                  )}
                </div>
              );
            })
          )}

          {/* Barra inferior de estado y atajos */}
          <div className="border-t border-slate-800 px-2 py-1.5 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Usa <strong>↑ / ↓</strong> para navegar, <strong>Enter</strong> para seleccionar</span>
            <span className="text-purple-400 font-mono flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {executionStats.latencyMs} ms · {executionStats.source}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
