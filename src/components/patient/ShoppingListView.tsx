'use client';

import React, { useState, useEffect } from 'react';
import {
  generateWeeklyShoppingList,
  formatShoppingListForWhatsApp,
  RawDietItemInput,
} from '@/lib/clinical/shoppingListEngine';
import { ShoppingListSummary, ShoppingItem, ShoppingCategory } from '@/types/diet';
import {
  ShoppingCart,
  Check,
  Copy,
  Share2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ShoppingListViewProps {
  items: RawDietItemInput[];
  dietName: string;
  clientName?: string;
  onBackToMenu?: () => void;
}

export function ShoppingListView({
  items,
  dietName,
  clientName = 'Paciente',
  onBackToMenu,
}: ShoppingListViewProps) {
  const [summary, setSummary] = useState<ShoppingListSummary>(() =>
    generateWeeklyShoppingList(items)
  );
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrepNotes, setShowPrepNotes] = useState(true);

  // Recalcular resumen si cambian los ítems
  useEffect(() => {
    setSummary(generateWeeklyShoppingList(items));
  }, [items]);

  // Cargar estado de checks guardados en localStorage
  useEffect(() => {
    try {
      const storageKey = `nutriapp_shopping_checked_${dietName.replace(/\s+/g, '_')}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCheckedIds(JSON.parse(saved));
      }
    } catch {
      // Ignorar fallos de acceso a localStorage en navegadores restrictivos
    }
  }, [dietName]);

  // Guardar estado de checks en localStorage
  const toggleItemCheck = (itemId: string) => {
    setCheckedIds((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        const storageKey = `nutriapp_shopping_checked_${dietName.replace(/\s+/g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetChecks = () => {
    setCheckedIds({});
    try {
      const storageKey = `nutriapp_shopping_checked_${dietName.replace(/\s+/g, '_')}`;
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const handleCheckAll = () => {
    const allChecked: Record<string, boolean> = {};
    summary.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        allChecked[item.id] = true;
      });
    });
    setCheckedIds(allChecked);
  };

  // Conteo de items comprados
  const totalItems = summary.totalItemsCount;
  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  // Copiar al portapapeles
  const handleCopy = () => {
    const text = formatShoppingListForWhatsApp(summary, clientName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Abrir WhatsApp con la lista
  const handleShareWhatsApp = () => {
    const text = formatShoppingListForWhatsApp(summary, clientName);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const displayedCategories =
    selectedCategory === 'all'
      ? summary.categories
      : summary.categories.filter((c) => c.id === selectedCategory);

  return (
    <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 space-y-4 animate-fadeIn">
      {/* Barra de Navegación y Título */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        {onBackToMenu ? (
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Menú
          </button>
        ) : (
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" /> Lista de la Compra
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {totalItems} Ingredientes
          </span>
        </div>
      </div>

      {/* Tarjeta Principal de Progreso y Acciones */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
              Lista de la Compra Semanal
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidación automática de los 7 días de tu pauta
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs flex items-center gap-1"
              title="Copiar texto de la lista de la compra"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Compartir lista completa por WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Barra de progreso de la compra */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Progreso en el Supermercado:</span>
            <span className="font-bold text-emerald-400">
              {checkedCount} / {totalItems} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <button
              onClick={handleResetChecks}
              className="hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-2.5 w-2.5" /> Desmarcar todo
            </button>
            <button
              onClick={handleCheckAll}
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="h-2.5 w-2.5" /> Marcar todo
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECCIÓN DESTACADA: NOTAS DE PREPARACIÓN (MEAL PREP)
          ───────────────────────────────────────────────────────────── */}
      {summary.allPrepNotes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 shadow-sm space-y-2">
          <button
            onClick={() => setShowPrepNotes((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🥣</span>
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  Notas Críticas de Meal Prep ({summary.allPrepNotes.length})
                </span>
                <span className="text-[10px] text-amber-400/80 block">
                  Instrucciones clave para absorción y saciedad antes de cocinar
                </span>
              </div>
            </div>
            {showPrepNotes ? (
              <ChevronUp className="h-4 w-4 text-amber-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-400" />
            )}
          </button>

          {showPrepNotes && (
            <div className="space-y-1.5 pt-1.5 border-t border-amber-500/20 text-xs">
              {summary.allPrepNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-start gap-2 text-slate-200"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-amber-200">{note.foodName}:</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/50 text-amber-300 font-mono">
                        {note.dayName} · {note.mealSlot}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {note.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtros rápidos por Pasillos de Supermercado */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          Todo ({totalItems})
        </button>

        {summary.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name.split(',')[0]} ({cat.items.length})</span>
          </button>
        ))}
      </div>

      {/* Listado de Pasillos y Artículos Consolidados */}
      <div className="space-y-3.5 pt-1">
        {displayedCategories.map((category) => (
          <section
            key={category.id}
            className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-3.5 shadow-sm space-y-2"
          >
            {/* Cabecera del Pasillo */}
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{category.icon}</span>
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  {category.name}
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {category.items.length} {category.items.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            {/* Lista interactiva de productos */}
            <ul className="space-y-1.5">
              {category.items.map((item) => {
                const isChecked = Boolean(checkedIds[item.id]);

                return (
                  <li
                    key={item.id}
                    onClick={() => toggleItemCheck(item.id)}
                    className={`rounded-xl p-2.5 text-xs border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                        : 'bg-slate-950/70 border-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Checkbox circular */}
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-700 bg-slate-900 hover:border-emerald-400'
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-medium block truncate text-[12px] ${
                            isChecked ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {item.cleanName}
                        </span>

                        {/* Tips de Meal Prep debajo del ingrediente si existen */}
                        {item.mealPrepTips.length > 0 && !isChecked && (
                          <span className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-0.5 truncate">
                            <span className="text-[11px]">💡</span> Meal prep: {item.mealPrepTips[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cantidad Total Sumada Consolidada (ej. "1.2 kg", "250g") */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`rounded-lg px-2 py-1 font-mono text-[11px] font-bold border transition-colors ${
                          isChecked
                            ? 'bg-slate-900 text-slate-500 border-slate-800'
                            : 'bg-slate-900 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {item.formattedDisplay}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
