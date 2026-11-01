import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { X, KeyRound, Mail, User, ShieldCheck, Sparkles, ChefHat, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'recovery';
}

export const AuthModals: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { allUsers, currentUser, selectSpecificUser, loginUser, loginWithGoogle, registerUser, requestPasswordReset, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('••••••••');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('usuario');
  
  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser(loginEmail)) {
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) return;
    registerUser(regName, regEmail, regRole);
    onClose();
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    const res = requestPasswordReset(recoveryEmail);
    if (res.success) {
      setRecoverySent(true);
      showToast(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ChefHat className="w-6 h-6 text-amber-200" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {mode === 'login' && 'Iniciar Sesión en Gusto'}
                {mode === 'register' && 'Crear Nueva Cuenta'}
                {mode === 'recovery' && 'Recuperar Contraseña'}
              </h3>
              <p className="text-xs text-amber-100/90">
                Sistema de Gestión & Comunidad Culinaria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Switcher */}
        <div className="bg-amber-50/80 px-6 py-3 border-b border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Cambio Rápido de Rol de Prueba:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {allUsers.slice(0, 4).map((u) => {
              const isActive = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    selectSpecificUser(u.id);
                    onClose();
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-stone-700 border-amber-200/80 hover:bg-amber-100/60'
                  }`}
                >
                  <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold truncate">{u.name}</div>
                    <div className={`text-[10px] capitalize ${isActive ? 'text-amber-100' : 'text-stone-500'}`}>
                      {u.role === 'admin' ? '🛡️ Administrador' : u.role === 'editor' ? '🖋️ Editor' : u.role === 'premium' ? '⭐ Premium' : '👨‍🍳 Estándar'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="ej. mateo.rossi@gusto.app"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                Ingresar a Gusto
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2 text-stone-400 font-medium">o con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const ok = await loginWithGoogle();
                  if (ok) onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="text-center text-xs text-stone-600 pt-2 border-t border-stone-100">
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-amber-700 hover:underline"
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sofía Martínez"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="sofia@ejemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo de Plan / Rol:</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="usuario">👨‍🍳 Usuario Estándar (Gratis)</option>
                  <option value="premium">⭐ Usuario Premium (Videos, Exportación avanzada JSON/PDF)</option>
                  <option value="editor">🖋️ Usuario Editor (Curación, fijar y destacar recetas)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition-colors mt-2"
              >
                Completar Registro
              </button>

              <div className="text-center text-xs text-stone-600 pt-2 border-t border-stone-100">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-amber-700 hover:underline"
                >
                  Inicia sesión aquí
                </button>
              </div>
            </form>
          )}

          {mode === 'recovery' && (
            <div className="space-y-4">
              {recoverySent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-stone-800 text-base">¡Correo de recuperación enviado!</h4>
                  <p className="text-xs text-stone-600 leading-relaxed px-4">
                    Hemos enviado un enlace temporal seguro a <strong className="text-stone-900">{recoveryEmail}</strong> para que puedas restablecer tu contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverySent(false);
                      setMode('login');
                    }}
                    className="mt-3 px-5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-colors"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace temporal para blanquear tu clave de acceso de manera segura.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="tu-correo@ejemplo.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Enviar Enlace de Recuperación
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-stone-500 hover:text-stone-800 underline"
                    >
                      Cancelar y volver a login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
