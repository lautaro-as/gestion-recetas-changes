import React, { useState } from 'react';
import { DietaryTag } from '../types';
import { ScrollableFilterBar } from './ScrollableFilterBar';

interface RecipeFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
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
  { id: 'todas', label: 'Todas' },
  { id: 'panaderia', label: 'Panadería & Masas' },
  { id: 'pastas', label: 'Platos fuertes & Pastas' },
  { id: 'ensaladas', label: 'Entrantes & Bowls' },
  { id: 'postres', label: 'Postres' },
  { id: 'desayunos', label: 'Bebidas & Desayunos' },
  { id: 'sopas', label: 'Sopas & Cremas' }
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

export const RecipeFilterBar: React.FC<RecipeFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
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

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(197,130,38,0.08)] mb-8 border border-stone-200/60">
      {/* Search Bar with filter toggle arrow on the right */}
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
            placeholder="Buscar recetas por nombre, ingrediente, técnica o autor..."
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

      {/* Collapsible Filters Container */}
      {isFiltersExpanded && (
        <div className="mt-5 pt-4 border-t border-stone-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Categories with Horizontal Scroll and Side Overflow Arrows */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-[#5A3900] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#835500]">dinner_dining</span>
              Categorías:
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
                <span>Restablecer filtros ({activeFilterCount})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
