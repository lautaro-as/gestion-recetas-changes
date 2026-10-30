import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile, UserRole } from '../types';
import {
  Users,
  X,
  CheckCircle,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  Award,
  Crown,
  ChefHat,
  Search
} from 'lucide-react';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const {
    currentUser,
    allUsers,
    selectSpecificUser,
    logoutUser,
    isAuthenticated,
    showToast,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200', icon: Shield };
      case 'editor':
        return { label: 'Editor', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Award };
      case 'premium':
        return { label: 'Premium', color: 'bg-amber-100 text-amber-900 border-amber-200', icon: Crown };
      default:
        return { label: 'Usuario', color: 'bg-stone-100 text-stone-700 border-stone-200', icon: ChefHat };
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSelectAccount = (user: UserProfile) => {
    if (user.id === currentUser.id && isAuthenticated) {
      onClose();
      return;
    }
    selectSpecificUser(user.id);
    showToast(`Has cambiado a la cuenta de ${user.name} (${user.role.toUpperCase()})`);
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    showToast('Sesión cerrada correctamente.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#E09F3E] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Cambiar de Cuenta</h3>
              <p className="text-xs text-white/85">
                Selecciona un perfil existente o inicia sesión con otra cuenta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            type="button"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card */}
        {isAuthenticated && (
          <div className="px-5 pt-4 pb-2 bg-amber-50/60 border-b border-amber-100/70 shrink-0">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Cuenta Activa Actualmente
            </div>
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-amber-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      @{currentUser.username}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 truncate">{currentUser.email}</div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                {(() => {
                  const b = getRoleBadge(currentUser.role);
                  const Icon = b.icon;
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${b.color}`}>
                      <Icon className="w-3 h-3" />
                      {b.label}
                    </span>
                  );
                })()}
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Sesión activa
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search input if multiple users */}
        <div className="p-4 border-b border-stone-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, @usuario o rol..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1 mb-2">
            Perfiles Disponibles ({filteredUsers.length}):
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              No se encontraron cuentas con el filtro ingresado.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrent = isAuthenticated && user.id === currentUser.id;
              const badge = getRoleBadge(user.role);
              const RoleIcon = badge.icon;

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectAccount(user)}
                  type="button"
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-amber-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          @{user.username}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        {user.specialties?.length ? user.specialties.join(' • ') : user.email}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {badge.label}
                    </span>

                    {isCurrent ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        Actual
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-600 hover:text-white px-2.5 py-1 rounded-xl transition-colors">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-stone-600" />
              <span>Iniciar con otra cuenta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-stone-600" />
              <span>Registrar nueva</span>
            </button>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
