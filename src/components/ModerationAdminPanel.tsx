import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ModerationReport, Recipe, UserRole } from '../types';
import { ConfirmDeleteRecipeModal } from './ConfirmDeleteRecipeModal';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  UserX,
  Trash2,
  Check,
  ShieldCheck,
  Clock,
  Eye,
  ExternalLink,
  Shield,
  Users,
  UserCheck,
  Search,
  Sparkles
} from 'lucide-react';

interface ModerationAdminPanelProps {
  onOpenDetail?: (recipe: Recipe) => void;
}

export const ModerationAdminPanel: React.FC<ModerationAdminPanelProps> = ({ onOpenDetail }) => {
  const {
    reports,
    resolveReport,
    currentUser,
    allUsers,
    updateUserRole,
    recipes,
    selectSpecificUser,
    showToast,
  } = useApp();

  const [panelTab, setPanelTab] = useState<'reports' | 'users'>('reports');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modal confirmation state for deletion
  const [reportToDelete, setReportToDelete] = useState<ModerationReport | null>(null);

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'editor';

  if (!isStaff) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-bold text-stone-900 text-xl font-display">Acceso Restringido</h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          El panel de moderación está reservado exclusivamente para cuentas de moderación con rol de <strong>Administrador o Editor</strong>.
        </p>
        <p className="text-xs text-stone-400">
          Puedes cambiar rápidamente a una cuenta de moderación autorizada para evaluar los reportes:
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => selectSpecificUser('user-ignacio')}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#835500] hover:bg-[#5a3900] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            Acceder como Ignacio (Admin)
          </button>
          <button
            type="button"
            onClick={() => selectSpecificUser('user-lucia')}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#e09f3e] hover:bg-[#c58529] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            Acceder como Lucía (Editora)
          </button>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'pending') return r.status === 'pending';
    if (filterStatus === 'resolved') return r.status !== 'pending';
    return true;
  });

  const getReasonBadge = (reason: ModerationReport['reason']) => {
    switch (reason) {
      case 'inapropiado': return { label: 'Inapropiado', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'spam': return { label: 'Spam / Publicidad', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'plagio': return { label: 'Plagio / Copia', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'peligro_alimentario': return { label: 'Peligro Alimentario', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'acoso': return { label: 'Acoso', color: 'bg-red-100 text-red-800 border-red-200' };
      default: return { label: 'Otro', color: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  const handleReviewRecipe = (recipeId: string) => {
    const targetRecipe = recipes.find((r) => r.id === recipeId);
    if (targetRecipe && onOpenDetail) {
      onOpenDetail(targetRecipe);
    } else {
      showToast('La receta solicitada no se encuentra disponible o ya ha sido eliminada.');
    }
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    resolveReport(reportToDelete.id, 'removed');
    setReportToDelete(null);
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const resolvedCount = reports.filter((r) => r.status !== 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2B1700] via-[#5A3900] to-[#835500] text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-bold uppercase mb-2 border border-white/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Centro de Seguridad & Moderación de Contenido
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-display">
            Panel de Moderación
          </h2>
          <p className="text-amber-100/90 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Auditoría de denuncias, revisión minuciosa de recetas reportadas, gestión de políticas comunitarias y eliminación definitiva de contenido infractor.
          </p>
        </div>

        <div className="px-4 py-2.5 bg-black/30 rounded-2xl border border-white/10 text-xs text-amber-100 backdrop-blur-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-300" />
          <span>Moderador activo: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
        </div>
      </div>

      {/* Moderation Section Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setPanelTab('reports')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            panelTab === 'reports'
              ? 'bg-[#835500] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Denuncias y Reportes ({pendingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setPanelTab('users')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            panelTab === 'users'
              ? 'bg-[#835500] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios y Roles ({allUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {panelTab === 'reports' && (
        <div className="space-y-6">
          {/* Filter status */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 uppercase">Filtrar por estado:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterStatus === 'pending'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('resolved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterStatus === 'resolved'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Resueltos ({resolvedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterStatus === 'all'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Todos ({reports.length})
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-stone-200 text-stone-500 text-xs sm:text-sm shadow-xs">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-stone-800 text-base mb-1">Sin reportes en esta sección</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  No hay denuncias pendientes bajo el filtro seleccionado. El contenido de la plataforma se encuentra moderado y verificado.
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const badge = getReasonBadge(report.reason);
                const isPending = report.status === 'pending';
                const isRecipe = report.targetType === 'recipe';
                const matchingRecipe = isRecipe ? recipes.find((r) => r.id === report.targetId) : null;

                return (
                  <div
                    key={report.id}
                    className={`p-6 rounded-3xl border transition-all ${
                      isPending ? 'bg-white border-red-200 shadow-sm' : 'bg-stone-50/70 border-stone-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 uppercase">
                          {isRecipe ? 'Receta' : 'Perfil de Usuario'}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          Reportado el {new Date(report.createdAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div>
                        {report.status === 'resolved_removed' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            Resuelto: Contenido Eliminado
                          </span>
                        )}
                        {report.status === 'dismissed' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Aprobado / Desestimado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-bold text-stone-900 flex flex-wrap items-center gap-2">
                        <span>Elemento reportado:</span>
                        <span className="text-red-700 font-display text-base">&apos;{report.targetTitleOrName}&apos;</span>
                        {isRecipe && (
                          matchingRecipe ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Receta activa en catálogo
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                              Receta no disponible o eliminada
                            </span>
                          )
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 leading-relaxed">
                        <strong>Motivo del denunciante ({report.reporterName}):</strong> {report.details}
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-4 mt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {isRecipe && matchingRecipe && (
                          <button
                            type="button"
                            onClick={() => handleReviewRecipe(report.targetId)}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            title="Revisar detalles completos de la receta"
                          >
                            <Eye className="w-4 h-4 text-[#835500]" />
                            <span>Revisar Receta</span>
                          </button>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => resolveReport(report.id, 'dismissed')}
                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            title="Aprobar contenido y desestimar la denuncia"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{isRecipe ? 'Aprobar Receta / Desestimar' : 'Aprobar Perfil / Desestimar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isRecipe) {
                                setReportToDelete(report);
                              } else {
                                resolveReport(report.id, 'removed');
                              }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            title={isRecipe ? 'Eliminar receta de forma permanente' : 'Suspender perfil de usuario'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isRecipe ? 'Eliminar Receta' : 'Suspender Perfil'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USER & ROLE MANAGEMENT */}
      {panelTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold font-display text-stone-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#835500]" />
                  <span>Gestión de Roles y Permisos de Usuarios</span>
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                  Los nuevos usuarios se registran por defecto con el rol de <strong>Usuario</strong>. Como moderador o administrador, puedes promover o ajustar el rol de cualquier miembro de la comunidad gastronómica.
                </p>
              </div>

              {/* User search bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar usuario o correo..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden"
                />
              </div>
            </div>

            {/* User List Table / Cards */}
            <div className="divide-y divide-stone-100">
              {allUsers
                .filter((u) => {
                  if (!userSearchQuery.trim()) return true;
                  const q = userSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.username.toLowerCase().includes(q) ||
                    (u.gender && u.gender.toLowerCase().includes(q))
                  );
                })
                .map((user) => {
                  const isCurrent = currentUser.id === user.id;

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
                    <div
                      key={user.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-stone-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-stone-900 truncate">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E09F3E]/20 text-[#835500]">
                                (Tú)
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge.color}`}>
                              {roleBadge.label}
                            </span>
                          </div>

                          <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>@{user.username}</span>
                            <span>•</span>
                            <span className="truncate">{user.email}</span>
                            {user.gender && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] text-stone-400">Género: {user.gender}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role Selector */}
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <label className="text-xs text-stone-500 font-semibold hidden md:inline">
                          Asignar Rol:
                        </label>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-800 bg-stone-50 hover:bg-white focus:ring-2 focus:ring-[#E09F3E] focus:outline-hidden cursor-pointer"
                        >
                          <option value="usuario">Usuario (Estándar)</option>
                          <option value="premium">Chef Premium</option>
                          <option value="editor">Editora Gastronómica</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Recipe Deletion in Moderation */}
      <ConfirmDeleteRecipeModal
        isOpen={!!reportToDelete}
        recipeTitle={reportToDelete?.targetTitleOrName || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setReportToDelete(null)}
      />
    </div>
  );
};
