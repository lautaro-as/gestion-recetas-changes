import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe, UserProfile, DietaryTag, SubProfile } from '../types';
import { RecipeCard } from './RecipeCard';
import { ScrollableFilterBar } from './ScrollableFilterBar';
import { ConfirmDeleteRecipeModal } from './ConfirmDeleteRecipeModal';
import { Trash2 } from 'lucide-react';

interface UserProfileViewProps {
  onOpenDetail: (recipe: Recipe) => void;
  onOpenReport: (targetType: 'recipe' | 'profile', targetId: string, title: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onCreateRecipe: () => void;
  onViewUserProfile?: (user: UserProfile) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onOpenDetail,
  onOpenReport,
  onEditRecipe,
  onCreateRecipe,
  onViewUserProfile,
}) => {
  const {
    currentUser,
    allUsers,
    recipes,
    deleteRecipe,
    collections,
    createCollection,
    exportCollectionPackage,
    exportWeeklyPlannerPdf,
    exportRecipePackagePdf,
    exportRecipePdf,
    getFamousWeeklyRecipes,
    switchUserRole,
    updateUserProfile,
    addSubProfile,
    switchActiveSubProfile,
    followUserToggle,
    selectSpecificUser,
    publishScheduledNow,
    togglePinRecipe,
    logoutUser,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'creadas' | 'borradores' | 'programadas' | 'colecciones' | 'deseos' | 'planificador_premium' | 'explorar_cocineros'
  >('creadas');
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Edit profile state
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [specialtiesText, setSpecialtiesText] = useState(currentUser.specialties.join(', '));

  // Add subprofile state
  const [showAddSubProfile, setShowAddSubProfile] = useState(false);
  const [subName, setSubName] = useState('');
  const [subRelation, setSubRelation] = useState('Familiar');
  const [subDiet, setSubDiet] = useState<DietaryTag[]>([]);

  // Create collection state
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');

  // Filter recipes for user - Pinned recipe always appears at the top
  const myCreated = recipes
    .filter((r) => r.authorId === currentUser.id && r.status === 'published')
    .sort((a, b) => {
      const aPinned = a.id === currentUser.pinnedRecipeId || a.isPinned;
      const bPinned = b.id === currentUser.pinnedRecipeId || b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const myDrafts = recipes.filter((r) => r.authorId === currentUser.id && r.status === 'draft');
  const myScheduled = recipes.filter((r) => r.authorId === currentUser.id && r.status === 'scheduled');
  const myWishlist = recipes.filter((r) => currentUser.wishlistRecipeIds.includes(r.id));
  const myCollections = collections.filter((c) => c.userId === currentUser.id);

  // Pinned recipe if exists
  const pinnedRecipe = recipes.find((r) => r.id === currentUser.pinnedRecipeId);

  // Profile search (RF-21: Búsqueda por nombre de usuario, alias o especialidad)
  const cleanProfileQuery = profileSearchQuery.trim().toLowerCase().replace(/^@/, '');
  const rawProfileQuery = profileSearchQuery.trim().toLowerCase();
  const filteredUsers = allUsers.filter((u) => {
    if (!cleanProfileQuery) return true;
    return (
      u.username.toLowerCase().includes(cleanProfileQuery) ||
      `@${u.username.toLowerCase()}`.includes(rawProfileQuery) ||
      u.name.toLowerCase().includes(cleanProfileQuery) ||
      u.specialties.some((s) => s.toLowerCase().includes(cleanProfileQuery))
    );
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      bio,
      specialties: specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    });
    setIsEditingProfile(false);
    showToast('Perfil actualizado correctamente');
  };

  const handleAddSubProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    addSubProfile(subName, subRelation, subDiet);
    setSubName('');
    setSubDiet([]);
    setShowAddSubProfile(false);
    showToast(`Subperfil ${subName} creado exitosamente`);
  };

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;
    createCollection(colName, colDesc, []);
    setColName('');
    setColDesc('');
    setShowCreateCollection(false);
    showToast('Nueva colección culinaria creada');
  };

  const toggleSubDietTag = (tag: DietaryTag) => {
    setSubDiet((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-16">
      {/* Profile Showcase Bento */}
      <div className="relative bg-white rounded-3xl shadow-[0_4px_24px_-2px_rgba(197,130,38,0.08)] p-6 sm:p-8 overflow-hidden border border-stone-200/50">
        {/* Ambient warm glow accent in top corner */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#E09F3E]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          {/* Left: Avatar & Bio details */}
          <div className="flex flex-col md:flex-row items-start gap-6 max-w-4xl">
            {/* Chef Portrait with Verified Cloche Badge */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(131,85,0,0.18)] ring-4 ring-[#E09F3E]/20">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#E09F3E] text-white flex items-center justify-center shadow-md"
                title="Chef Verificado"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  restaurant_menu
                </span>
              </div>
            </div>

            {/* Bio & Credentials */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B1C1C] tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="bg-[#FFDDB4] text-[#291800] text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Rol {currentUser.role}
                </span>
                {currentUser.activeSubProfileId && (
                  <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Subperfil Activo
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#514536] font-medium">
                <span className="material-symbols-outlined text-[#835500] text-[18px]">
                  location_on
                </span>
                <span>{currentUser.location || 'Madrid, España'}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300 mx-1"></span>
                <span className="text-[#865300]">@{currentUser.username}</span>
              </div>

              <p className="text-xs sm:text-sm text-[#514536] mt-1 leading-relaxed max-w-2xl">
                {currentUser.bio}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentUser.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F6F3F2] text-[#514536]"
                  >
                    ✦ {spec}
                  </span>
                ))}
              </div>

              {/* Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 pt-3 border-t border-stone-100">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#1B1C1C]">
                    {currentUser.followersCount ?? 0}
                  </span>
                  <span className="text-[10px] text-[#514536] uppercase tracking-wider font-semibold">
                    Seguidores
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#1B1C1C]">
                    {currentUser.followingUserIds?.length ?? 0}
                  </span>
                  <span className="text-[10px] text-[#514536] uppercase tracking-wider font-semibold">
                    Seguidos
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-[#1B1C1C]">
                    {myCreated.length}
                  </span>
                  <span className="text-[10px] text-[#514536] uppercase tracking-wider font-semibold">
                    Recetas Creadas
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-[#1B1C1C]">4.9</span>
                    <span
                      className="material-symbols-outlined text-[#E09F3E] text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <span className="text-[10px] text-[#514536] uppercase tracking-wider font-semibold">
                    Valoración Media
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions Cluster & Subprofile switcher */}
          <div className="flex flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="inline-flex items-center justify-center gap-2 bg-[#E09F3E] hover:bg-[#835500] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-[0_4px_14px_rgba(224,159,62,0.35)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Editar perfil</span>
              </button>

              <button
                type="button"
                onClick={logoutUser}
                className="inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-all cursor-pointer"
                title="Cerrar sesión y volver a la página principal"
              >
                <span className="material-symbols-outlined text-[18px] text-rose-600">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </div>

            {/* Subprofiles dropdown button */}
            <div className="bg-[#F6F3F2] p-3 rounded-2xl border border-stone-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B1C1C] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#835500]">
                    group
                  </span>
                  Subperfiles
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddSubProfile(!showAddSubProfile)}
                  className="text-[11px] text-[#835500] font-bold hover:underline cursor-pointer"
                >
                  + Agregar
                </button>
              </div>

              {/* Subprofiles list */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => switchActiveSubProfile(null)}
                  className={`w-full text-left px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
                    currentUser.activeSubProfileId === null
                      ? 'bg-[#FFDDB9] text-[#2B1700] font-bold'
                      : 'hover:bg-white text-stone-700'
                  }`}
                >
                  Principal: {currentUser.name}
                </button>
                {currentUser.subprofiles?.map((sp: SubProfile) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => switchActiveSubProfile(sp.id)}
                    className={`w-full text-left px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
                      currentUser.activeSubProfileId === sp.id
                        ? 'bg-[#FFDDB9] text-[#2B1700] font-bold'
                        : 'hover:bg-white text-stone-700'
                    }`}
                  >
                    {sp.name} ({sp.relation}) - {sp.dietaryRestrictions.join(', ') || 'Sin restricción'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form drawer/toggle */}
        {isEditingProfile && (
          <form onSubmit={handleProfileSave} className="mt-6 pt-6 border-t border-stone-100 space-y-4">
            <h3 className="font-bold text-sm text-[#1B1C1C]">Editar Datos Personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F3F3] text-xs focus:ring-2 focus:ring-[#E09F3E] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Especialidades</label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F3F3] text-xs focus:ring-2 focus:ring-[#E09F3E] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">Biografía</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F3F3] text-xs focus:ring-2 focus:ring-[#E09F3E] outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-full bg-[#E09F3E] hover:bg-[#835500] text-white text-xs font-bold shadow-sm"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        )}

        {/* Add Subprofile Form Modal/Drawer */}
        {showAddSubProfile && (
          <form onSubmit={handleAddSubProfileSubmit} className="mt-4 p-4 rounded-2xl bg-[#FFF8F0] border border-amber-200 space-y-3">
            <h4 className="font-bold text-xs text-[#835500]">Nuevo Subperfil Familiar / Dietético</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre del familiar (ej. Lucas)"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white text-xs border border-amber-200 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Parentesco (ej. Hijo, Pareja)"
                value={subRelation}
                onChange={(e) => setSubRelation(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white text-xs border border-amber-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#835500]">Restricciones dietéticas:</label>
              <div className="flex flex-wrap gap-1.5">
                {(['celiaco', 'vegano', 'vegetariano', 'diabetico', 'keto', 'sin_lactosa'] as DietaryTag[]).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSubDietTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      subDiet.includes(tag)
                        ? 'bg-[#835500] text-white font-bold'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddSubProfile(false)}
                className="px-3 py-1 rounded-full text-xs text-stone-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#835500] text-white text-xs font-bold"
              >
                Crear subperfil
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Stats Bento Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Top Recipe */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 border border-stone-200/50">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDDB9] flex items-center justify-center text-[#835500] shrink-0">
            <span className="material-symbols-outlined text-[26px]">local_fire_department</span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#514536] uppercase tracking-wider font-bold block">
              Receta destacada propia
            </span>
            <p className="text-sm font-bold text-[#1B1C1C] truncate">
              {myCreated[0]?.title || 'Aún sin recetas'}
            </p>
            <span className="text-xs text-[#835500] font-semibold">
              {myCreated[0]?.likesCount ? `${myCreated[0].likesCount} votos positivos` : 'Comienza a cocinar'}
            </span>
          </div>
        </div>

        {/* Stat 2: Total Reach / Collections */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 border border-stone-200/50">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDDB4] flex items-center justify-center text-[#633F00] shrink-0">
            <span className="material-symbols-outlined text-[26px]">collections_bookmark</span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#514536] uppercase tracking-wider font-bold block">
              Colecciones Culinarias
            </span>
            <p className="text-sm font-bold text-[#1B1C1C] truncate">
              {myCollections.length} Colecciones creadas
            </p>
            <span className="text-xs text-[#835500] font-semibold">Planificador & Paquetes .PDF</span>
          </div>
        </div>

        {/* Stat 3: Wishlist items */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 border border-stone-200/50">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F3F2] flex items-center justify-center text-[#1B1C1C] shrink-0">
            <span className="material-symbols-outlined text-[26px]">favorite</span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#514536] uppercase tracking-wider font-bold block">
              Lista de Deseos
            </span>
            <p className="text-sm font-bold text-[#1B1C1C] truncate">
              {myWishlist.length} Recetas guardadas
            </p>
            <span className="text-xs text-[#835500] font-medium">Listas para preparar</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Section */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2 gap-3">
        <ScrollableFilterBar className="flex-1 min-w-0" gradientBg="from-white via-white/95">
          <button
            type="button"
            onClick={() => setActiveTab('creadas')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'creadas'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>Mis recetas</span>
            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[11px]">
              {myCreated.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('borradores')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'borradores'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">draft</span>
            <span>Borradores</span>
            <span className="bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded-full text-[11px]">
              {myDrafts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programadas')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'programadas'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">event_note</span>
            <span>Programadas</span>
            <span className="bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded-full text-[11px]">
              {myScheduled.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colecciones')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'colecciones'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">collections_bookmark</span>
            <span>Colecciones</span>
            <span className="bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded-full text-[11px]">
              {myCollections.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planificador_premium')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'planificador_premium'
                ? 'bg-gradient-to-r from-[#835500] to-[#E09F3E] text-white shadow-sm ring-2 ring-[#E09F3E]/40'
                : 'text-[#835500] bg-amber-50 hover:bg-amber-100/90 font-bold border border-amber-200/70'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Planificador Semanal PDF</span>
            <span className="bg-[#835500] text-amber-100 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Premium
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deseos')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'deseos'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            <span>Lista de deseos</span>
            <span className="bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded-full text-[11px]">
              {myWishlist.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explorar_cocineros')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'explorar_cocineros'
                ? 'bg-[#E09F3E] text-white shadow-sm'
                : 'text-[#514536] hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_search</span>
            <span>Buscar cocineros</span>
          </button>
        </ScrollableFilterBar>

        <button
          type="button"
          onClick={onCreateRecipe}
          className="shrink-0 hidden md:inline-flex items-center gap-1.5 bg-[#835500] hover:bg-[#865300] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Crear nueva</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. MIS RECETAS CREADAS */}
      {activeTab === 'creadas' && (
        <div className="space-y-6">
          {/* Pinned recipe highlight if exists */}
          {pinnedRecipe && (
            <div className="p-4 rounded-3xl bg-[#FFDDB9]/40 border border-[#E09F3E]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-full bg-[#E09F3E] text-white">
                  <span className="material-symbols-outlined text-[20px]">push_pin</span>
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#835500]">
                    Receta Fijada al Inicio de tu Perfil
                  </span>
                  <h4 className="text-sm font-bold text-[#1B1C1C]">{pinnedRecipe.title}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePinRecipe(pinnedRecipe.id)}
                  className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-[#835500] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">push_pin</span>
                  <span>Desfijar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetail(pinnedRecipe)}
                  className="px-4 py-1.5 rounded-full bg-white text-[#835500] text-xs font-bold shadow-xs hover:bg-[#F6F3F2] cursor-pointer"
                >
                  Ver receta
                </button>
              </div>
            </div>
          )}

          {myCreated.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/60 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-stone-300">menu_book</span>
              <h3 className="font-bold text-stone-800 text-sm sm:text-base">Aún no has publicado recetas</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Comparte tu pasión gastronómica creando tu primera receta pública en Gusto.
              </p>
              <button
                type="button"
                onClick={onCreateRecipe}
                className="mt-2 px-5 py-2 rounded-full bg-[#E09F3E] text-white text-xs font-bold shadow-sm"
              >
                Crear mi primera receta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCreated.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpenDetail={onOpenDetail}
                  onOpenReport={(r) => onOpenReport('recipe', r.id, r.title)}
                  onEditRecipe={onEditRecipe}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. BORRADORES */}
      {activeTab === 'borradores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B1C1C]">
              Tus borradores en proceso de redacción
            </h3>
            <button
              type="button"
              onClick={onCreateRecipe}
              className="text-xs font-bold text-[#835500] hover:underline"
            >
              + Nuevo borrador
            </button>
          </div>

          {myDrafts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/60 text-xs text-stone-400">
              No tienes recetas en borrador actualmente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDrafts.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        Borrador privado
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {recipe.prepTimeMin + recipe.cookTimeMin} mins
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-stone-900 mb-1">{recipe.title}</h4>
                    <p className="text-xs text-stone-500 line-clamp-2">{recipe.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onEditRecipe(recipe)}
                      className="px-4 py-1.5 rounded-full bg-[#E09F3E] text-white text-xs font-bold shadow-xs hover:bg-[#835500] cursor-pointer"
                    >
                      Continuar editando
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(recipe)}
                        className="text-xs font-semibold text-stone-500 hover:text-stone-900 px-2 py-1 cursor-pointer"
                      >
                        Previsualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipeToDelete(recipe)}
                        title="Eliminar borrador"
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PROGRAMADAS */}
      {activeTab === 'programadas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1B1C1C]">
                Recetas programadas para publicación automática
              </h3>
              <p className="text-xs text-stone-500">
                Lanzamientos automáticos en fecha y hora fijada por el autor
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateRecipe}
              className="px-3.5 py-1.5 rounded-full bg-[#E09F3E] text-white text-xs font-semibold hover:bg-[#835500] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Programar nueva receta</span>
            </button>
          </div>

          {myScheduled.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/60 text-xs text-stone-500 space-y-2">
              <span className="material-symbols-outlined text-[36px] text-[#835500] block mx-auto">
                event_upcoming
              </span>
              <p className="font-semibold text-stone-700">No tienes recetas programadas actualmente.</p>
              <p className="text-stone-400 max-w-md mx-auto">
                Al crear o editar una receta, selecciona "Programar Lanzamiento" y define la fecha deseada para que se publique automáticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myScheduled.map((recipe) => (
                <div key={recipe.id} className="flex flex-col gap-2">
                  {recipe.scheduledPublishDate && (
                    <div className="bg-amber-50 text-amber-900 border border-amber-200/90 px-3 py-2 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[16px] text-[#835500] shrink-0">schedule</span>
                        <span className="truncate">
                          Se publicará: <strong>{(() => {
                            try {
                              const d = new Date(recipe.scheduledPublishDate);
                              return isNaN(d.getTime())
                                ? 'Próximamente'
                                : d.toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                            } catch {
                              return 'Próximamente';
                            }
                          })()}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => publishScheduledNow(recipe.id)}
                        className="px-2.5 py-1 bg-[#E09F3E] hover:bg-[#835500] text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                        title="Publicar esta receta inmediatamente"
                      >
                        <span className="material-symbols-outlined text-[13px]">schedule_send</span>
                        <span>Publicar ahora</span>
                      </button>
                    </div>
                  )}
                  <RecipeCard
                    recipe={recipe}
                    onOpenDetail={onOpenDetail}
                    onOpenReport={(r) => onOpenReport('recipe', r.id, r.title)}
                    onEditRecipe={onEditRecipe}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. COLECCIONES CULINARIAS */}
      {activeTab === 'colecciones' && (
        <div className="space-y-4">
          {/* Banner Planificador Semanal PDF */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-600/10 border border-amber-300/70 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-[#835500] text-white shadow-xs">
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#835500]">
                    Planificador Semanal & Paquetes .PDF
                  </span>
                  <span className="bg-[#835500] text-amber-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    Premium
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium">
                  Genera el menú semanal de 7 días con las recetas más famosas de la semana y lista consolidada de compras en formato PDF.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('planificador_premium')}
              className="px-4 py-2 rounded-full bg-[#835500] hover:bg-[#664200] text-white text-xs font-bold shrink-0 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Planificador Semanal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B1C1C]">
              Tus colecciones y paquetes culinarios
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateCollection(!showCreateCollection)}
              className="text-xs font-bold text-[#835500] hover:underline"
            >
              + Nueva colección
            </button>
          </div>

          {showCreateCollection && (
            <form
              onSubmit={handleCreateCollectionSubmit}
              className="p-5 rounded-3xl bg-white border border-[#E09F3E]/40 shadow-sm space-y-3"
            >
              <h4 className="text-xs font-bold text-[#835500]">Crear Nueva Colección Culinaria</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre de la colección (ej. Postres de Otoño)"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F3F3F3] text-xs focus:ring-2 focus:ring-[#E09F3E] outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Descripción breve de la colección"
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F3F3F3] text-xs focus:ring-2 focus:ring-[#E09F3E] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCollection(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-stone-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-full bg-[#E09F3E] text-white text-xs font-bold shadow-xs"
                >
                  Guardar Colección
                </button>
              </div>
            </form>
          )}

          {myCollections.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/60 text-xs text-stone-400">
              Aún no has creado colecciones. ¡Agrupa tus recetas favoritas para compartirlas o exportarlas en paquete!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCollections.map((col) => (
                <div
                  key={col.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-2xl bg-[#FFDDB9] text-[#835500]">
                        <span className="material-symbols-outlined text-[20px]">
                          collections_bookmark
                        </span>
                      </span>
                      <span className="text-xs text-stone-400 font-semibold">
                        {col.recipeIds.length} recetas
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-stone-900 mb-1">{col.name}</h4>
                    <p className="text-xs text-stone-500 line-clamp-2">{col.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => exportRecipePackagePdf(col)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#E09F3E] hover:bg-[#835500] text-white px-3.5 py-1.5 rounded-full shadow-xs cursor-pointer transition-colors"
                      title="Descargar recetas de esta colección en formato digital .PDF"
                    >
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      <span>Exportar paquete (.PDF)</span>
                    </button>
                    <span className="text-[10px] font-bold text-amber-900/70 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      Premium .PDF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. LISTA DE DESEOS */}
      {activeTab === 'deseos' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1B1C1C]">
            Tu lista de recetas deseadas
          </h3>
          {myWishlist.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/60 text-xs text-stone-400">
              No tienes recetas en tu lista de deseos todavía. Puedes guardar recetas haciendo clic en el marcador de favoritos de cualquier tarjeta.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myWishlist.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpenDetail={onOpenDetail}
                  onOpenReport={(r) => onOpenReport('recipe', r.id, r.title)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. PLANIFICADOR SEMANAL Y PAQUETES DE RECETAS EN PDF (RF-30) */}
      {activeTab === 'planificador_premium' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[#835500] via-[#A86E00] to-[#E09F3E] text-white p-6 sm:p-8 shadow-md overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-amber-200">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  <span>Módulo Exclusivo Premium</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Planificador Semanal & Paquetes de Recetas (.PDF)
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                  Exporta menús semanales de 7 días, listas de compras para el supermercado y paquetes compilados con las recetas más famosas y votadas de la semana en formato digital PDF de alta calidad.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-amber-200 font-bold block mb-1">
                  Tu Estado Actual
                </span>
                <span className="text-sm font-bold text-white flex items-center justify-center sm:justify-end gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {currentUser.role === 'premium' || currentUser.role === 'admin' ? 'verified' : 'lock'}
                  </span>
                  {currentUser.role === 'premium'
                    ? 'Socio Premium Activo'
                    : currentUser.role === 'admin'
                    ? 'Administrador (Acceso Total)'
                    : 'Cuenta Estándar (Bloqueado)'}
                </span>
              </div>
            </div>
          </div>

          {/* Premium Check & Upgrade Callout */}
          {!(currentUser.role === 'premium' || currentUser.role === 'admin') && (
            <div className="rounded-3xl bg-white border-2 border-amber-300 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#835500] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">lock_person</span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-base font-bold text-stone-900">
                    Beneficio Exclusivo para Usuarios Premium
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    La descarga y exportación de <strong>paquetes de recetas</strong> y <strong>planificadores semanales en formato .PDF</strong> está reservada para miembros con rol Premium. Como usuario actual con rol <strong>"{currentUser.role}"</strong>, puedes activar el rol Premium instantáneamente con un solo clic para probar y descargar los documentos en PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    switchUserRole('premium');
                    showToast('⭐ ¡Membresía Premium activada! Ahora puedes descargar el Planificador Semanal y Paquetes en PDF.');
                  }}
                  className="px-5 py-3 rounded-full bg-[#835500] hover:bg-[#664200] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  <span>Activar Rol Premium Ahora</span>
                </button>
              </div>

              {/* What is included preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-stone-100">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#835500]">calendar_view_week</span>
                    Menú Semanal 7 Días
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Planificación estructurada de almuerzo y cena con tiempos exactos y porciones.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#835500]">shopping_cart_checkout</span>
                    Lista de Compras Consolidada
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Ingredientes agrupados por categoría (frescos, lácteos, despensa) con casillas para tildar en el súper.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#835500]">picture_as_pdf</span>
                    Formato .PDF Digital
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Archivo vectorizado de rápida lectura para móvil, tablet o impresión física en cocina.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Planificador Semanal PDF */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/70 flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#835500] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#835500] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Formato .PDF Oficial
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-stone-900 group-hover:text-[#835500] transition-colors">
                    Planificador Semanal Gourmet (.PDF)
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Genera y descarga un planificador completo de 7 días integrado con las <strong>recetas más famosas de la semana</strong>. Contiene asignación diaria, valores nutricionales consolidados, lista unificada de compras para el supermercado con casillas de verificación e indicaciones de Meal Prep.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200/50 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-1.5 font-semibold text-[#835500]">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Incluye las {Math.min(7, getFamousWeeklyRecipes().length)} recetas más famosas y votadas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Lista de ingredientes clasificados para compras</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Consejos de Batch Cooking dominical</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => exportWeeklyPlannerPdf()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#835500] hover:bg-[#664200] text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Descargar Planificador Semanal (.PDF)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Paquete de Recetas Más Famosas PDF */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/70 flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#835500] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">menu_book</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#835500] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Cookbook Bundle .PDF
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-stone-900 group-hover:text-[#835500] transition-colors">
                    Paquete: Las Recetas Más Famosas de la Semana (.PDF)
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Descarga un libro digital en PDF con la recopilación completa de las recetas con mayor ranking, likes y calificaciones de la comunidad culinaria. Incluye índice, ingredientes con cantidades exactas, y pasos detallados con consejos del chef.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200/50 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-1.5 font-semibold text-[#835500]">
                    <span className="material-symbols-outlined text-[16px]">stars</span>
                    <span>Selección de recetas con más de 100+ votos en Gusto</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Paso a paso extendido con consejos del chef</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Información nutricional por ración detallada</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => exportRecipePackagePdf()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#E09F3E] hover:bg-[#835500] text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  <span>Descargar Paquete de Recetas Famosas (.PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Preview of the Week's Most Famous Recipes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/70 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#835500] text-[22px]">local_fire_department</span>
                  <span>Recetas Más Famosas de la Semana en este Planificador</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Ordenadas por mayor número de "Me Gusta" y popularidad dentro de la plataforma.
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-full w-fit">
                {getFamousWeeklyRecipes().length} recetas publicadas analizadas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFamousWeeklyRecipes().slice(0, 7).map((recipe, index) => (
                <div
                  key={recipe.id}
                  className="rounded-2xl border border-stone-200/80 p-4 bg-[#FCFAFA] hover:bg-white hover:border-amber-300 transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-[#835500]">
                        <span className="material-symbols-outlined text-[13px]">military_tech</span>
                        Top #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">favorite</span>
                        {recipe.likesCount}
                      </span>
                    </div>

                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-100 relative">
                      <img
                        src={recipe.coverImage}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {recipe.category}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1 group-hover:text-[#835500] transition-colors">
                        {recipe.title}
                      </h5>
                      <p className="text-[11px] text-stone-500">
                        Chef {recipe.authorName} • {recipe.prepTimeMin + recipe.cookTimeMin} min
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(recipe)}
                      className="text-xs font-bold text-[#835500] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      <span>Ver receta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportRecipePdf(recipe)}
                      className="text-[11px] font-semibold text-stone-600 hover:text-[#835500] flex items-center gap-1 cursor-pointer"
                      title="Descargar PDF individual de lectura rápida"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. BUSCAR COCINEROS */}
      {activeTab === 'explorar_cocineros' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/60 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#835500] text-[22px]">search</span>
            <input
              type="text"
              placeholder="Buscar cocineros por nombre, alias (@usuario) o especialidades..."
              value={profileSearchQuery}
              onChange={(e) => setProfileSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-[#1B1C1C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isFollowing = currentUser.followingUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/60 flex flex-col justify-between"
                >
                  <div
                    className={`flex items-center gap-3 mb-3 ${onViewUserProfile ? 'cursor-pointer group' : ''}`}
                    onClick={() => onViewUserProfile && onViewUserProfile(user)}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#E09F3E]/40 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#1B1C1C] truncate group-hover:text-[#835500] transition-colors">
                          {user.name}
                        </h4>
                        <span
                          className="material-symbols-outlined text-[#835500] text-[16px] shrink-0"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#865300] truncate">@{user.username}</p>
                      <span className="text-[10px] text-stone-400 capitalize">{user.role}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-3">{user.bio}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 gap-2">
                    <div className="flex items-center gap-2">
                      {onViewUserProfile && (
                        <button
                          type="button"
                          onClick={() => onViewUserProfile(user)}
                          className="px-3.5 py-1.5 rounded-full bg-[#E09F3E] text-white hover:bg-[#835500] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">account_circle</span>
                          <span>Ver perfil</span>
                        </button>
                      )}

                      {user.id !== currentUser.id ? (
                        <button
                          type="button"
                          onClick={() => followUserToggle(user.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-[#FFDDB9] text-[#2B1700]'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {isFollowing ? 'Siguiendo' : '+ Seguir'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-stone-400">Tu cuenta actual</span>
                      )}
                    </div>

                    {user.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => onOpenReport('profile', user.id, user.name)}
                        className="text-[11px] text-[#AB3333] hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Denunciar perfil"
                      >
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        <span className="hidden sm:inline">Denunciar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Curated Collection Section (Editorial Split Banner) */}
      <div className="bg-[#F6F3F2] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-stone-200/60">
        <div className="flex flex-col gap-2 max-w-xl">
          <span className="text-xs text-[#865300] font-bold uppercase tracking-widest">
            Colección Destacada
          </span>
          <h3 className="font-display text-2xl font-bold text-[#1B1C1C]">
            "Secretos del Mediterráneo Cálido"
          </h3>
          <p className="text-xs sm:text-sm text-[#514536] leading-relaxed">
            Un compendio gastronómico que reúne técnicas explicadas paso a paso con video-clases y selección de maridajes.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onCreateRecipe}
              className="bg-[#E09F3E] hover:bg-[#835500] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm transition-all"
            >
              Explorar Colección
            </button>
            <span className="text-xs text-[#514536]">Acceso libre para la comunidad</span>
          </div>
        </div>

        <div className="relative w-full md:w-72 h-44 rounded-2xl overflow-hidden shadow-md shrink-0 bg-stone-200">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjtg8uxMpkO_4IfikjzGYpBgXERFojTBDeCVyChAmNyZJ61u9wpysjeWZGTayajB-8aINSkZyfB0XaoVM_id2TcYlaP5EDloOHLWsLe1VGVrJXjUtAQPZB2YaHPkovvE83oj6SG8HXITieYiWg-Ij4VlD8b7R6WdlYI4XE0STDnmZCnKEAnZ3sjIQqQBtDQYLQ_m5DUEE08ljhqpmRHEs705ik9TPFPLC_ZbuXlU0q42K_hYU7tQ"
            alt="Ingredientes mediterráneos"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#835500]/20 mix-blend-multiply"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md text-[#835500] flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[28px] pl-0.5">play_arrow</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteRecipeModal
        isOpen={!!recipeToDelete}
        recipeTitle={recipeToDelete?.title || ''}
        onConfirm={() => {
          if (recipeToDelete) {
            deleteRecipe(recipeToDelete.id);
            setRecipeToDelete(null);
          }
        }}
        onCancel={() => setRecipeToDelete(null)}
      />
    </div>
  );
};
