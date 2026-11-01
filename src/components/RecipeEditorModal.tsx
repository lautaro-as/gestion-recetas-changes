import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, Step, DietaryTag, RecipeStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Video,
  Sparkles,
  Users,
  Image as ImageIcon,
  Save,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileEdit,
  Lock,
  UserCheck,
  UserX,
  Search,
  Info
} from 'lucide-react';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeToEdit?: Recipe | null;
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  isOpen,
  onClose,
  recipeToEdit,
}) => {
  const { currentUser, allUsers, createRecipe, updateRecipe, showToast } = useApp();

  const [title, setTitle] = useState(recipeToEdit?.title || '');
  const [description, setDescription] = useState(recipeToEdit?.description || '');
  const [coverImage, setCoverImage] = useState(recipeToEdit?.coverImage || '');
  const [prepTimeMin, setPrepTimeMin] = useState(recipeToEdit?.prepTimeMin || 20);
  const [cookTimeMin, setCookTimeMin] = useState(recipeToEdit?.cookTimeMin || 30);
  const [servings, setServings] = useState(recipeToEdit?.servings || 4);
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>(recipeToEdit?.difficulty || 'facil');
  const [category, setCategory] = useState<Recipe['category']>(recipeToEdit?.category || 'platos_fuertes');
  const [tags, setTags] = useState<DietaryTag[]>(recipeToEdit?.tags || ['vegetariano']);
  const [videoUrl, setVideoUrl] = useState(recipeToEdit?.videoUrl || '');
  const [coAuthorsText, setCoAuthorsText] = useState(recipeToEdit?.coAuthors?.join(', ') || '');
  const [showCollaboratorSuggestions, setShowCollaboratorSuggestions] = useState(false);
  
  // Publication Status & Scheduling
  const [status, setStatus] = useState<RecipeStatus>(recipeToEdit?.status || 'published');
  const [scheduledDate, setScheduledDate] = useState(
    recipeToEdit?.scheduledPublishDate
      ? new Date(recipeToEdit.scheduledPublishDate).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
  );

  // Ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipeToEdit?.ingredients || [
      {
        id: 'ing-custom-1',
        name: 'Aceite de oliva virgen extra',
        quantity: 30,
        unit: 'ml',
        estimatedPrice: 1.5,
        storeName: 'Supermercado Central Gourmet',
        storeLocation: 'Av. Libertador 880',
        inStock: true,
        stockLevel: 'alto',
        category: 'frescos'
      },
      {
        id: 'ing-custom-2',
        name: 'Ajo fresco triturado',
        quantity: 2,
        unit: 'dientes',
        estimatedPrice: 0.4,
        storeName: 'Mercado Fresco Orgánico',
        storeLocation: 'Paseo de la Ribera 45',
        inStock: true,
        stockLevel: 'alto',
        category: 'frescos'
      }
    ]
  );

  // Steps
  const [steps, setSteps] = useState<Step[]>(
    recipeToEdit?.steps || [
      {
        stepNumber: 1,
        title: 'Preparación y mise en place',
        description: 'Lavar y cortar todos los ingredientes frescos según las medidas indicadas.',
        durationMinutes: 10,
        tip: 'Tener todo pesado y listo antes de calentar sartenes u ollas.'
      },
      {
        stepNumber: 2,
        title: 'Cocción principal',
        description: 'Cocinar a fuego moderado removiendo constantemente hasta alcanzar el punto deseado.',
        durationMinutes: 20
      }
    ]
  );

  // Nutrition
  const [calories, setCalories] = useState(recipeToEdit?.nutrition.calories || 320);
  const [proteinG, setProteinG] = useState(recipeToEdit?.nutrition.proteinG || 12);
  const [carbsG, setCarbsG] = useState(recipeToEdit?.nutrition.carbsG || 35);
  const [fatG, setFatG] = useState(recipeToEdit?.nutrition.fatG || 14);
  const [fiberG, setFiberG] = useState(recipeToEdit?.nutrition.fiberG || 5);

  useEffect(() => {
    if (isOpen) {
      if (recipeToEdit) {
        setTitle(recipeToEdit.title);
        setDescription(recipeToEdit.description);
        setCoverImage(recipeToEdit.coverImage);
        setPrepTimeMin(recipeToEdit.prepTimeMin);
        setCookTimeMin(recipeToEdit.cookTimeMin);
        setServings(recipeToEdit.servings);
        setDifficulty(recipeToEdit.difficulty);
        setCategory(recipeToEdit.category);
        setTags(recipeToEdit.tags || []);
        setVideoUrl(recipeToEdit.videoUrl || '');
        setCoAuthorsText(recipeToEdit.coAuthors?.join(', ') || '');
        setStatus(recipeToEdit.status);
        setScheduledDate(
          recipeToEdit.scheduledPublishDate
            ? new Date(recipeToEdit.scheduledPublishDate).toISOString().slice(0, 16)
            : new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
        );
        setIngredients(
          recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0
            ? recipeToEdit.ingredients.map(i => ({ ...i }))
            : [
                {
                  id: `ing-${Date.now()}-1`,
                  name: '',
                  quantity: 1,
                  unit: 'unidad',
                  estimatedPrice: 1.0,
                  storeName: 'Mercado Fresco Orgánico',
                  storeLocation: 'Centro',
                  inStock: true,
                  stockLevel: 'alto',
                  category: 'frescos'
                }
              ]
        );
        setSteps(
          recipeToEdit.steps && recipeToEdit.steps.length > 0
            ? recipeToEdit.steps.map(s => ({ ...s }))
            : [
                {
                  stepNumber: 1,
                  title: 'Preparación y mise en place',
                  description: '',
                  durationMinutes: 10
                }
              ]
        );
        setCalories(recipeToEdit.nutrition?.calories ?? 300);
        setProteinG(recipeToEdit.nutrition?.proteinG ?? 10);
        setCarbsG(recipeToEdit.nutrition?.carbsG ?? 30);
        setFatG(recipeToEdit.nutrition?.fatG ?? 10);
        setFiberG(recipeToEdit.nutrition?.fiberG ?? 4);
      } else {
        setTitle('');
        setDescription('');
        setCoverImage('');
        setPrepTimeMin(20);
        setCookTimeMin(30);
        setServings(4);
        setDifficulty('facil');
        setCategory('platos_fuertes');
        setTags(['vegetariano']);
        setVideoUrl('');
        setCoAuthorsText('');
        setStatus('published');
        setScheduledDate(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
        setIngredients([
          {
            id: `ing-${Date.now()}-1`,
            name: 'Aceite de oliva virgen extra',
            quantity: 30,
            unit: 'ml',
            estimatedPrice: 2800,
            storeName: 'Carrefour Market',
            storeLocation: 'Av. Corrientes 3247, Abasto',
            inStock: true,
            stockLevel: 'alto',
            category: 'frescos'
          }
        ]);
        setSteps([
          {
            stepNumber: 1,
            title: 'Preparación y mise en place',
            description: '',
            durationMinutes: 10
          }
        ]);
        setCalories(320);
        setProteinG(12);
        setCarbsG(35);
        setFatG(14);
        setFiberG(5);
      }
    }
  }, [isOpen, recipeToEdit]);

  // Permissions validation: author, co-authors, and staff (admin/editor)
  const isAuthor = !recipeToEdit || recipeToEdit.authorId === currentUser.id;
  const isCoAuthor = Boolean(
    recipeToEdit?.coAuthors &&
      recipeToEdit.coAuthors.some(
        (ca) =>
          ca.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          ca.toLowerCase().includes(currentUser.username.toLowerCase()) ||
          (ca.startsWith('@') && ca.slice(1).toLowerCase() === currentUser.username.toLowerCase())
      )
  );
  const isStaff = currentUser.role === 'editor' || currentUser.role === 'admin';
  const canEdit = isAuthor || isCoAuthor || isStaff;

  if (!isOpen) return null;

  const toggleTag = (tag: DietaryTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddIngredient = () => {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: '',
      quantity: 1,
      unit: 'unidad',
      estimatedPrice: 1500,
      storeName: 'Coto Digital',
      storeLocation: 'Sucursal Belgrano',
      inStock: true,
      stockLevel: 'alto',
      category: 'frescos'
    };
    setIngredients((prev) => [...prev, newIng]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateIngredient = (idx: number, field: keyof Ingredient, value: any) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };

  const handleAddStep = () => {
    const nextStepNum = steps.length + 1;
    const newStep: Step = {
      stepNumber: nextStepNum,
      title: `Paso ${nextStepNum}`,
      description: '',
      durationMinutes: 10
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const handleUpdateStep = (idx: number, field: keyof Step, value: any) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, [field]: value } : step))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Debes iniciar sesión para guardar o publicar una receta.');
      return;
    }

    if (recipeToEdit && !canEdit) {
      showToast('No tienes permisos suficientes para modificar esta receta.');
      return;
    }

    if (!title.trim()) {
      showToast('Por favor introduce un título para la receta.');
      return;
    }
    if (!coverImage.trim()) {
      showToast('Debes proporcionar una imagen propia para la receta.');
      return;
    }

    const coAuthorsList = coAuthorsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const recipeData = {
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage.trim(),
      authorId: recipeToEdit ? recipeToEdit.authorId : currentUser.id,
      authorName: recipeToEdit ? recipeToEdit.authorName : currentUser.name,
      authorAvatar: recipeToEdit ? recipeToEdit.authorAvatar : currentUser.avatar,
      coAuthors: coAuthorsList,
      status,
      scheduledPublishDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
      prepTimeMin: Number(prepTimeMin),
      cookTimeMin: Number(cookTimeMin),
      servings: Number(servings),
      difficulty,
      category,
      tags,
      ingredients,
      steps,
      videoUrl: videoUrl.trim() || undefined,
      nutrition: {
        calories: Number(calories),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatG: Number(fatG),
        fiberG: Number(fiberG)
      }
    };

    if (recipeToEdit) {
      const ok = updateRecipe(recipeToEdit.id, recipeData);
      if (ok) {
        onClose();
      }
    } else {
      createRecipe(recipeData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {recipeToEdit ? 'Editar Receta' : 'Nueva Creación Culinaria'}
              </h2>
              <p className="text-xs text-amber-100">
                {recipeToEdit
                  ? `Modificando "${recipeToEdit.title}" (${recipeToEdit.status === 'draft' ? 'Borrador' : recipeToEdit.status === 'scheduled' ? 'Programada' : 'Publicada'})`
                  : 'Estructura ingredientes, paso a paso, etiquetas dietéticas y programación'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Status & Permissions Notice Banner */}
          {recipeToEdit && (
            <div className="space-y-3">
              {recipeToEdit.status === 'draft' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <FileEdit className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <strong className="block text-emerald-950 font-bold mb-0.5">
                      Borrador privado en edición
                    </strong>
                    Tienes total libertad para modificar todos los datos, ingredientes, tiempos y pasos. Puedes mantenerlo como borrador o publicarlo directamente en el catálogo cuando esté listo.
                  </div>
                </div>
              ) : recipeToEdit.status === 'published' ? (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-900 leading-relaxed">
                    <strong className="block text-sky-950 font-bold mb-0.5">
                      Receta publicada en catálogo (Modificación sujeta a restricciones de integridad)
                    </strong>
                    Esta receta ya se encuentra visible en el catálogo gastronómico. Puedes actualizar y enriquecer la descripción, ingredientes, instrucciones y tiempos de cocción. Por integridad de la comunidad, el autor original, la fecha de publicación, los comentarios y las valoraciones se conservan intactos.
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="block text-amber-950 font-bold mb-0.5">
                      Receta programada en edición
                    </strong>
                    Puedes modificar los contenidos, pasos o ajustar la fecha y hora programada para su lanzamiento automático.
                  </div>
                </div>
              )}

              {!canEdit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Acceso restringido para edición</strong>
                    No tienes autorización para modificar esta receta. Solo el autor principal, sus coautores registrados o el equipo editorial pueden realizar cambios.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Título de la Receta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tarta de Manzanas Caramelizadas Sin Gluten"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Descripción / Historia breve
                </label>
                <textarea
                  rows={3}
                  placeholder="Explica qué hace especial a este plato, texturas, aromas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Recipe['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden capitalize"
                  >
                    <option value="platos_fuertes">Platos Fuertes</option>
                    <option value="pastas">Pastas</option>
                    <option value="panaderia">Panadería & Masas</option>
                    <option value="ensaladas">Ensaladas & Bowls</option>
                    <option value="sopas">Sopas & Cremas</option>
                    <option value="postres">Postres & Dulces</option>
                    <option value="desayunos">Desayunos & Brunch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Dificultad
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Recipe['difficulty'])}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden capitalize"
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Avanzada / Chef</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Prep (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={prepTimeMin}
                    onChange={(e) => setPrepTimeMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Cocción (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cookTimeMin}
                    onChange={(e) => setCookTimeMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Raciones
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Cover image & Co-authors */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Foto de Portada de la Receta *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
                    placeholder="https://..."
                  />
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Image preview or empty placeholder */}
                {!coverImage.trim() ? (
                  <div className="mt-2 h-32 rounded-2xl bg-amber-50/50 border-2 border-dashed border-amber-300/80 flex flex-col items-center justify-center text-center p-3">
                    <span
                      className="material-symbols-outlined text-[#835500] text-[36px] mb-1"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      room_service
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      Aún no se ha seleccionado una imágen
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5">
                      Ingresa una URL propia para visualizar la receta
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative group">
                    <img
                      src={coverImage}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar imagen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Co-autores y Colaboradores Registrados
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    Escribe @usuario para autocompletar
                  </span>
                </label>

                {/* Chips of currently added collaborators */}
                {(() => {
                  const currentTokens = coAuthorsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                  if (currentTokens.length === 0) return null;

                  return (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {currentTokens.map((token, idx) => {
                        const cleanHandle = token.replace(/^@/, '').toLowerCase();
                        const registeredUser = allUsers.find(
                          (u) =>
                            u.username.toLowerCase() === cleanHandle ||
                            u.name.toLowerCase() === token.toLowerCase()
                        );

                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs ${
                              registeredUser
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {registeredUser ? (
                              <img
                                src={registeredUser.avatar}
                                alt={registeredUser.name}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <Users className="w-3 h-3 text-stone-500 shrink-0" />
                            )}
                            <span className="font-semibold">
                              {registeredUser ? `@${registeredUser.username}` : token}
                            </span>
                            {registeredUser && (
                              <span className="text-[10px] text-amber-700 font-normal hidden sm:inline">
                                ({registeredUser.name})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const newTokens = currentTokens.filter((_, i) => i !== idx);
                                setCoAuthorsText(newTokens.join(', ') + (newTokens.length > 0 ? ', ' : ''));
                              }}
                              className="ml-0.5 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                              title="Quitar colaborador"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. @juan, @lucianutri, @camicocina..."
                    value={coAuthorsText}
                    onFocus={() => setShowCollaboratorSuggestions(true)}
                    onChange={(e) => {
                      setCoAuthorsText(e.target.value);
                      setShowCollaboratorSuggestions(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  {coAuthorsText.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCollaboratorSuggestions(!showCollaboratorSuggestions)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 hover:bg-amber-100 cursor-pointer"
                      title="Ver sugerencias de usuarios"
                    >
                      {showCollaboratorSuggestions ? 'Ocultar lista' : 'Ver lista'}
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List matching registered users (Max 7) */}
                {(() => {
                  if (!showCollaboratorSuggestions) return null;

                  const rawLastToken = coAuthorsText.split(',').pop()?.trim() || '';
                  const cleanQuery = rawLastToken.replace(/^@/, '').toLowerCase();

                  // Find candidates excluding self
                  const availableUsers = allUsers.filter((u) => u.id !== currentUser.id);

                  let suggestions: typeof allUsers = [];
                  let isFiltering = cleanQuery.length > 0;

                  if (isFiltering) {
                    // Match by username or name
                    const matched = availableUsers.filter((u) => {
                      const uUsername = u.username.toLowerCase();
                      const uName = u.name.toLowerCase();
                      return uUsername.includes(cleanQuery) || uName.includes(cleanQuery);
                    });

                    // Sort so users whose username/name starts with the query appear first
                    matched.sort((a, b) => {
                      const aUserStarts = a.username.toLowerCase().startsWith(cleanQuery);
                      const bUserStarts = b.username.toLowerCase().startsWith(cleanQuery);
                      if (aUserStarts && !bUserStarts) return -1;
                      if (!aUserStarts && bUserStarts) return 1;
                      return 0;
                    });

                    // RF: Maximum 7 users allowed in autocomplete list
                    suggestions = matched.slice(0, 7);
                  } else {
                    // If focused but haven't typed or just placed comma, suggest up to 7 platform users
                    suggestions = availableUsers.slice(0, 7);
                  }

                  return (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-stone-200 py-1.5 z-40 max-h-64 overflow-y-auto divide-y divide-stone-100">
                      {/* Case 1: Search performed and NO matches found -> notify user */}
                      {isFiltering && suggestions.length === 0 && (
                        <div className="p-3 text-center bg-amber-50/70 border border-amber-200/80 rounded-xl m-1.5 text-stone-700">
                          <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>No se encontraron coincidencias para "{rawLastToken}"</span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-1">
                            No existe ningún usuario registrado con el alias o nombre <strong>"{rawLastToken}"</strong> en Gusto. Verifica que esté bien escrito o regístralo previamente.
                          </p>
                        </div>
                      )}

                      {/* Case 2: Suggestions found -> display max 7 users */}
                      {suggestions.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-stone-50 flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                            <span>
                              {isFiltering
                                ? `Usuarios encontrados (${suggestions.length} de máx. 7):`
                                : `Usuarios sugeridos para colaborar (máx. 7):`}
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium">
                              Click para autocompletar
                            </span>
                          </div>

                          {suggestions.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const parts = coAuthorsText.split(',');
                                parts.pop();
                                parts.push(`@${user.username}`);
                                const updated = parts.map((p) => p.trim()).filter(Boolean).join(', ');
                                setCoAuthorsText(updated ? updated + ', ' : '');
                                setShowCollaboratorSuggestions(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-amber-50/80 flex items-center justify-between transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-amber-400"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-stone-900 group-hover:text-amber-800 truncate">
                                      {user.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold">
                                      @{user.username}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-stone-400 truncate">
                                    {user.specialties?.length ? user.specialties.slice(0, 2).join(' • ') : user.email}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 group-hover:bg-amber-600 group-hover:text-white px-2.5 py-1 rounded-lg shrink-0 transition-colors ml-2">
                                + Incluir
                              </span>
                            </button>
                          ))}
                        </>
                      )}

                      <div className="px-3 py-1 bg-stone-50 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100">
                        <span>Límite estricto: hasta 7 sugerencias simultáneas</span>
                        <button
                          type="button"
                          onClick={() => setShowCollaboratorSuggestions(false)}
                          className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-stone-400 shrink-0" />
                  Al incluir un colaborador registrado (ej. @juan), este podrá visualizar y editar conjuntamente esta receta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-600" />
                  Video Explicativo YouTube / TikTok (Premium)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
            <label className="block text-xs font-bold text-amber-950 uppercase mb-2">
              Etiquetas Dietéticas y Alérgenos
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'celiaco' as DietaryTag, label: '🌾 Sin TACC / Celíacos' },
                { id: 'vegano' as DietaryTag, label: '🌱 Vegano' },
                { id: 'vegetariano' as DietaryTag, label: '🧀 Vegetariano' },
                { id: 'diabetico' as DietaryTag, label: '🩺 Apto Diabéticos' },
                { id: 'keto' as DietaryTag, label: '🥑 Dieta Keto' },
                { id: 'sin_lactosa' as DietaryTag, label: '🥛 Sin Lactosa' },
                { id: 'bajo_sodio' as DietaryTag, label: '🧂 Bajo en Sodio' },
              ].map((item) => {
                const isSelected = tags.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleTag(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Ingredientes & Tiendas Asociadas
                </h3>
                <p className="text-xs text-stone-500">
                  Especifica cantidades, precio estimado y tienda para compra directa
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Ingrediente
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="col-span-4 sm:col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Nombre (ej. Harina de Almendras)"
                      value={ing.name}
                      onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="Cantidad"
                      value={ing.quantity}
                      onChange={(e) => handleUpdateIngredient(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Unidad (g, ml, u)"
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <select
                      value={ing.storeName}
                      onChange={(e) => handleUpdateIngredient(idx, 'storeName', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-[11px] font-semibold text-stone-800 focus:ring-1 focus:ring-amber-500 truncate"
                    >
                      <option value="Coto Digital">Coto Digital</option>
                      <option value="Carrefour Market">Carrefour Market</option>
                      <option value="Jumbo Hipermercado">Jumbo Hipermercado</option>
                      <option value="Supermercados Día">Supermercados Día</option>
                      <option value="Mercado Central">Mercado Central</option>
                    </select>
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      disabled={ingredients.length <= 1}
                      className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Steps Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Paso a Paso de la Elaboración
                </h3>
                <p className="text-xs text-stone-500">
                  Desglosa la receta con instrucciones claras y tiempos
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Paso
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white">
                      Paso {step.stepNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <input
                          type="number"
                          min="1"
                          value={step.durationMinutes}
                          onChange={(e) => handleUpdateStep(idx, 'durationMinutes', Number(e.target.value))}
                          className="w-14 px-2 py-1 bg-white rounded-lg border border-stone-300 text-xs text-center"
                        />
                        <span className="text-stone-500">min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Título breve del paso (ej. Amasado y reposo)"
                    value={step.title}
                    onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                  />

                  <textarea
                    rows={2}
                    required
                    placeholder="Instrucciones detalladas de este paso..."
                    value={step.description}
                    onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-amber-500 resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Consejo o truco opcional para el paso (ej. Humedece tus manos con agua)"
                    value={step.tip || ''}
                    onChange={(e) => handleUpdateStep(idx, 'tip', e.target.value)}
                    className="w-full px-3 py-1 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Nutritional Info Estimation */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-bold text-stone-700 uppercase mb-2">
              Información Nutricional por Porción
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Calorías (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Proteínas (g)</label>
                <input
                  type="number"
                  value={proteinG}
                  onChange={(e) => setProteinG(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Carbohidratos (g)</label>
                <input
                  type="number"
                  value={carbsG}
                  onChange={(e) => setCarbsG(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Grasas (g)</label>
                <input
                  type="number"
                  value={fatG}
                  onChange={(e) => setFatG(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Fibra (g)</label>
                <input
                  type="number"
                  value={fiberG}
                  onChange={(e) => setFiberG(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white rounded-lg border border-stone-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Publication Options: Draft vs Publish vs Schedule */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              Estado de Publicación & Programación
            </h4>

            {recipeToEdit?.status === 'published' && !isStaff ? (
              <div className="p-3.5 bg-white rounded-xl border border-amber-300 flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span>Receta Publicada Activa en el Catálogo</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      Publicada
                    </span>
                  </div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Esta receta se encuentra pública y disponible para la comunidad. Al guardar las modificaciones, sus datos culinarios e ingredientes se actualizarán de forma inmediata en el catálogo, manteniendo protegida la autoría y las valoraciones de los usuarios.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      status === 'published'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-amber-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={status === 'published'}
                      onChange={() => setStatus('published')}
                      className="sr-only"
                    />
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold">Publicar Ahora</div>
                      <div className={`text-[10px] ${status === 'published' ? 'text-amber-100' : 'text-stone-500'}`}>
                        Visible de inmediato
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      status === 'draft'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-amber-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                      className="sr-only"
                    />
                    <Save className="w-4 h-4 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold">Guardar Borrador</div>
                      <div className={`text-[10px] ${status === 'draft' ? 'text-amber-100' : 'text-stone-500'}`}>
                        {recipeToEdit?.status === 'draft' ? 'Continuar en borrador' : 'Solo visible para ti'}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      status === 'scheduled'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-amber-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="scheduled"
                      checked={status === 'scheduled'}
                      onChange={() => setStatus('scheduled')}
                      className="sr-only"
                    />
                    <Calendar className="w-4 h-4 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold">Programar Lanzamiento</div>
                      <div className={`text-[10px] ${status === 'scheduled' ? 'text-amber-100' : 'text-stone-500'}`}>
                        Fecha y hora exacta
                      </div>
                    </div>
                  </label>
                </div>

                {status === 'scheduled' && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-xs font-bold text-stone-700 shrink-0">
                      Fecha y Hora de Publicación Automática:
                    </span>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-800"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-semibold rounded-xl hover:bg-stone-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recipeToEdit ? !canEdit : false}
              title={recipeToEdit && !canEdit ? 'Solo el autor o moderadores pueden guardar cambios' : undefined}
              className={`px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-full shadow-md transition-colors flex items-center gap-2 ${
                recipeToEdit && !canEdit
                  ? 'bg-stone-400 cursor-not-allowed opacity-60'
                  : 'bg-[#E09F3E] hover:bg-[#835500] cursor-pointer'
              }`}
            >
              <Save className="w-4 h-4" />
              {recipeToEdit
                ? recipeToEdit.status === 'draft'
                  ? 'Guardar Modificaciones'
                  : 'Guardar Cambios'
                : 'Confirmar y Guardar Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
