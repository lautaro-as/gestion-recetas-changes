import React, { useEffect } from 'react';
import { Recipe } from '../types';
import { Download, FileText, X } from 'lucide-react';

interface ConfirmDownloadRecipeModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDownloadRecipeModal: React.FC<ConfirmDownloadRecipeModalProps> = ({
  isOpen,
  recipe,
  onConfirm,
  onCancel,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#835500] to-[#E09F3E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Confirmar Descarga
              </h3>
              <p className="text-[11px] text-amber-100">
                Documento de Receta en PDF
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-xl text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-base text-stone-800 font-semibold leading-relaxed">
            ¿Estas seguro que queres descargar esta receta?
          </p>

          {/* Recipe Card Preview */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0 ring-2 ring-amber-300"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-stone-900 truncate">
                {recipe.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                <span className="capitalize">{recipe.category}</span>
                <span>•</span>
                <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed">
            Se generará y descargará un documento PDF optimizado con la lista de ingredientes, cantidades exactas y pasos de preparación paso a paso.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#835500] to-[#E09F3E] hover:from-[#5A3900] hover:to-[#C58529] text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
