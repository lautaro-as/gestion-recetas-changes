import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChefHat,
  Heart,
  BookOpen,
  Calendar,
  Compass
} from 'lucide-react';

interface AuthLandingViewProps {
  initialTab?: 'login' | 'register';
  onBrowseAsGuest?: () => void;
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({
  initialTab = 'login',
  onBrowseAsGuest,
}) => {
  const {
    allUsers,
    loginUserWithPassword,
    quickLoginAsUser,
    registerNewUser,
    requestPasswordReset,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember30Days, setRemember30Days] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGender, setRegGender] = useState('Femenino');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Password Recovery Modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Por favor ingresa tu correo electrónico y tu contraseña.');
      return;
    }

    const result = loginUserWithPassword(loginEmail, loginPassword, remember30Days);
    if (!result.success) {
      setLoginError(result.message);
    }
  };

  // Handle Quick Login (Seeder Accounts)
  const handleQuickLogin = (userId: string) => {
    quickLoginAsUser(userId, remember30Days);
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden. Por favor verifica ambos campos.');
      return;
    }

    const result = registerNewUser({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      gender: regGender,
      password: regPassword,
    });

    if (!result.success) {
      setRegError(result.message);
    }
  };

  // Handle Recovery Submit
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;
    const res = requestPasswordReset(recoveryEmail);
    setRecoveryMessage(res.message);
    showToast(res.message);
  };

  // Preloaded seeder users
  const seederUsers = allUsers.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between text-[#1B1C1C]">
      {/* Top Header / Branding */}
      <header className="w-full bg-[#E09F3E] text-white border-b border-[#C58529] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                room_service
              </span>
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight leading-none block">
                Gusto
              </span>
              <span className="text-[11px] text-amber-100 font-medium tracking-wide uppercase">
                Sistema Integral de Gestión de Recetas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBrowseAsGuest && (
              <button
                type="button"
                onClick={onBrowseAsGuest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explorar como invitado</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Tabs (Iniciar Sesión vs Registrarse) */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="bg-stone-200/80 p-1.5 rounded-full flex items-center justify-center shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-3 px-6 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#835500] shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
              }}
              className={`flex-1 py-3 px-6 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-[#835500] shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#E09F3E]" />
              <span>Crear Cuenta Nueva</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INICIO DE SESIÓN */}
        {activeTab === 'login' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Left: Credential Login Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#835500] uppercase tracking-wider mb-1">
                  <ChefHat className="w-4 h-4" />
                  Acceso a tu Espacio Gourmet
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
                  Iniciar Sesión
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                  Ingresa tu correo y contraseña para acceder a tus recetas, lista de compras y foros comunitarios.
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@gusto.app"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-xs text-[#835500] hover:underline font-semibold cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox: Recordar por 30 días */}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-stone-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember30Days}
                      onChange={(e) => setRemember30Days(e.target.checked)}
                      className="w-4 h-4 rounded-md text-[#835500] focus:ring-[#E09F3E] border-stone-300 accent-[#835500] cursor-pointer"
                    />
                    <span>Recordar la cuenta por 30 días en este dispositivo</span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#835500] to-[#E09F3E] hover:from-[#5A3900] hover:to-[#C58529] text-white font-bold text-sm shadow-[0_4px_16px_rgba(131,85,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Bottom Switch Link */}
              <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
                <span>¿Todavía no tienes cuenta en Gusto? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegError(null);
                  }}
                  className="font-bold text-[#835500] hover:underline cursor-pointer ml-1"
                >
                  Regístrate gratis aquí
                </button>
              </div>
            </div>

            {/* Right: Cuentas precargadas con Seeder (Al Costado) */}
            <div className="lg:col-span-5 bg-[#FFF8F0] rounded-3xl p-6 sm:p-8 border border-[#E09F3E]/30 shadow-md">
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E09F3E]/15 text-[#835500] text-xs font-bold uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#E09F3E]" />
                  Acceso Rápido con Seeder
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-display">
                  Cuentas Predeterminadas
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Haz clic en cualquiera de estos perfiles precargados para ingresar instantáneamente <strong>sin necesidad de contraseña</strong>:
                </p>
              </div>

              <div className="space-y-3">
                {seederUsers.map((user) => {
                  const roleBadge = (() => {
                    switch (user.role) {
                      case 'admin':
                        return { label: 'Administrador', color: 'bg-rose-100 text-rose-800 border-rose-200' };
                      case 'editor':
                        return { label: 'Editora Gastronómica', color: 'bg-purple-100 text-purple-800 border-purple-200' };
                      case 'premium':
                        return { label: 'Chef Premium', color: 'bg-amber-100 text-amber-900 border-amber-200' };
                      default:
                        return { label: 'Usuario Estándar', color: 'bg-stone-100 text-stone-800 border-stone-200' };
                    }
                  })();

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user.id)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FFF2E0] border border-stone-200/80 hover:border-[#E09F3E] transition-all shadow-xs hover:shadow-md flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-[#E09F3E]/30 group-hover:ring-[#835500]"
                        />
                        <div className="truncate">
                          <div className="font-bold text-sm text-stone-900 group-hover:text-[#835500] truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-stone-400 truncate">
                            {user.email}
                          </div>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 p-2 rounded-xl bg-stone-50 group-hover:bg-[#835500] text-stone-400 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 p-3 rounded-2xl bg-white/70 border border-[#E09F3E]/20 text-[11px] text-stone-500 leading-relaxed">
                💡 <em>Nota técnica:</em> Si deseas iniciar sesión mediante formulario con alguna de estas cuentas precargadas, su contraseña por defecto es <code className="font-bold text-stone-700">password123</code>.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRO DE NUEVOS USUARIOS */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Main Register Form */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#835500] uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-[#E09F3E]" />
                  Comunidad Culinaria Gusto
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
                  Registro de Nuevos Usuarios
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                  Crea tu cuenta para publicar recetas caseras, guardar favoritos, comentar y unirte a los debates del foro.
                </p>
              </div>

              {/* Informative note regarding default role 'usuario' */}
              <div className="mb-6 p-4 rounded-2xl bg-[#FFF8F0] border border-[#E09F3E]/40 text-xs sm:text-sm text-stone-700 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#835500] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-stone-900">Asignación de rol por defecto:</strong> El rol que se te asignará al registrarte es de <strong>Usuario</strong>. Posteriormente, un moderador o administrador podrá asignarte otros roles (Chef Premium, Editor o Administrador) desde el panel de moderación.
                </div>
              </div>

              {regError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      Nombre *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="ej. Martina"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      Apellido *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="ej. Fernández"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="martina.fernandez@correo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Género */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Género *
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all cursor-pointer font-medium text-stone-800"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="No binario">No binario</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Contraseña y Validación de Contraseña */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      Validar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Repite tu contraseña"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-11 py-2.5 rounded-2xl border text-sm focus:bg-white focus:ring-2 focus:outline-hidden transition-all ${
                          regConfirmPassword && regPassword !== regConfirmPassword
                            ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                            : 'border-stone-300 bg-stone-50/50 focus:ring-[#E09F3E]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {regConfirmPassword && regPassword === regConfirmPassword && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Las contraseñas coinciden correctamente.</span>
                  </div>
                )}

                {/* Submit Register Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#835500] to-[#E09F3E] hover:from-[#5A3900] hover:to-[#C58529] text-white font-bold text-sm shadow-[0_4px_16px_rgba(131,85,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Crear Cuenta y Comenzar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Bottom Switch Link */}
              <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
                <span>¿Ya tienes una cuenta registrada? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                  }}
                  className="font-bold text-[#835500] hover:underline cursor-pointer ml-1"
                >
                  Inicia sesión aquí
                </button>
              </div>
            </div>

            {/* Right: Beneficios de la Comunidad Gusto */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#FFF8F0] rounded-3xl p-6 border border-[#E09F3E]/30 shadow-sm">
                <h3 className="font-bold text-stone-900 text-base font-display mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E09F3E]" />
                  ¿Por qué registrarte en Gusto?
                </h3>
                <ul className="space-y-3 text-xs text-stone-600 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E09F3E]/20 text-[#835500] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span>
                      <strong>Crea y publica</strong> tus propias recetas con fotos de autor, ingredientes y tiempos exactos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E09F3E]/20 text-[#835500] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span>
                      <strong>Lista inteligente de compras:</strong> Organiza ingredientes faltantes y costos estimados.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E09F3E]/20 text-[#835500] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span>
                      <strong>Debates en el foro:</strong> Comparte técnicas culinarias, responde dudas y valora recetas.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E09F3E]/20 text-[#835500] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span>
                      <strong>Progresión de roles:</strong> Demuestra tu talento en la cocina para que un moderador ascienda tu cuenta a <em>Chef Premium</em> o <em>Editora Gastronómica</em>.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200">
            <h3 className="text-xl font-bold font-display text-stone-900 mb-2">
              Recuperar Contraseña
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace seguro para restablecerla.
            </p>

            {recoveryMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm mb-4">
                {recoveryMessage}
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@ejemplo.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecoveryModal(false);
                      setRecoveryMessage(null);
                    }}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#835500] hover:bg-[#5a3900] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enviar Enlace
                  </button>
                </div>
              </form>
            )}

            {recoveryMessage && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryMessage(null);
                  }}
                  className="px-5 py-2 bg-[#835500] text-white rounded-xl text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-stone-100/80 border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Gusto — Plataforma Integral de Gestión y Comunidad Culinaria.</p>
        </div>
      </footer>
    </div>
  );
};
