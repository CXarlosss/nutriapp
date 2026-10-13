'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchFoodsInSupabase } from '@/lib/services/foodService';
import { Food } from '@/types/diet';
import { Search, Flame, Loader2, Sparkles } from 'lucide-react';

interface FoodFuzzySearchProps {
  onSelectFood: (food: Food) => void;
  onCancel: () => void;
  placeholder?: string;
  initialValue?: string;
}

export const FoodFuzzySearch: React.FC<FoodFuzzySearchProps> = ({
  onSelectFood,
  onCancel,
  placeholder = 'Buscar alimento (ej. Avena, Pollo, Aguacate)...',
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [networkRequestsCount, setNetworkRequestsCount] = useState(0);
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-foco inmediato al abrir
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // DEBOUNCE >= 300ms: Ejecuta la búsqueda solo tras 350ms de inactividad
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setNetworkRequestsCount((prev) => prev + 1);
      setLastSearchedTerm(query.trim());

      const res = await searchFoodsInSupabase(query);
      setResults(res.foods);
      setSelectedIndex(0);
      setLoading(false);
    }, 350); // 350ms de debounce estricto

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Navegación por teclado dentro de la lista
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

  return (
    <div className="relative w-full z-50">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-slate-900/95 px-3 py-2 shadow-2xl ring-2 ring-emerald-500/30 backdrop-blur-md">
        <Search className="h-4 w-4 text-emerald-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
        ) : (
          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
            {networkRequestsCount > 0 ? `Req #${networkRequestsCount}` : 'Debounce 350ms'}
          </span>
        )}
      </div>

      {/* Resultados desplegables */}
      {(results.length > 0 || (query.trim() && !loading)) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
          {results.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No se encontraron alimentos para &quot;{query}&quot;
            </div>
          ) : (
            results.map((food, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={food.id || food.name}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => onSelectFood(food)}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-emerald-600/30 text-white font-medium border border-emerald-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-100">{food.name}</span>
                    <span className="text-[10px] text-slate-400">{food.category}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Flame className="h-3 w-3" />
                      {food.kcal} kcal
                    </span>
                    <span className="text-emerald-400">P: {food.protein_g}g</span>
                    <span className="text-sky-400">C: {food.carbs_g}g</span>
                    <span className="text-rose-400">G: {food.fat_g}g</span>
                  </div>
                </div>
              );
            })
          )}
          <div className="border-t border-slate-800/80 px-2 py-1.5 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Usa <strong>↑ / ↓</strong> para navegar, <strong>Enter</strong> para seleccionar, <strong>Esc</strong> para cancelar</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> 1 req post-debounce
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
