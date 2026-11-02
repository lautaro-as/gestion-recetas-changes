import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { SwitchAccountModal } from './SwitchAccountModal';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenCreateRecipe: () => void;
  onOpenCart: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectRecipeById?: (recipeId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenCreateRecipe,
  onOpenCart,
  onOpenAuth,
  onSelectRecipeById,
}) => {
  const {
    currentUser,
    isAuthenticated,
    allUsers,
    selectSpecificUser,
    logoutUser,
    comparingRecipeIds,
    cart,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    promptAuthRequired,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchAccountModalOpen, setIsSwitchAccountModalOpen] = useState(false);

  // Filter notifications strictly for the active user session (RF-28)
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);
  const unreadNotifs = userNotifications.filter((n) => !n.read);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-100 text-red-800' };
      case 'editor':
        return { label: 'Editor', color: 'bg-purple-100 text-purple-800' };
      case 'premium':
        return { label: 'Premium', color: 'bg-amber-100 text-amber-900' };
      default:
        return { label: 'Usuario', color: 'bg-stone-100 text-stone-700' };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 left-0 w-full z-50">
      <nav className="bg-[#E09F3E] text-white shadow-[0_4px_20px_-2px_rgba(197,130,38,0.25)]">
        <div className="h-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Mobile Hamburger Trigger */}
          <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/20 text-white cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              type="button"
            >
              <span className="material-symbols-outlined text-[28px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            <button
              onClick={() => setActiveView('explorar')}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
              type="button"
            >
              <span
                className="material-symbols-outlined text-[28px] text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                room_service
              </span>
              <span className="font-display text-2xl font-bold tracking-tight text-white leading-none">
                Gusto
              </span>
            </button>

            {/* Desktop Navigation Links (with geometric background shape indicating active section) */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => setActiveView('explorar')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeView === 'explorar'
                    ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-white hover:bg-white/20'
                }`}
                type="button"
              >
                Explorar
              </button>

              <button
                onClick={() => setActiveView('destacadas')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeView === 'destacadas'
                    ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-white hover:bg-white/20'
                }`}
                type="button"
              >
                Destacadas
              </button>

              <button
                onClick={() => setActiveView('foro')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeView === 'foro'
                    ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-white hover:bg-white/20'
                }`}
                type="button"
              >
                Foro y comunidad
              </button>

              <button
                onClick={() => setActiveView('comparar')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'comparar'
                    ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-white hover:bg-white/20'
                }`}
                type="button"
              >
                <span>Comparar</span>
                {comparingRecipeIds.length > 0 && (
                  <span
                    className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      activeView === 'comparar'
                        ? 'bg-[#E09F3E] text-white'
                        : 'bg-white text-[#5A3900]'
                    }`}
                  >
                    {comparingRecipeIds.length}
                  </span>
                )}
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => setActiveView('perfil')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    activeView === 'perfil'
                      ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                      : 'text-white hover:bg-white/20'
                  }`}
                  type="button"
                >
                  Mi perfil
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setActiveView('moderacion')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    activeView === 'moderacion'
                      ? 'bg-white text-[#5A3900] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                      : 'text-white hover:bg-white/20'
                  }`}
                  type="button"
                >
                  Moderación
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button (RF-21) */}
            <button
              onClick={() => {
                setActiveView('explorar');
                setTimeout(() => {
                  const input = document.getElementById('recipe-search');
                  if (input) input.focus();
                }, 50);
              }}
              aria-label="Buscar recetas o perfiles"
              title="Buscar recetas o perfiles de usuario"
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>

            {/* Nueva Receta Button (Prompt login if guest) */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuth('login');
                } else {
                  onOpenCreateRecipe();
                }
              }}
              className="hidden lg:inline-flex items-center gap-1.5 bg-white text-[#835500] font-semibold text-sm px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-[#FFF8F0] hover:text-[#5A3900] transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nueva receta</span>
            </button>

            {/* Shopping Cart Button (Prompt login if guest) */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuth('login');
                } else {
                  onOpenCart();
                }
              }}
              aria-label="Carrito de compras"
              title={isAuthenticated ? "Carrito de compras" : "Inicia sesión para ver tu carrito de compras"}
              className="hidden lg:flex relative p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {isAuthenticated && cart.length > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-white text-[#835500] text-[11px] font-bold rounded-full shadow-sm">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onOpenAuth('login');
                    promptAuthRequired('Inicia sesión para revisar tus notificaciones.');
                    return;
                  }
                  setShowNotifMenu(!showNotifMenu);
                  setShowRoleMenu(false);
                }}
                aria-label="Notificaciones"
                title={isAuthenticated ? "Notificaciones" : "Inicia sesión para ver tus notificaciones"}
                className="relative p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF8A84] rounded-full ring-2 ring-[#E09F3E]"></span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 py-3 z-50 text-[#333333]">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                      Notificaciones
                    </span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-[#835500] hover:underline font-semibold"
                        type="button"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400 space-y-1">
                        <span className="material-symbols-outlined text-[28px] text-stone-300 block mx-auto">
                          notifications_none
                        </span>
                        <p className="font-semibold text-stone-600">No tienes notificaciones por ahora.</p>
                        <p className="text-[11px] text-stone-400">
                          Recibirás alertas cuando alguien te siga, comente tus recetas o se publique una receta programada.
                        </p>
                      </div>
                    ) : (
                      userNotifications.map((notif) => {
                        const getNotifIconConfig = (type: typeof notif.type) => {
                          switch (type) {
                            case 'follow':
                              return { icon: 'person_add', bg: 'bg-amber-600' };
                            case 'comment':
                              return { icon: 'chat_bubble', bg: 'bg-sky-600' };
                            case 'scheduled_published':
                              return { icon: 'schedule_send', bg: 'bg-emerald-600' };
                            case 'like':
                              return { icon: 'favorite', bg: 'bg-rose-500' };
                            case 'moderation':
                              return { icon: 'security', bg: 'bg-purple-600' };
                            default:
                              return { icon: 'notifications', bg: 'bg-[#835500]' };
                          }
                        };
                        const iconCfg = getNotifIconConfig(notif.type);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              if (notif.linkTarget && onSelectRecipeById) {
                                onSelectRecipeById(notif.linkTarget);
                                setShowNotifMenu(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-[#F6F3F2] cursor-pointer transition-colors flex items-start gap-3 ${
                              !notif.read ? 'bg-[#FFDDB9]/25 font-medium' : ''
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${iconCfg.bg}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {iconCfg.icon}
                              </span>
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-bold text-stone-900 truncate">
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                                  {new Date(notif.createdAt).toLocaleDateString('es-ES', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-snug break-words">
                                {notif.message}
                              </p>
                              {notif.linkTarget && (
                                <span className="text-[10px] text-[#835500] font-semibold underline mt-1 inline-block">
                                  Ver receta →
                                </span>
                              )}
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-[#E09F3E] shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Account Menu Trigger (Hidden on mobile header, accessed via hamburger menu) */}
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="hidden lg:inline-flex items-center gap-1.5 bg-white text-[#835500] hover:bg-[#FFF8F0] font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span>Iniciar sesión</span>
              </button>
            ) : (
              <div className="hidden lg:block relative">
                <div
                  onClick={() => {
                    setShowRoleMenu(!showRoleMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-1 pl-1 cursor-pointer group"
                  title="Opciones de cuenta"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover shadow-[0_0_0_2px_rgba(255,255,255,0.6)]"
                  />
                  <span className="material-symbols-outlined text-white text-[20px] transition-transform group-hover:translate-y-0.5">
                    keyboard_arrow_down
                  </span>
                </div>

                {/* User Account Menu Popover */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-stone-200 p-3 z-50 text-[#333333] space-y-2">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <div className="font-bold text-sm text-stone-900">{currentUser.name}</div>
                      <div className="text-xs text-stone-500 truncate">{currentUser.email}</div>
                      <div className="text-[11px] font-medium text-[#835500] mt-1 flex items-center justify-between">
                        <span>Rol: <strong>{currentUser.role.toUpperCase()}</strong></span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Primary actions */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('perfil');
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-semibold hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[#835500] text-[18px]">
                          person
                        </span>
                        <span>Ver mi perfil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSwitchAccountModalOpen(true);
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-semibold hover:bg-amber-50 text-stone-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[#835500] text-[18px]">
                          switch_account
                        </span>
                        <span>Cambiar de cuenta (ventana)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          logoutUser();
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-rose-600 text-[18px]">
                          logout
                        </span>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>

                    {/* Quick test seeder accounts */}
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          Cuentas Rápidas:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSwitchAccountModalOpen(true);
                            setShowRoleMenu(false);
                          }}
                          className="text-[10px] text-amber-700 hover:underline font-semibold"
                        >
                          Ver todas
                        </button>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {allUsers.slice(0, 5).map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              selectSpecificUser(u.id);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              u.id === currentUser.id
                                ? 'bg-[#FFDDB9]/50 font-bold text-[#5A3900]'
                                : 'hover:bg-stone-50 text-stone-700'
                            }`}
                            type="button"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                              <div className="truncate text-[11px]">{u.name}</div>
                            </div>
                            <span className="text-[9px] text-stone-400 uppercase shrink-0">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Mobile Hamburger Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-[85%] max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col h-full z-10 text-stone-800 animate-in slide-in-from-left duration-200">
              {/* Drawer Header */}
              <div className="bg-[#E09F3E] text-white p-4 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className="material-symbols-outlined text-[28px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    room_service
                  </span>
                  <div>
                    <span className="font-display text-xl font-bold tracking-tight text-white leading-none block">
                      Gusto
                    </span>
                    <span className="text-[10px] text-white/85">
                      Gestión de Recetas y Comunidad
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  type="button"
                  aria-label="Cerrar menú"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Body: All Sections */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Nueva Receta Primary Button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCreateRecipe();
                  }}
                  className="w-full bg-[#E09F3E] text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-sm hover:bg-[#c58226] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>Nueva Receta</span>
                </button>

                {/* Navigation Sections */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 pb-1">
                    Secciones de la Página
                  </div>

                  {/* Explorar */}
                  <button
                    onClick={() => {
                      setActiveView('explorar');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                      activeView === 'explorar'
                        ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#835500] text-[22px]">
                        explore
                      </span>
                      <span>Explorar</span>
                    </div>
                    {activeView === 'explorar' && (
                      <span className="w-2 h-2 rounded-full bg-[#E09F3E]" />
                    )}
                  </button>

                  {/* Destacadas */}
                  <button
                    onClick={() => {
                      setActiveView('destacadas');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                      activeView === 'destacadas'
                        ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#835500] text-[22px]">
                        auto_awesome
                      </span>
                      <span>Destacadas</span>
                    </div>
                    {activeView === 'destacadas' && (
                      <span className="w-2 h-2 rounded-full bg-[#E09F3E]" />
                    )}
                  </button>

                  {/* Foro */}
                  <button
                    onClick={() => {
                      setActiveView('foro');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                      activeView === 'foro'
                        ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#835500] text-[22px]">
                        forum
                      </span>
                      <span>Foro y Comunidad</span>
                    </div>
                    {activeView === 'foro' && (
                      <span className="w-2 h-2 rounded-full bg-[#E09F3E]" />
                    )}
                  </button>

                  {/* Comparar */}
                  <button
                    onClick={() => {
                      setActiveView('comparar');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                      activeView === 'comparar'
                        ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#835500] text-[22px]">
                        compare_arrows
                      </span>
                      <span>Comparar Recetas</span>
                    </div>
                    {comparingRecipeIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E09F3E] text-white">
                        {comparingRecipeIds.length}
                      </span>
                    )}
                  </button>

                  {/* Mi Perfil (Solo usuarios autenticados) */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setActiveView('perfil');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                        activeView === 'perfil'
                          ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#835500] text-[22px]">
                          person
                        </span>
                        <span>Mi Perfil</span>
                      </div>
                      {activeView === 'perfil' && (
                        <span className="w-2 h-2 rounded-full bg-[#E09F3E]" />
                      )}
                    </button>
                  )}

                  {/* Moderación solo para Administradores */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveView('moderacion');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold transition-all cursor-pointer ${
                        activeView === 'moderacion'
                          ? 'bg-[#FFDDB9]/40 text-[#5A3900] font-bold border border-[#E09F3E]/40'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-purple-700 text-[22px]">
                          admin_panel_settings
                        </span>
                        <span>Moderación</span>
                      </div>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                        Admin
                      </span>
                    </button>
                  )}
                </div>

                {/* Quick actions: Shopping Cart */}
                <div className="space-y-1 pt-2 border-t border-stone-100">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 pb-1">
                    Herramientas
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (!isAuthenticated) {
                        onOpenAuth('login');
                      } else {
                        onOpenCart();
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#835500] text-[22px]">
                        shopping_cart
                      </span>
                      <span>Carrito de Ingredientes</span>
                    </div>
                    {isAuthenticated && cart.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E09F3E] text-white">
                        {cart.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Drawer Bottom - User Section */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 shrink-0">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="text-xs text-stone-600 mb-1">
                      Inicia sesión para gestionar recetas, foros y listas de compras.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="w-full bg-[#E09F3E] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:bg-[#c58226] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Iniciar Sesión</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth('register');
                      }}
                      className="w-full bg-white text-stone-700 border border-stone-300 font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Registrarse</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* User profile row */}
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#E09F3E]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-stone-900 truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">
                          @{currentUser.username}
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* User Actions: Cambiar de cuenta (ventana aparte) & Cerrar sesión */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsSwitchAccountModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          switch_account
                        </span>
                        <span>Cambiar de cuenta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          logoutUser();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-rose-600 text-[18px]">
                          logout
                        </span>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Ventana Aparte: Modal de Cambio de Cuenta */}
      <SwitchAccountModal
        isOpen={isSwitchAccountModalOpen}
        onClose={() => setIsSwitchAccountModalOpen(false)}
        onOpenAuth={onOpenAuth}
      />
    </header>
  );
};
