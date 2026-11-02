import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe } from '../types';
import {
  Scale,
  Trash2,
  Clock,
  Users,
  Flame,
  ShoppingCart,
  X,
  PlusCircle,
  Store,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Layers,
  Award
} from 'lucide-react';
import { normalizeText } from '../utils/searchUtils';

interface RecipeCompareViewProps {
  onOpenDetail: (recipe: Recipe) => void;
  onExploreMore: () => void;
}

export const RecipeCompareView: React.FC<RecipeCompareViewProps> = ({
  onOpenDetail,
  onExploreMore,
}) => {
  const {
    recipes,
    comparingRecipeIds,
    toggleCompareRecipe,
    clearCompareRecipes,
    addRecipeIngredientsToCart,
  } = useApp();

  const comparedRecipes = useMemo(() => {
    return recipes.filter((r) => comparingRecipeIds.includes(r.id)).slice(0, 3);
  }, [recipes, comparingRecipeIds]);

  // Compute key comparison metrics and differences
  const differences = useMemo(() => {
    if (comparedRecipes.length < 2) return null;

    // Caloric differences
    const sortedByCalories = [...comparedRecipes].sort((a, b) => (a.nutrition?.calories ?? 0) - (b.nutrition?.calories ?? 0));
    const lowestCal = sortedByCalories[0];
    const highestCal = sortedByCalories[sortedByCalories.length - 1];
    const calDiff = (highestCal.nutrition?.calories ?? 0) - (lowestCal.nutrition?.calories ?? 0);

    // Protein differences
    const sortedByProtein = [...comparedRecipes].sort((a, b) => (b.nutrition?.proteinG ?? 0) - (a.nutrition?.proteinG ?? 0));
    const highestProtein = sortedByProtein[0];

    // Cooking time differences
    const sortedByTime = [...comparedRecipes].sort(
      (a, b) => a.prepTimeMin + a.cookTimeMin - (b.prepTimeMin + b.cookTimeMin)
    );
    const fastestRecipe = sortedByTime[0];
    const slowestRecipe = sortedByTime[sortedByTime.length - 1];
    const timeDiff =
      slowestRecipe.prepTimeMin +
      slowestRecipe.cookTimeMin -
      (fastestRecipe.prepTimeMin + fastestRecipe.cookTimeMin);

    // Ingredient cost differences
    const recipeCosts = comparedRecipes.map((r) => ({
      recipe: r,
      cost: r.ingredients.reduce((acc, i) => acc + (i.estimatedPrice || 0), 0),
    }));
    const sortedByCost = [...recipeCosts].sort((a, b) => a.cost - b.cost);
    const mostEconomical = sortedByCost[0];
    const mostExpensive = sortedByCost[sortedByCost.length - 1];
    const costDiff = mostExpensive.cost - mostEconomical.cost;

    // Shared ingredients analysis
    const ingredientOccurrences: Record<string, { name: string; recipesCount: number }> = {};
    comparedRecipes.forEach((r) => {
      const addedForThisRecipe = new Set<string>();
      r.ingredients.forEach((ing) => {
        const norm = normalizeText(ing.name).split(/\s+/).slice(0, 2).join(' ');
        if (!addedForThisRecipe.has(norm)) {
          addedForThisRecipe.add(norm);
          if (!ingredientOccurrences[norm]) {
            ingredientOccurrences[norm] = { name: ing.name, recipesCount: 0 };
          }
          ingredientOccurrences[norm].recipesCount += 1;
        }
      });
    });

    const sharedIngredients = Object.values(ingredientOccurrences)
      .filter((item) => item.recipesCount >= 2)
      .map((item) => item.name);

    return {
      lowestCal,
      highestCal,
      calDiff,
      highestProtein,
      fastestRecipe,
      timeDiff,
      mostEconomical,
      mostExpensive,
      costDiff,
      sharedIngredients,
    };
  }, [comparedRecipes]);

  // Zero recipes state
  if (comparedRecipes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-stone-200/90 shadow-sm max-w-2xl mx-auto my-8 space-y-5">
        <div className="w-16 h-16 bg-[#FFDDB9] text-[#835500] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Scale className="w-8 h-8 text-[#835500]" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900 mb-2">
            Comparador Culinario Lado a Lado
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Compara ingredientes y valores nutricionales de dos o hasta un máximo de tres recetas simultáneamente.
            Haz clic en el botón <strong>"Comparar"</strong> en las tarjetas del catálogo para contrastar sus diferencias.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onExploreMore}
            className="px-6 py-3 bg-[#E09F3E] hover:bg-[#835500] text-white font-bold rounded-full text-xs sm:text-sm shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>Explorar catálogo para comparar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#FFDDB9] text-[#835500] flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#835500]" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-900 leading-tight">
                Comparador Culinario Lado a Lado
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Comparando {comparedRecipes.length} de 3 recetas permitidas simultáneamente
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Slot Indicator */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Slots badge indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200">
            <span>Slots:</span>
            {[0, 1, 2].map((slotIdx) => (
              <span
                key={slotIdx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  slotIdx < comparedRecipes.length ? 'bg-[#E09F3E] ring-1 ring-[#835500]' : 'bg-stone-300'
                }`}
                title={slotIdx < comparedRecipes.length ? `Receta ${slotIdx + 1} ocupada` : `Slot ${slotIdx + 1} libre`}
              />
            ))}
            <span className="text-stone-500 text-[11px] font-bold ml-1">
              {comparedRecipes.length}/3
            </span>
          </div>

          {comparedRecipes.length < 3 && (
            <button
              type="button"
              onClick={onExploreMore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E09F3E] hover:bg-[#835500] text-white rounded-full text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Añadir otra ({3 - comparedRecipes.length} disponible)</span>
            </button>
          )}

          <button
            type="button"
            onClick={clearCompareRecipes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-full text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar comparador</span>
          </button>
        </div>
      </div>

      {/* When only 1 recipe is selected: prompt for 2nd recipe */}
      {comparedRecipes.length === 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#835500]">info</span>
            <span>
              Has seleccionado <strong>"{comparedRecipes[0].title}"</strong>. Añade 1 o 2 recetas más desde el catálogo para contrastar sus diferencias lado a lado.
            </span>
          </div>
          <button
            type="button"
            onClick={onExploreMore}
            className="px-4 py-1.5 rounded-full bg-[#835500] text-white font-bold hover:bg-[#5A3900] transition-colors shrink-0 cursor-pointer"
          >
            + Seleccionar otra receta
          </button>
        </div>
      )}

      {/* DIFFERENCES & COMPARATIVE HIGHLIGHTS PANEL (Shown when >= 2 recipes) */}
      {differences && comparedRecipes.length >= 2 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 font-display">
                Diferencias Clave entre las Recetas
              </h3>
              <p className="text-xs text-stone-500">
                Comparativa directa de nutrientes, tiempos y costos calculados lado a lado
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Diferencia Calórica */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Calorías (Más ligera)
                </span>
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                  {differences.lowestCal.title}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-emerald-600">
                    {differences.lowestCal.nutrition?.calories ?? 0} kcal
                  </span>
                  {differences.calDiff > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      -{differences.calDiff} kcal
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Aporta menos calorías por ración que "{differences.highestCal.title}".
              </p>
            </div>

            {/* 2. Más Proteica */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Proteínas (Mayor aporte)
                </span>
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                  {differences.highestProtein.title}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-amber-700">
                    {differences.highestProtein.nutrition?.proteinG ?? 0}g
                  </span>
                  <span className="text-[11px] font-medium text-stone-500">por porción</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Receta recomendada para mayor aporte proteico y saciedad.
              </p>
            </div>

            {/* 3. Tiempo Más Rápido */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Tiempo Total (Más rápida)
                </span>
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                  {differences.fastestRecipe.title}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-sky-700">
                    {differences.fastestRecipe.prepTimeMin + differences.fastestRecipe.cookTimeMin} min
                  </span>
                  {differences.timeDiff > 0 && (
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-md">
                      -{differences.timeDiff} min
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                La preparación más ágil entre las seleccionadas.
              </p>
            </div>

            {/* 4. Costo Más Económico */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Presupuesto (Más económica)
                </span>
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                  {differences.mostEconomical.recipe.title}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-stone-900">
                    ${differences.mostEconomical.cost.toFixed(2)} USD
                  </span>
                  {differences.costDiff > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      Ahorro ${differences.costDiff.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Menor inversión requerida para el carrito de compras.
              </p>
            </div>
          </div>

          {/* Ingredientes en Común */}
          {differences.sharedIngredients.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                Ingredientes en común en las recetas seleccionadas:
              </span>
              {differences.sharedIngredients.map((ingName, idx) => (
                <span
                  key={idx}
                  className="bg-white text-[#835500] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs"
                >
                  {ingName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3-COLUMN SIDE-BY-SIDE RECIPE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparedRecipes.map((recipe) => {
          const totalCost = recipe.ingredients.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
          const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;

          // Check if this recipe wins any best-in-comparison badge
          const isLowestCal = differences && differences.lowestCal.id === recipe.id;
          const isHighestProtein = differences && differences.highestProtein.id === recipe.id;
          const isFastest = differences && differences.fastestRecipe.id === recipe.id;
          const isMostEconomical = differences && differences.mostEconomical.recipe.id === recipe.id;

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden flex flex-col justify-between relative hover:shadow-lg transition-all"
            >
              {/* Recipe Top Header */}
              <div>
                <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                  <img
                    src={recipe.coverImage}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => toggleCompareRecipe(recipe.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title="Quitar esta receta del comparador"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Badges on Image */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold bg-black/55 px-2.5 py-0.5 rounded-full backdrop-blur-xs capitalize">
                      {recipe.category}
                    </span>
                    <span className="capitalize font-bold bg-[#835500]/85 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      {recipe.difficulty === 'facil' ? 'Fácil' : recipe.difficulty === 'media' ? 'Intermedia' : 'Maestro'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Title & Author */}
                  <div>
                    <h3
                      onClick={() => onOpenDetail(recipe)}
                      className="font-bold font-display text-lg text-stone-900 leading-snug line-clamp-2 hover:text-[#835500] cursor-pointer transition-colors"
                    >
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                      <span>Por {recipe.authorName}</span>
                      <span className="text-[#835500] font-semibold">{totalTime} min total</span>
                    </div>
                  </div>

                  {/* Standout Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {isLowestCal && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Award className="w-3 h-3" />
                        Menos calorías
                      </span>
                    )}
                    {isHighestProtein && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <Award className="w-3 h-3" />
                        Mayor proteína
                      </span>
                    )}
                    {isFastest && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        <Clock className="w-3 h-3" />
                        Más rápida
                      </span>
                    )}
                    {isMostEconomical && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800">
                        <Store className="w-3 h-3" />
                        Más económica
                      </span>
                    )}
                  </div>

                  {/* Quick Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tiempo Cocción</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {recipe.cookTimeMin} min (prep: {recipe.prepTimeMin}m)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Porciones</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        {recipe.servings} platos
                      </span>
                    </div>
                  </div>

                  {/* Dietary Tags */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">
                      Etiquetas Dietéticas
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFDDB9] text-[#714500]"
                        >
                          #{tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Breakdown Box */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2">
                    <span className="text-xs font-bold text-stone-800 uppercase flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      Valores Nutricionales (por porción)
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-stone-200/60">
                        <span className="text-stone-600">Calorías:</span>
                        <strong className="text-stone-900 text-sm">{recipe.nutrition?.calories ?? 0} kcal</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-stone-200/60">
                        <span className="text-stone-600">Proteínas:</span>
                        <strong className="text-stone-900">{recipe.nutrition?.proteinG ?? 0} g</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-stone-200/60">
                        <span className="text-stone-600">Carbohidratos:</span>
                        <strong className="text-stone-900">{recipe.nutrition?.carbsG ?? 0} g</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-stone-200/60">
                        <span className="text-stone-600">Grasas:</span>
                        <strong className="text-stone-900">{recipe.nutrition?.fatG ?? 0} g</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-stone-600">Fibra dietética:</span>
                        <strong className="text-stone-900">{recipe.nutrition?.fiberG ?? 0} g</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients List with Prices */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-700 uppercase">
                        Ingredientes ({recipe.ingredients.length})
                      </span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        $ {totalCost.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-stone-600 max-h-48 overflow-y-auto pr-1">
                      {recipe.ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="p-1.5 rounded-lg bg-stone-50 flex items-center justify-between border border-stone-200/50"
                        >
                          <span className="truncate pr-2">
                            {ing.quantity} {ing.unit} {ing.name}
                          </span>
                          <span className="shrink-0 font-medium text-stone-500">
                            $ {ing.estimatedPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-stone-100 space-y-2 bg-stone-50/50">
                <button
                  type="button"
                  onClick={() => addRecipeIngredientsToCart(recipe)}
                  className="w-full py-2.5 px-3 bg-[#E09F3E] hover:bg-[#835500] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Comprar Ingredientes (${totalCost.toFixed(2)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDetail(recipe)}
                  className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
                >
                  Ver Receta Completa
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty Slot 3 Card (if exactly 2 recipes are in comparison) */}
        {comparedRecipes.length < 3 && (
          <div
            onClick={onExploreMore}
            className="rounded-3xl border-2 border-dashed border-stone-300 hover:border-[#E09F3E] bg-white/60 hover:bg-white p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[460px] group shadow-2xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFDDB9] group-hover:bg-[#E09F3E] group-hover:text-white text-[#835500] flex items-center justify-center mb-4 transition-all">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-stone-900 group-hover:text-[#835500] transition-colors mb-1">
              Añadir 3ª Receta al Comparador
            </h4>
            <p className="text-xs text-stone-500 max-w-xs mb-4">
              Puedes contrastar hasta un máximo de tres recetas simultáneamente para comparar nutrientes e ingredientes lado a lado.
            </p>
            <span className="px-4 py-2 rounded-full bg-stone-100 group-hover:bg-[#FFDDB9] text-stone-700 group-hover:text-[#835500] text-xs font-bold transition-all">
              + Seleccionar del catálogo
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
