import React, { useState } from 'react';
import { Recipe } from '../types';
import { useApp } from '../context/AppContext';
import { ConfirmDeleteRecipeModal } from './ConfirmDeleteRecipeModal';

interface RecipeCardProps {
  recipe: Recipe;
  onOpenDetail: (recipe: Recipe) => void;
  onOpenReport?: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  searchMatchReasons?: { type: string; label: string }[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onOpenDetail,
  onOpenReport,
  onEditRecipe,
  searchMatchReasons,
}) => {
  const {
    currentUser,
    deleteRecipe,
    toggleLikeRecipe,
    toggleDislikeRecipe,
    toggleWishlist,
    comparingRecipeIds,
    toggleCompareRecipe,
    addRecipeIngredientsToCart,
    togglePinRecipe,
    setPrintableRecipe,
    exportRecipePdf,
    exportRecipeText,
    publishScheduledNow,
    isAuthenticated,
    promptAuthRequired,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isLiked = (recipe.likedUserIds || []).includes(currentUser?.id);
  const isDisliked = (recipe.dislikedUserIds || []).includes(currentUser?.id);
  const isInWishlist = (currentUser?.wishlistRecipeIds || []).includes(recipe.id);
  const isComparing = (comparingRecipeIds || []).includes(recipe.id);
  const isAuthor = recipe.authorId === currentUser?.id;
  const isCoAuthor = Boolean(
    recipe.coAuthors &&
      recipe.coAuthors.some(
        (ca) =>
          ca.toLowerCase().includes((currentUser?.name || '').toLowerCase()) ||
          ca.toLowerCase().includes((currentUser?.username || '').toLowerCase()) ||
          (ca.startsWith('@') && ca.slice(1).toLowerCase() === (currentUser?.username || '').toLowerCase())
      )
  );
  const isStaff = currentUser?.role === 'editor' || currentUser?.role === 'admin';
  const canEdit = isAuthor || isCoAuthor || isStaff;
  const canPin = isAuthor || isStaff;
  const canDelete = isAuthor || isStaff;

  const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      promptAuthRequired('Debes iniciar sesión para agregar ingredientes al carrito de compras.');
      return;
    }
    addRecipeIngredientsToCart(recipe);
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 1500);
  };

  return (
    <article className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(197,130,38,0.06),0_2px_6px_-1px_rgba(17,17,17,0.04)] hover:shadow-[0_12px_32px_-4px_rgba(197,130,38,0.14)] transition-all duration-300 group border border-stone-200/50">
      {/* Top Image & Floating Badges */}
      <div className="relative w-full h-52 overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onOpenDetail(recipe)}>
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Floating Time Badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs text-[#333333] flex items-center gap-1 shadow-sm font-semibold">
          <span className="material-symbols-outlined text-[14px] text-[#835500]">timer</span>
          {totalTime} min
        </span>

        {/* Floating Difficulty Badge */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs text-[#835500] font-bold shadow-sm capitalize">
          {recipe.difficulty === 'facil' ? 'Fácil' : recipe.difficulty === 'media' ? 'Intermedia' : 'Maestro'}
        </span>

        {/* Pinned / Status Badges on image if applicable */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {recipe.isPinned && (
            <span className="bg-[#E09F3E] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">push_pin</span>
              Fijada
            </span>
          )}
          {recipe.status === 'draft' && (
            <span className="bg-stone-800/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Borrador
            </span>
          )}
          {recipe.status === 'scheduled' && (
            <span className="bg-[#835500] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Programada
            </span>
          )}
        </div>

        {/* Action icons container: Direct Pin (if author/staff) and Wishlist */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          {canPin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePinRecipe(recipe.id);
              }}
              aria-label={recipe.isPinned ? "Desfijar del perfil" : "Fijar en la parte superior del perfil"}
              title={recipe.isPinned ? "Receta fijada al inicio de tu perfil (clic para desfijar)" : "Fijar en la parte superior de tu perfil personal"}
              className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-sm transition-all cursor-pointer ${
                recipe.isPinned
                  ? 'bg-[#E09F3E] text-white ring-2 ring-white scale-105 shadow-md'
                  : 'bg-white/85 text-[#5A3900] hover:bg-[#E09F3E] hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined text-[17px]"
                style={recipe.isPinned ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                push_pin
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                promptAuthRequired('Debes iniciar sesión para guardar recetas en tu lista de deseos.');
                return;
              }
              toggleWishlist(recipe.id);
            }}
            aria-label="Guardar en favoritos"
            title="Guardar en lista de deseos"
            className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-sm transition-all cursor-pointer ${
              isInWishlist
                ? 'bg-[#AB3333] text-white'
                : 'bg-white/80 text-[#333333] hover:text-[#AB3333] hover:bg-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={isInWishlist ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bookmark
            </span>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Author info & Dietary tags */}
          <div className="flex items-center justify-between text-xs text-[#714500] mb-1.5 font-medium">
            <span className="truncate">Por {recipe.authorName || 'Chef'}</span>
            <span className="text-[#837564] text-[11px]">{(recipe.category || 'General').toUpperCase()}</span>
          </div>

          <h2
            onClick={() => onOpenDetail(recipe)}
            className="font-display text-lg sm:text-xl font-bold text-[#000000] tracking-tight mb-2 group-hover:text-[#835500] transition-colors leading-tight cursor-pointer line-clamp-1"
          >
            {recipe.title}
          </h2>

          <p className="text-xs sm:text-sm text-[#333333] line-clamp-2 mb-4 leading-relaxed">
            {recipe.description}
          </p>

          {/* Dietary tags row */}
          {(recipe.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {(recipe.tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFDDB9] text-[#714500]"
                >
                  #{tag}
                </span>
              ))}
              {(recipe.tags || []).length > 3 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] text-stone-400">
                  +{(recipe.tags || []).length - 3}
                </span>
              )}
            </div>
          )}

          {/* RF-16 Search Match Reason indicator */}
          {searchMatchReasons && searchMatchReasons.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-[#714500] font-medium animate-in fade-in duration-150">
              <span className="material-symbols-outlined text-[14px] text-[#835500] shrink-0">
                {searchMatchReasons[0].type === 'ingrediente'
                  ? 'kitchen'
                  : searchMatchReasons[0].type === 'categoria'
                  ? 'dinner_dining'
                  : searchMatchReasons[0].type === 'palabra_clave'
                  ? 'auto_awesome'
                  : 'search'}
              </span>
              <span className="truncate">Coincide {searchMatchReasons[0].label}</span>
            </div>
          )}
        </div>

        {/* Footer with Likes/Dislikes, Calories and Actions */}
        <div className="pt-3 border-t border-stone-100 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[#333333]">
            {/* Likes & Dislikes */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    promptAuthRequired('Debes iniciar sesión para calificar recetas con Me Gusta.');
                    return;
                  }
                  toggleLikeRecipe(recipe.id);
                }}
                title="Me gusta"
                className={`flex items-center gap-1 transition-colors cursor-pointer select-none ${
                  isLiked ? 'text-[#835500] font-bold' : 'hover:text-[#835500]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  thumb_up
                </span>
                <span className="text-xs font-semibold">{recipe.likesCount}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    promptAuthRequired('Debes iniciar sesión para calificar recetas.');
                    return;
                  }
                  toggleDislikeRecipe(recipe.id);
                }}
                title="No me gusta"
                className={`flex items-center gap-1 transition-colors cursor-pointer select-none ${
                  isDisliked ? 'text-[#AB3333] font-bold' : 'hover:text-[#AB3333]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={isDisliked ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  thumb_down
                </span>
                <span className="text-xs font-semibold">{recipe.dislikesCount}</span>
              </button>
            </div>

            {/* Calories badge */}
            <span className="inline-flex items-center gap-1 bg-[#F0EDED] px-2.5 py-0.5 rounded-full text-[#333333] text-xs font-medium">
              <span className="material-symbols-outlined text-[14px] text-[#E09F3E]">
                local_fire_department
              </span>
              {recipe.nutrition?.calories ?? 0} kcal
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              {/* Add Ingredients to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label="Añadir ingredientes al carrito"
                title="Añadir ingredientes al carrito"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                  cartSuccess
                    ? 'bg-[#E09F3E] text-white'
                    : 'bg-[#FFDDB9] text-[#835500] hover:bg-[#E09F3E] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {cartSuccess ? 'check' : 'shopping_cart'}
                </span>
              </button>

              {/* Ver Receta Button */}
              <button
                type="button"
                onClick={() => onOpenDetail(recipe)}
                className="inline-flex items-center gap-1 bg-[#835500] text-white hover:bg-[#865300] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Ver receta</span>
              </button>

              {/* Compare Button (up to 3 recipes) */}
              <button
                type="button"
                onClick={() => toggleCompareRecipe(recipe.id)}
                title={
                  isComparing
                    ? "Quitar del comparador"
                    : comparingRecipeIds.length >= 3
                    ? "Límite alcanzado: máximo 3 recetas lado a lado"
                    : "Comparar hasta 3 recetas lado a lado"
                }
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  isComparing
                    ? 'bg-[#E09F3E] text-white shadow-sm font-semibold'
                    : 'bg-[#F0EDED] text-[#333333] hover:bg-[#FFDDB9]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">balance</span>
                <span>{isComparing ? 'En comparador' : 'Comparar'}</span>
              </button>
            </div>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Más opciones"
                title="Opciones adicionales"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#333333] hover:text-[#000000] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-40 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => {
                        togglePinRecipe(recipe.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#835500]">push_pin</span>
                      <span>{recipe.isPinned ? 'Desfijar' : 'Fijar receta'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPrintableRecipe(recipe);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                  >
                    <span className="material-symbols-outlined text-[16px] text-stone-600">print</span>
                    <span>Imprimir receta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportRecipePdf(recipe);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                  >
                    <span className="material-symbols-outlined text-[16px] text-stone-600">picture_as_pdf</span>
                    <span>Descargar receta (PDF)</span>
                  </button>

                  {recipe.status === 'scheduled' && isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        publishScheduledNow(recipe.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-[#835500] font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">schedule_send</span>
                      <span>Publicar ahora</span>
                    </button>
                  )}

                  {canEdit && onEditRecipe && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditRecipe(recipe);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center gap-2 text-amber-800 font-medium border-t border-stone-100 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Editar receta</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium border-t border-stone-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Eliminar receta</span>
                    </button>
                  )}

                  {onOpenReport && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (!isAuthenticated) {
                          promptAuthRequired('Debes iniciar sesión para denunciar una receta.');
                          return;
                        }
                        onOpenReport(recipe);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-[#AB3333] border-t border-stone-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">flag</span>
                      <span>Denunciar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteRecipeModal
        isOpen={isDeleteModalOpen}
        recipeTitle={recipe.title}
        onConfirm={() => {
          deleteRecipe(recipe.id);
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </article>
  );
};
