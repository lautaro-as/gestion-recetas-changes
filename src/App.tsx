/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DietaryTag, Recipe, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeEditorModal } from './components/RecipeEditorModal';
import { RecipeFilterBar } from './components/RecipeFilterBar';
import { RecipeCompareView } from './components/RecipeCompareView';
import { ShoppingCartDrawer } from './components/ShoppingCartDrawer';
import { FeaturedRecipesPanel } from './components/FeaturedRecipesPanel';
import { CommunityForumView } from './components/CommunityForumView';
import { UserProfileView } from './components/UserProfileView';
import { ModerationAdminPanel } from './components/ModerationAdminPanel';
import { PrintRecipeView } from './components/PrintRecipeView';
import { AuthModals } from './components/AuthModals';
import { AuthLandingView } from './components/AuthLandingView';
import { ConfirmDownloadRecipeModal } from './components/ConfirmDownloadRecipeModal';
import { ReportModal } from './components/ReportModal';
import { PublicProfileModal } from './components/PublicProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  SearchScope,
  evaluateRF16Match,
  CATEGORY_DEFINITIONS,
  normalizeText,
} from './utils/searchUtils';
import {
  Sparkles,
  ChefHat,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  ShoppingBag,
  HeartHandshake
} from 'lucide-react';

function AppContent() {
  const {
    recipes,
    currentUser,
    isAuthenticated,
    allUsers,
    selectSpecificUser,
    followUserToggle,
    printableRecipe,
    setPrintableRecipe,
    recipeToConfirmDownload,
    setRecipeToConfirmDownload,
    executeDownloadRecipePdf,
    toast,
  } = useApp();

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'editor';

  // Navigation view: 'explorar' | 'destacadas' | 'foro' | 'comparar' | 'perfil' | 'moderacion'
  const [activeView, setActiveView] = useState<string>('explorar');
  const [isBrowsingAsGuest, setIsBrowsingAsGuest] = useState(false);

  // When logged out, reset guest browsing state
  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsBrowsingAsGuest(false);
    }
  }, [isAuthenticated]);

  // RF-16: Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('todo');
  const [selectedSpecificIngredients, setSelectedSpecificIngredients] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('todas');
  const [maxTime, setMaxTime] = useState(180);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'time' | 'calories'>('popular');

  // Modals state
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  
  // Report modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'recipe' | 'profile';
    id: string;
    title: string;
  }>({ type: 'recipe', id: '', title: '' });

  // RF-21: Búsqueda de Perfiles por nombre de usuario o alias (@usuario) con normalización insensible a tildes
  const matchedUsers = useMemo(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) return [];
    const cleanQ = normalizeText(rawQ.replace(/^@/, ''));
    return allUsers.filter((u) => {
      const matchUsername = normalizeText(u.username).includes(cleanQ);
      const matchAlias = `@${normalizeText(u.username)}`.includes(normalizeText(rawQ));
      const matchName = normalizeText(u.name).includes(cleanQ);
      const matchSpecialty = u.specialties.some((s) => normalizeText(s).includes(cleanQ));
      return matchUsername || matchAlias || matchName || matchSpecialty;
    });
  }, [allUsers, searchQuery]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = selectedTags.length;
    if (selectedCategory !== 'todas') count += 1;
    if (selectedDifficulty !== 'todas') count += 1;
    if (maxTime < 180) count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    if (searchScope !== 'todo') count += 1;
    count += selectedSpecificIngredients.length;
    return count;
  }, [selectedTags, selectedCategory, selectedDifficulty, maxTime, searchQuery, searchScope, selectedSpecificIngredients]);

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedCategory('todas');
    setSelectedDifficulty('todas');
    setMaxTime(180);
    setSearchQuery('');
    setSearchScope('todo');
    setSelectedSpecificIngredients([]);
  };

  // RF-16: Filtrado exhaustivo por palabras clave, ingredientes específicos, título o categoría general
  const filteredRecipesWithMeta = useMemo(() => {
    return recipes
      .filter((recipe) => {
        // If exploring, hide drafts unless current user is author
        if (recipe.status === 'draft' && recipe.authorId !== currentUser.id) {
          return false;
        }

        // RF-16: Búsqueda por palabras clave, ingredientes específicos, título o categoría general
        const matchResult = evaluateRF16Match(
          recipe,
          searchQuery,
          searchScope,
          selectedSpecificIngredients
        );
        if (!matchResult.matches) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'todas') {
          const def = CATEGORY_DEFINITIONS[selectedCategory];
          const allowedCategories = def ? def.matchesCategories : [selectedCategory];
          if (!allowedCategories.includes(recipe.category)) {
            return false;
          }
        }

        // Dietary tags filter (vegetarian, vegan, celiac, diabetic, keto...)
        if (selectedTags.length > 0) {
          const hasAllTags = selectedTags.every((tag) => recipe.tags.includes(tag));
          if (!hasAllTags) return false;
        }

        // Difficulty filter
        if (selectedDifficulty !== 'todas' && recipe.difficulty !== selectedDifficulty) {
          return false;
        }

        // Time filter
        const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;
        if (totalTime > maxTime) {
          return false;
        }

        return true;
      })
      .map((recipe) => {
        const matchResult = evaluateRF16Match(
          recipe,
          searchQuery,
          searchScope,
          selectedSpecificIngredients
        );
        return {
          recipe,
          matchReasons: matchResult.matchReasons,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.recipe.likesCount - a.recipe.likesCount;
        if (sortBy === 'recent') return new Date(b.recipe.createdAt).getTime() - new Date(a.recipe.createdAt).getTime();
        if (sortBy === 'time') return (a.recipe.prepTimeMin + a.recipe.cookTimeMin) - (b.recipe.prepTimeMin + b.recipe.cookTimeMin);
        if (sortBy === 'calories') return a.recipe.nutrition.calories - b.recipe.nutrition.calories;
        return 0;
      });
  }, [
    recipes,
    searchQuery,
    searchScope,
    selectedSpecificIngredients,
    selectedCategory,
    selectedTags,
    selectedDifficulty,
    maxTime,
    sortBy,
    currentUser,
  ]);

  const handleOpenReport = (type: 'recipe' | 'profile', id: string, title: string) => {
    setReportTarget({ type, id, title });
    setIsReportOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsEditorOpen(true);
  };

  const handleCreateNewRecipe = () => {
    setRecipeToEdit(null);
    setIsEditorOpen(true);
  };

  // If printable recipe is triggered, render full screen print preview!
  if (printableRecipe) {
    return (
      <PrintRecipeView
        recipe={printableRecipe}
        onClose={() => setPrintableRecipe(null)}
      />
    );
  }

  // Gateway: If not authenticated and not browsing as guest, show the Login/Register Page!
  if (!isAuthenticated && !isBrowsingAsGuest) {
    return (
      <>
        <AuthLandingView
          initialTab={authInitialMode}
          onBrowseAsGuest={() => setIsBrowsingAsGuest(true)}
        />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#333333] flex flex-col justify-between">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCreateRecipe={handleCreateNewRecipe}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          if (!isAuthenticated) {
            setIsBrowsingAsGuest(false);
          } else {
            setIsAuthOpen(true);
          }
        }}
        onSelectRecipeById={(recipeId) => {
          const found = recipes.find((r) => r.id === recipeId);
          if (found) {
            setSelectedRecipeDetail(found);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex-1 w-full">
        {/* VIEW 1: Explorar Recetas (Catálogo con filtros avanzados) */}
        {activeView === 'explorar' && (
          <div className="space-y-6">
            {/* Hero / Title Header from Stitch */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-[#000000] font-bold">
                  Explorar Recetas de Autor
                </h1>
                <p className="text-sm sm:text-base text-[#333333] max-w-2xl leading-relaxed">
                  Descubre creaciones gastronómicas minuciosamente detalladas por chefs independientes y apasionados del buen comer.
                </p>
              </div>

              {/* Quick Metrics Counter Badge */}
              <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shadow-sm self-start md:self-auto border border-stone-200/60">
                <div className="w-10 h-10 rounded-xl bg-[#FFDDB9] flex items-center justify-center text-[#835500]">
                  <span className="material-symbols-outlined text-[24px]">soup_kitchen</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-[#000000] leading-none">2,840+</span>
                  <span className="text-xs text-[#333333]">Recetas verificadas</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <RecipeFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchScope={searchScope}
              setSearchScope={setSearchScope}
              selectedSpecificIngredients={selectedSpecificIngredients}
              setSelectedSpecificIngredients={setSelectedSpecificIngredients}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
              maxTime={maxTime}
              setMaxTime={setMaxTime}
              sortBy={sortBy}
              setSortBy={setSortBy}
              activeFilterCount={activeFilterCount}
              onClearFilters={handleClearFilters}
            />

            {/* RF-21: Perfiles de Usuario Encontrados por Nombre de Usuario o Alias */}
            {matchedUsers.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E09F3E]/40 shadow-[0_4px_24px_-4px_rgba(197,130,38,0.12)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-[#FFDDB9] text-[#835500] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">person_search</span>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 font-display">
                          Perfiles encontrados ({matchedUsers.length})
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500">
                        Búsqueda de usuarios por alias (@{searchQuery.replace(/^@/, '')}) o nombre
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#835500] font-semibold hidden sm:inline">
                    Haz clic en "Entrar al perfil" para ver su biografía y recetas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedUsers.map((user) => {
                    const isFollowing = currentUser.followingUserIds.includes(user.id);
                    const userRecipeCount = recipes.filter(
                      (r) => r.authorId === user.id && r.status === 'published'
                    ).length;

                    return (
                      <div
                        key={user.id}
                        className="p-4 rounded-2xl bg-stone-50 hover:bg-[#FFFDF9] border border-stone-200 hover:border-[#E09F3E] transition-all flex flex-col justify-between gap-3 group shadow-2xs"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedUserProfile(user)}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-13 h-13 rounded-full object-cover ring-2 ring-[#E09F3E]/40 group-hover:scale-105 transition-transform shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-stone-900 truncate group-hover:text-[#835500] transition-colors">
                                {user.name}
                              </h4>
                              <span
                                className="material-symbols-outlined text-[#835500] text-[16px] shrink-0"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                verified
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[#865300] truncate">
                              @{user.username}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <span className="capitalize">{user.role}</span>
                              <span>•</span>
                              <span>{userRecipeCount} recetas</span>
                            </div>
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-xs text-stone-600 line-clamp-2">
                            {user.bio}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUserProfile(user)}
                            className="inline-flex items-center gap-1.5 bg-[#835500] hover:bg-[#5A3900] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">account_circle</span>
                            <span>Entrar al perfil</span>
                          </button>

                          {user.id !== currentUser.id ? (
                            <button
                              type="button"
                              onClick={() => followUserToggle(user.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                isFollowing
                                  ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                                  : 'bg-[#FFDDB9] text-[#714500] hover:bg-[#E09F3E] hover:text-white'
                              }`}
                            >
                              {isFollowing ? 'Siguiendo' : '+ Seguir'}
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-stone-400">Tu cuenta</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipe Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Catálogo Gastronómico ({filteredRecipesWithMeta.length} recetas disponibles)
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-[#835500] hover:underline font-semibold cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>

              {filteredRecipesWithMeta.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 space-y-3">
                  <span className="material-symbols-outlined text-[48px] text-stone-300">search_off</span>
                  <h3 className="font-bold text-stone-800 text-base">
                    {searchQuery.trim() || selectedSpecificIngredients.length > 0
                      ? `No se encontraron recetas con el criterio actual`
                      : 'No se encontraron recetas con los filtros seleccionados'}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {searchQuery.trim() || selectedSpecificIngredients.length > 0
                      ? 'Prueba cambiando el alcance de búsqueda (Todo, Título, Ingredientes, Palabras clave, Categoría), quitando ingredientes específicos o buscando usuarios por alias (@mateochef, @lucianutri).'
                      : 'Prueba ajustando los filtros dietéticos, ampliando el tiempo de cocción o limpiando los filtros.'}
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-2 px-5 py-2 bg-[#E09F3E] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRecipesWithMeta.map((item) => (
                    <RecipeCard
                      key={item.recipe.id}
                      recipe={item.recipe}
                      onOpenDetail={(r) => setSelectedRecipeDetail(r)}
                      onOpenReport={(r) => handleOpenReport('recipe', r.id, r.title)}
                      onEditRecipe={handleEditRecipe}
                      searchMatchReasons={item.matchReasons}
                    />
                  ))}
                </div>
              )}

              {/* Bottom Pagination Info */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-stone-200/60">
                <div className="flex items-center gap-2 text-[#333333] text-xs sm:text-sm">
                  <span>Mostrando <strong>1 - {filteredRecipesWithMeta.length}</strong> de <strong>{recipes.length}</strong> recetas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#714500] font-semibold">Gusto • Cocina de Autor</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Recetas Destacadas */}
        {activeView === 'destacadas' && (
          <FeaturedRecipesPanel
            onOpenDetail={(r) => setSelectedRecipeDetail(r)}
            onCreateRecipe={handleCreateNewRecipe}
          />
        )}

        {/* VIEW 3: Sistema de Foros de la Comunidad */}
        {activeView === 'foro' && (
          <CommunityForumView />
        )}

        {/* VIEW 4: Comparador de Recetas */}
        {activeView === 'comparar' && (
          <RecipeCompareView
            onOpenDetail={(r) => setSelectedRecipeDetail(r)}
            onExploreMore={() => setActiveView('explorar')}
          />
        )}

        {/* VIEW 5: Mi Perfil Personal */}
        {activeView === 'perfil' && (
          <UserProfileView
            onOpenDetail={(r) => setSelectedRecipeDetail(r)}
            onOpenReport={handleOpenReport}
            onEditRecipe={handleEditRecipe}
            onCreateRecipe={handleCreateNewRecipe}
            onViewUserProfile={(u) => setSelectedUserProfile(u)}
          />
        )}

        {/* VIEW 6: Panel de Moderación */}
        {activeView === 'moderacion' && (
          isStaff ? (
            <ModerationAdminPanel onOpenDetail={(r) => setSelectedRecipeDetail(r)} />
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 space-y-4 max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">shield_person</span>
              </div>
              <h2 className="font-bold text-stone-900 text-xl font-display">Acceso Restringido</h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                El panel de moderación está reservado exclusivamente para cuentas de moderación con rol de <strong>Administrador o Editor</strong>.
              </p>
              <p className="text-xs text-stone-400">
                Puedes cambiar rápidamente a una cuenta de moderación para auditar la plataforma:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => selectSpecificUser('user-ignacio')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#835500] hover:bg-[#5a3900] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Cambiar a Ignacio (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => selectSpecificUser('user-lucia')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#e09f3e] hover:bg-[#c58529] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Cambiar a Lucía (Editora)
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('explorar')}
                className="mt-3 text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Volver a Explorar
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer from Stitch */}
      <footer className="w-full bg-[#F6F3F2] border-t border-stone-200/80 py-10 mt-16">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#835500] text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                room_service
              </span>
              <h2 className="font-display text-xl font-bold text-[#000000] tracking-tight">Gusto</h2>
            </div>
            <p className="text-xs text-[#333333] mt-1">
              Sistema integral de gestión de recetas & Comunidad gastronómica
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#514536]">Plataforma Gastronómica de Recetas</span>
            {isStaff && (
              <button
                onClick={() => setActiveView('moderacion')}
                className="inline-flex items-center gap-1.5 text-xs text-[#333333] hover:text-[#000000] font-medium transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#835500] text-[18px]">verified_user</span>
                <span>Panel de moderación</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals and Drawers wrapped in ErrorBoundary */}
      <ErrorBoundary>
        <RecipeDetailModal
          recipe={recipes.find((r) => r.id === selectedRecipeDetail?.id) || selectedRecipeDetail}
          onClose={() => setSelectedRecipeDetail(null)}
          onEditRecipe={handleEditRecipe}
          onOpenReport={(r) => handleOpenReport('recipe', r.id, r.title)}
          onOpenUserProfile={(u) => setSelectedUserProfile(u)}
        />

        <PublicProfileModal
          user={allUsers.find((u) => u.id === selectedUserProfile?.id) || selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onOpenRecipeDetail={(r) => setSelectedRecipeDetail(r)}
          onOpenReport={handleOpenReport}
          onSwitchUser={(userId) => selectSpecificUser(userId)}
        />

        <RecipeEditorModal
          key={recipeToEdit?.id ? `edit-${recipeToEdit.id}` : 'new-recipe'}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setRecipeToEdit(null);
          }}
          recipeToEdit={recipeToEdit}
        />
      </ErrorBoundary>

      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <AuthModals
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
      />

      <ConfirmDownloadRecipeModal
        isOpen={!!recipeToConfirmDownload}
        recipe={recipeToConfirmDownload}
        onConfirm={() => executeDownloadRecipePdf()}
        onCancel={() => setRecipeToConfirmDownload(null)}
      />

      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
