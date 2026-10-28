import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteRecipeModalProps {
  isOpen: boolean;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteRecipeModal: React.FC<ConfirmDeleteRecipeModalProps> = ({
  isOpen,
  recipeTitle,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <Trash2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-stone-900 font-display">
            Eliminar receta permanentemente
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed font-medium">
            ¿Estás seguro de que deseas eliminar permanentemente la receta &apos;{recipeTitle}&apos;?
          </p>
          <p className="text-xs text-stone-500">
            Esta acción es irreversible. La receta se retirará del catálogo, foros, colecciones y carritos de compras.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar permanentemente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
