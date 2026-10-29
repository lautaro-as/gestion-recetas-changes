import React, { useState } from 'react';
import { DietaryTag } from '../types';
import { ScrollableFilterBar } from './ScrollableFilterBar';
import { SearchScope, POPULAR_INGREDIENTS } from '../utils/searchUtils';

interface RecipeFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
  selectedSpecificIngredients: string[];
  setSelectedSpecificIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedTags: DietaryTag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<DietaryTag[]>>;
  selectedDifficulty: string;
  setSelectedDifficulty: (diff: string) => void;
  maxTime: number;
  setMaxTime: (t: number) => void;
  sortBy: 'popular' | 'recent' | 'time' | 'calories';
  setSortBy: (sort: 'popular' | 'recent' | 'time' | 'calories') => void;
  activeFilterCount: number;
  onClearFilters: () => void;
}

const CATEGORIES = [
  { id: 'todas', label: 'Todas las categorías' },
  { id: 'panaderia', label: 'Panadería & Masas' },
  { id: 'pastas', label: 'Pastas & Platos Fuertes' },
  { id: 'ensaladas', label: 'Entrantes & Ensaladas' },
  { id: 'postres', label: 'Postres & Dulces' },
  { id: 'desayunos', label: 'Bebidas & Desayunos' },
  { id: 'sopas', label: 'Sopas & Cremas' },
];

const DIETARY_OPTIONS: { id: DietaryTag | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas las dietas' },
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'celiaco', label: 'Sin gluten (Celíacos)' },
  { id: 'keto', label: 'Keto' },
  { id: 'diabetico', label: 'Apto Diabéticos' },
  { id: 'sin_lactosa', label: 'Sin lactosa' },
];

const SCOPE_OPTIONS: { id: SearchScope; label: string; icon: string; description: string }[] = [
  { id: 'todo', label: 'Todo', icon: 'travel_explore', description: 'Búsqueda unificada en título, ingredientes, categorías y palabras clave' },
  { id: 'titulo', label: 'Título', icon: 'title', description: 'Buscar exclusivamente por el título de la receta' },
  { id: 'ingredientes', label: 'Ingredientes', icon: 'grocery', description: 'Buscar por ingredientes específicos (ej. queso, albahaca, aguacate)' },
  { id: 'palabras_clave', label: 'Palabras clave', icon: 'auto_awesome', description: 'Buscar por técnicas culinarias, pasos, tips y términos descriptivos' },
  { id: 'categoria', label: 'Categoría', icon: 'restaurant_menu', description: 'Buscar por categoría general (pastas, postres, panadería, etc.)' },
];

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  selectedSpecificIngredients,
  setSelectedSpecificIngredients,
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
  selectedDifficulty,
  setSelectedDifficulty,
  maxTime,
  setMaxTime,
  sortBy,
  setSortBy,
  activeFilterCount,
  onClearFilters,
}) => {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [customIngredientInput, setCustomIngredientInput] = useState('');

  const handleDietSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'todas') {
      setSelectedTags([]);
    } else {
      setSelectedTags([val as DietaryTag]);
    }
  };

  const handleTimeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMaxTime(Number(e.target.value));
  };

  const toggleSpecificIngredient = (ingredientName: string) => {
    setSelectedSpecificIngredients((prev) => {
      const exists = prev.some((i) => i.toLowerCase() === ingredientName.toLowerCase());
      if (exists) {
        return prev.filter((i) => i.toLowerCase() !== ingredientName.toLowerCase());
      } else {
        return [...prev, ingredientName];
      }
    });
  };

  const handleAddCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customIngredientInput.trim();
    if (clean) {
      toggleSpecificIngredient(clean);
      setCustomIngredientInput('');
    }
  };

  const removeIngredient = (ingredientName: string) => {
    setSelectedSpecificIngredients((prev) =>
      prev.filter((i) => i.toLowerCase() !== ingredientName.toLowerCase())
    );
  };

  // Helper placeholder based on current scope
  const getSearchPlaceholder = () => {
    switch (searchScope) {
      case 'titulo':
        return 'Buscar por título exacto o parcial (ej. Hogaza, Pasta al Pesto, Tiramisú)...';
      case 'ingredientes':
        return 'Buscar por ingredientes específicos (ej. albahaca, queso mascarpone, café, aguacate)...';
      case 'palabras_clave':
        return 'Buscar palabras clave, técnicas o pasos (ej. amasado, fermentación en frío, mortero, horno)...';
      case 'categoria':
        return 'Buscar por categoría general (ej. postres, pastas, panadería, sopas, ensaladas)...';
      default:
        return 'Buscar por palabras clave, ingredientes específicos, título, categoría o alias (@autor)...';
    }
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(197,130,38,0.08)] mb-8 border border-stone-200/60 space-y-4">
      {/* RF-16 Scope Switcher Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#FFDDB9] text-[#835500] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">search</span>
          </span>
          <span className="text-xs font-bold text-stone-700">
            Criterio de Búsqueda:
          </span>
        </div>

        {/* Scope selector tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {SCOPE_OPTIONS.map((opt) => {
            const isSelected = searchScope === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSearchScope(opt.id)}
                title={opt.description}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E09F3E] text-white shadow-xs font-bold ring-2 ring-[#E09F3E]/30'
                    : 'bg-[#f6f3f2] text-stone-600 hover:bg-[#ffddb9]/60 hover:text-[#5A3900]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Search Input */}
      <div className="relative w-full flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-[#835500]">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </div>
          <input
            id="recipe-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="w-full h-12 sm:h-13 pl-12 sm:pl-14 pr-10 rounded-full bg-[#f6f3f2] text-[#000000] placeholder:text-[#333333]/70 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#e09f3e] outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#333333] hover:text-[#000000] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Toggle Arrow Button */}
        <button
          type="button"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          aria-expanded={isFiltersExpanded}
          aria-label="Desplegar u ocultar filtros avanzados"
          className={`h-12 sm:h-13 px-3.5 sm:px-4 rounded-full flex items-center gap-1.5 transition-all cursor-pointer font-semibold text-xs shrink-0 border ${
            isFiltersExpanded || activeFilterCount > 0
              ? 'bg-[#E09F3E] text-white border-[#E09F3E] shadow-sm'
              : 'bg-[#f6f3f2] text-[#333333] border-stone-200/60 hover:bg-[#ffddb9]/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#835500] text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <span
            className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
              isFiltersExpanded ? 'rotate-180' : ''
            }`}
          >
            keyboard_arrow_down
          </span>
        </button>
      </div>

      {/* Quick Ingredients Chips Row (Búsqueda por ingredientes específicos) */}
      <div className="pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold text-[#5A3900] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#835500]">kitchen</span>
            Ingredientes específicos:
          </span>

          <div className="flex-1 flex flex-wrap items-center gap-1.5">
            {POPULAR_INGREDIENTS.map((item) => {
              const isSelected = selectedSpecificIngredients.some(
                (i) => i.toLowerCase() === item.name.toLowerCase()
              );
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggleSpecificIngredient(item.name)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#835500] text-white border-[#835500] font-bold shadow-2xs scale-102'
                      : 'bg-[#f6f3f2] text-stone-700 border-stone-200/60 hover:bg-[#ffddb9]/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                </button>
              );
            })}

            {/* Custom ingredient input form */}
            <form onSubmit={handleAddCustomIngredient} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={customIngredientInput}
                onChange={(e) => setCustomIngredientInput(e.target.value)}
                placeholder="+ Otro ingrediente..."
                className="h-7 px-2.5 text-xs rounded-full bg-[#f6f3f2] border border-stone-200 text-stone-800 focus:bg-white focus:ring-1 focus:ring-[#e09f3e] outline-none w-32 placeholder:text-stone-400"
              />
              {customIngredientInput.trim() && (
                <button
                  type="submit"
                  className="h-7 px-2 rounded-full bg-[#e09f3e] text-white text-xs font-bold hover:bg-[#c98629] transition-colors cursor-pointer"
                >
                  +
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Selected specific ingredients tags */}
        {selectedSpecificIngredients.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 p-2 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs">
            <span className="font-bold text-[#835500] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">filter_alt</span>
              Filtrando por ingredientes que debe contener:
            </span>
            {selectedSpecificIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 bg-[#835500] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-2xs"
              >
                <span>{ing}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(ing)}
                  className="hover:text-amber-200 cursor-pointer ml-0.5"
                  aria-label={`Eliminar filtro de ${ing}`}
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedSpecificIngredients([])}
              className="text-[#ab3333] hover:underline font-semibold text-[11px] ml-auto cursor-pointer"
            >
              Quitar ingredientes
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Filters Container (Categories, Diet, Difficulty, Time, Sort) */}
      {isFiltersExpanded && (
        <div className="pt-4 border-t border-stone-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Categories with Horizontal Scroll */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-[#5A3900] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#835500]">dinner_dining</span>
              Categorías Generales:
            </span>
            <div className="flex-1 min-w-0">
              <ScrollableFilterBar gradientBg="from-white via-white/95">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-[#e09f3e] text-white shadow-xs font-bold'
                        : 'bg-[#f6f3f2] text-[#333333] hover:bg-[#ffddb9] hover:text-[#2b1700]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </ScrollableFilterBar>
            </div>
          </div>

          {/* Secondary Filters Row: All as Dropdown Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Tiempo Dropdown */}
            <div>
              <label htmlFor="filter-time" className="block text-[11px] font-bold text-[#5A3900] uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#835500]">schedule</span>
                Tiempo
              </label>
              <select
                id="filter-time"
                value={maxTime >= 180 ? '180' : maxTime <= 30 ? '30' : maxTime <= 60 ? '60' : '120'}
                onChange={handleTimeSelectChange}
                className="w-full h-10 px-3 rounded-xl bg-[#f6f3f2] text-[#333333] text-xs font-semibold border border-stone-200/80 outline-none focus:bg-white focus:ring-2 focus:ring-[#e09f3e] cursor-pointer"
              >
                <option value="180">Cualquier tiempo</option>
                <option value="30">Menos de 30 min</option>
                <option value="60">30 a 60 min</option>
                <option value="120">Más de 60 min</option>
              </select>
            </div>

            {/* Dificultad Dropdown */}
            <div>
              <label htmlFor="filter-difficulty" className="block text-[11px] font-bold text-[#5A3900] uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#835500]">hotel_class</span>
                Dificultad
              </label>
              <select
                id="filter-difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f6f3f2] text-[#333333] text-xs font-semibold border border-stone-200/80 outline-none focus:bg-white focus:ring-2 focus:ring-[#e09f3e] cursor-pointer"
              >
                <option value="todas">Todas las dificultades</option>
                <option value="facil">Fácil</option>
                <option value="media">Intermedia</option>
                <option value="dificil">Maestro / Avanzada</option>
              </select>
            </div>

            {/* Dieta Dropdown */}
            <div>
              <label htmlFor="filter-diet" className="block text-[11px] font-bold text-[#5A3900] uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#835500]">eco</span>
                Dieta
              </label>
              <select
                id="filter-diet"
                value={selectedTags.length === 0 ? 'todas' : selectedTags[0]}
                onChange={handleDietSelectChange}
                className="w-full h-10 px-3 rounded-xl bg-[#f6f3f2] text-[#333333] text-xs font-semibold border border-stone-200/80 outline-none focus:bg-white focus:ring-2 focus:ring-[#e09f3e] cursor-pointer"
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar Dropdown */}
            <div>
              <label htmlFor="filter-sort" className="block text-[11px] font-bold text-[#5A3900] uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#835500]">swap_vert</span>
                Ordenar por
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[#f6f3f2] text-[#333333] text-xs font-semibold border border-stone-200/80 outline-none focus:bg-white focus:ring-2 focus:ring-[#e09f3e] cursor-pointer"
              >
                <option value="popular">Más populares</option>
                <option value="recent">Más recientes</option>
                <option value="time">Menor tiempo</option>
                <option value="calories">Menor calorías</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Action Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 text-[#ab3333] hover:text-[#801318] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Restablecer todos los filtros ({activeFilterCount})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
