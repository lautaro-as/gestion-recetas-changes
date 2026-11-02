import React from 'react';
import { UserProfile, Recipe } from '../types';
import { useApp } from '../context/AppContext';
import { RecipeCard } from './RecipeCard';
import {
  X,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Flag,
  MapPin,
  Sparkles,
  BookOpen,
  Users,
  Award,
  ShieldCheck,
  ArrowRight,
  Heart
} from 'lucide-react';

interface PublicProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onOpenRecipeDetail: (recipe: Recipe) => void;
  onOpenReport: (type: 'recipe' | 'profile', id: string, title: string) => void;
  onSwitchUser?: (userId: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  user: initialUser,
  onClose,
  onOpenRecipeDetail,
  onOpenReport,
  onSwitchUser,
}) => {
  const { currentUser, allUsers, recipes, followUserToggle } = useApp();

  if (!initialUser) return null;

  // Live user reference from context so follower/following counts react instantly
  const user = allUsers.find((u) => u.id === initialUser.id) || initialUser;

  const isCurrentUser = user.id === currentUser.id;
  const isFollowing = (currentUser.followingUserIds || []).includes(user.id);

  // User's published recipes
  const userRecipes = recipes.filter(
    (r) => r.authorId === user.id && r.status === 'published'
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'editor':
        return { label: 'Editor Certificado', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'premium':
        return { label: 'Chef Premium', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      default:
        return { label: 'Cocinero Aficionado', bg: 'bg-stone-100 text-stone-700 border-stone-300' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto cursor-default animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#835500] text-[20px]">
              account_circle
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Perfil Público de Cocinero
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-semibold text-[#865300]">@{user.username}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentUser && (
              <button
                type="button"
                onClick={() => onOpenReport('profile', user.id, user.name)}
                title="Denunciar este perfil"
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Hero Banner & Profile Header */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2B1700] via-[#5A3900] to-[#835500] p-6 sm:p-8 text-white shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white/90 shadow-xl"
                />
                <span
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#E09F3E] text-white flex items-center justify-center shadow-md border-2 border-white"
                  title="Chef Verificado"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
              </div>

              {/* User Identity Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {user.name}
                  </h2>
                  <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-amber-200 font-semibold">
                  <span>@{user.username}</span>
                  {user.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-200">
                        <MapPin className="w-3.5 h-3.5" />
                        {user.location}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl">
                  {user.bio || 'Apasionado del arte culinario y miembro activo de la comunidad Gusto.'}
                </p>

                {/* Specialties tags */}
                {user.specialties && user.specialties.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    {user.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 backdrop-blur-md text-white border border-white/20"
                      >
                        ✦ {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions & Follow */}
              <div className="shrink-0 flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
                {!isCurrentUser ? (
                  <button
                    type="button"
                    onClick={() => followUserToggle(user.id)}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isFollowing
                        ? 'bg-white text-[#5A3900] hover:bg-stone-100'
                        : 'bg-[#E09F3E] text-white hover:bg-[#835500]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Siguiendo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Seguir a este Chef</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="px-4 py-2 rounded-full bg-white/20 text-white text-xs font-bold text-center">
                    Tu perfil actual
                  </span>
                )}

                {onSwitchUser && !isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchUser(user.id);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">switch_account</span>
                    <span>Probar como este usuario</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Matrix Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="text-center p-2">
              <span className="block text-2xl font-bold text-stone-900 leading-tight">
                {user.followersCount ?? 0}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Seguidores
              </span>
            </div>

            <div className="text-center p-2">
              <span className="block text-2xl font-bold text-stone-900 leading-tight">
                {user.followingUserIds?.length ?? 0}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Seguidos
              </span>
            </div>

            <div className="text-center p-2">
              <span className="block text-2xl font-bold text-stone-900 leading-tight">
                {userRecipes.length}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Recetas Publicadas
              </span>
            </div>

            <div className="text-center p-2">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-stone-900 leading-tight">4.9</span>
                <span
                  className="material-symbols-outlined text-[#E09F3E] text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Valoración Media
              </span>
            </div>
          </div>

          {/* Dietary preferences if any */}
          {user.dietaryPreferences && user.dietaryPreferences.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#835500] text-[22px]">
                local_dining
              </span>
              <div className="flex-1">
                <span className="text-xs font-bold text-[#835500] uppercase tracking-wider block">
                  Preferencias Dietéticas del Autor:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.dietaryPreferences.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#714500] border border-amber-200 shadow-2xs uppercase"
                    >
                      #{d.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User's Created Recipes Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#835500]" />
                  Recetas de {user.name} ({userRecipes.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Creaciones publicadas por @{user.username} para toda la comunidad
                </p>
              </div>
            </div>

            {userRecipes.length === 0 ? (
              <div className="bg-stone-50 rounded-2xl p-8 text-center border border-stone-200/80 space-y-2">
                <span className="material-symbols-outlined text-[36px] text-stone-400 block mx-auto">
                  soup_kitchen
                </span>
                <p className="font-semibold text-stone-700 text-sm">
                  Este cocinero aún no ha publicado recetas en su catálogo.
                </p>
                <p className="text-xs text-stone-400">
                  Vuelve pronto o sigue a este autor para recibir notificaciones cuando lance nuevos platillos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onOpenDetail={(r) => {
                      onClose();
                      onOpenRecipeDetail(r);
                    }}
                    onOpenReport={(r) => onOpenReport('recipe', r.id, r.title)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
