/**
 * RF-16: Búsqueda de recetas por palabras clave, ingredientes específicos, título o categoría general.
 * Incluye normalización insensible a tildes/acentos, tokenización de términos múltiples y desglose de coincidencias.
 */

import { Recipe, DietaryTag } from '../types';

export type SearchScope = 'todo' | 'titulo' | 'ingredientes' | 'palabras_clave' | 'categoria';

/** Normaliza texto removiendo diacríticos/tildes y convirtiendo a minúsculas */
export const normalizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/** Categorías generales y sus sinónimos en español para búsqueda flexible */
export const CATEGORY_DEFINITIONS: Record<
  string,
  { label: string; keywords: string[]; matchesCategories: string[] }
> = {
  panaderia: {
    label: 'Panadería & Masas',
    keywords: ['panaderia', 'pan', 'panes', 'masas', 'masa madre', 'hogaza', 'bolleria', 'baking', 'harina'],
    matchesCategories: ['panaderia'],
  },
  pastas: {
    label: 'Pastas & Platos Fuertes',
    keywords: ['pastas', 'pasta', 'penne', 'spaghetti', 'fideos', 'tallarines', 'platos fuertes', 'plato fuerte', 'principal', 'risotto', 'souffle'],
    matchesCategories: ['pastas', 'platos_fuertes'],
  },
  ensaladas: {
    label: 'Entrantes & Ensaladas',
    keywords: ['ensaladas', 'ensalada', 'bowls', 'entrantes', 'fresco', 'bowl', 'vegetales'],
    matchesCategories: ['ensaladas'],
  },
  postres: {
    label: 'Postres & Dulces',
    keywords: ['postres', 'postre', 'dulce', 'dulces', 'reposteria', 'torta', 'pastel', 'chocolate', 'tiramisu'],
    matchesCategories: ['postres'],
  },
  desayunos: {
    label: 'Bebidas & Desayunos',
    keywords: ['desayunos', 'desayuno', 'bebidas', 'bebida', 'smoothie', 'acai', 'merienda', 'jugo', 'cafe'],
    matchesCategories: ['desayunos'],
  },
  sopas: {
    label: 'Sopas & Cremas',
    keywords: ['sopas', 'sopa', 'cremas', 'crema', 'caldo', 'guiso', 'potaje'],
    matchesCategories: ['sopas'],
  },
};

export interface RecipeSearchMatchResult {
  matches: boolean;
  matchReasons: {
    type: 'titulo' | 'ingrediente' | 'categoria' | 'palabra_clave' | 'autor';
    label: string;
  }[];
}

/**
 * Evalúa si una receta cumple con el criterio de búsqueda RF-16
 * @param recipe La receta a evaluar
 * @param query Texto ingresado por el usuario
 * @param scope Filtro de alcance ('todo' | 'titulo' | 'ingredientes' | 'palabras_clave' | 'categoria')
 * @param selectedSpecificIngredients Lista de ingredientes específicos seleccionados por chips
 */
export const evaluateRF16Match = (
  recipe: Recipe,
  query: string,
  scope: SearchScope = 'todo',
  selectedSpecificIngredients: string[] = []
): RecipeSearchMatchResult => {
  const normQuery = normalizeText(query.replace(/^@/, ''));
  const queryTokens = normQuery.split(/[\s,]+/).filter((t) => t.length > 0);

  const matchReasons: RecipeSearchMatchResult['matchReasons'] = [];

  // Si hay ingredientes específicos seleccionados mediante chips/filtro estricto
  if (selectedSpecificIngredients.length > 0) {
    const hasAllSpecific = selectedSpecificIngredients.every((reqIng) => {
      const normReq = normalizeText(reqIng);
      return recipe.ingredients.some((ing) => normalizeText(ing.name).includes(normReq));
    });
    if (!hasAllSpecific) {
      return { matches: false, matchReasons: [] };
    }
    // Agregar razón por ingrediente específico
    selectedSpecificIngredients.forEach((reqIng) => {
      matchReasons.push({
        type: 'ingrediente',
        label: `Ingrediente: ${reqIng}`,
      });
    });
  }

  // Si no hay query de texto y pasó los ingredientes específicos, es coincidencia
  if (!normQuery) {
    return { matches: true, matchReasons };
  }

  const normTitle = normalizeText(recipe.title);
  const normDesc = normalizeText(recipe.description);
  const normAuthor = normalizeText(recipe.authorName);
  const normCategory = normalizeText(recipe.category);

  // Buscar categoría general coincidente
  const matchedCategories = Object.entries(CATEGORY_DEFINITIONS).filter(([key, def]) => {
    const keyMatch = normQuery.includes(key) || key.includes(normQuery);
    const labelMatch = normalizeText(def.label).includes(normQuery);
    const kwMatch = def.keywords.some((kw) => normQuery.includes(kw) || kw.includes(normQuery));
    return (keyMatch || labelMatch || kwMatch) && def.matchesCategories.includes(recipe.category);
  });

  // Chequeo 1: TÍTULO
  const matchesTitle = queryTokens.every((token) => normTitle.includes(token));
  if (matchesTitle && (scope === 'todo' || scope === 'titulo')) {
    matchReasons.push({ type: 'titulo', label: `Título: "${recipe.title}"` });
  }

  // Chequeo 2: INGREDIENTES ESPECÍFICOS
  const matchedIngredients = (recipe.ingredients || []).filter((ing) => {
    const normIng = normalizeText(ing.name);
    const normCat = normalizeText(ing.category);
    return queryTokens.some((token) => normIng.includes(token) || normCat.includes(token));
  });

  if (matchedIngredients.length > 0 && (scope === 'todo' || scope === 'ingredientes')) {
    matchedIngredients.slice(0, 3).forEach((ing) => {
      matchReasons.push({
        type: 'ingrediente',
        label: `Ingrediente: ${ing.name}`,
      });
    });
  }

  // Chequeo 3: CATEGORÍA GENERAL
  const matchesCategory =
    matchedCategories.length > 0 ||
    queryTokens.some((token) => {
      if (normCategory.includes(token)) return true;
      const def = CATEGORY_DEFINITIONS[recipe.category] || CATEGORY_DEFINITIONS['pastas'];
      return def && (normalizeText(def.label).includes(token) || def.keywords.some((k) => k.includes(token)));
    });

  if (matchesCategory && (scope === 'todo' || scope === 'categoria')) {
    const def = Object.values(CATEGORY_DEFINITIONS).find((d) => d.matchesCategories.includes(recipe.category));
    matchReasons.push({
      type: 'categoria',
      label: `Categoría: ${def ? def.label : recipe.category}`,
    });
  }

  // Chequeo 4: PALABRAS CLAVE (descripción, pasos, técnicas, tips, etiquetas nutricionales/dietéticas)
  const matchedSteps = (recipe.steps || []).filter((s) => {
    const normStepTitle = normalizeText(s.title);
    const normStepDesc = normalizeText(s.description);
    const normStepTip = normalizeText(s.tip);
    return queryTokens.some(
      (token) => normStepTitle.includes(token) || normStepDesc.includes(token) || normStepTip.includes(token)
    );
  });

  const matchedTags = (recipe.tags || []).filter((t) => {
    const normTag = normalizeText(t);
    return queryTokens.some((token) => normTag.includes(token));
  });

  const matchesKeywords =
    queryTokens.every((token) => normDesc.includes(token)) ||
    matchedSteps.length > 0 ||
    matchedTags.length > 0;

  if (matchesKeywords && (scope === 'todo' || scope === 'palabras_clave')) {
    if (matchedSteps.length > 0) {
      matchReasons.push({
        type: 'palabra_clave',
        label: `Paso: "${matchedSteps[0].title}"`,
      });
    } else if (matchedTags.length > 0) {
      matchReasons.push({
        type: 'palabra_clave',
        label: `Etiqueta: ${matchedTags.join(', ')}`,
      });
    } else if (normDesc.includes(normQuery)) {
      matchReasons.push({
        type: 'palabra_clave',
        label: 'Palabra clave en descripción',
      });
    }
  }

  // Chequeo Autor (compatibilidad adicional con búsqueda de usuarios)
  const matchesAuthor = normAuthor.includes(normQuery);
  if (matchesAuthor && scope === 'todo') {
    matchReasons.push({
      type: 'autor',
      label: `Autor: ${recipe.authorName}`,
    });
  }

  // Decisión final según el alcance (scope)
  let isMatch = false;
  if (scope === 'todo') {
    isMatch = matchesTitle || matchedIngredients.length > 0 || matchesCategory || matchesKeywords || matchesAuthor;
  } else if (scope === 'titulo') {
    isMatch = matchesTitle;
  } else if (scope === 'ingredientes') {
    isMatch = matchedIngredients.length > 0;
  } else if (scope === 'palabras_clave') {
    isMatch = matchesKeywords;
  } else if (scope === 'categoria') {
    isMatch = matchesCategory;
  }

  return {
    matches: isMatch,
    matchReasons,
  };
};

/** Ingredientes populares y recurrentes para filtrado rápido por ingredientes específicos */
export const POPULAR_INGREDIENTS = [
  { name: 'Queso', icon: '🧀' },
  { name: 'Tomate', icon: '🍅' },
  { name: 'Harina', icon: '🌾' },
  { name: 'Albahaca', icon: '🌿' },
  { name: 'Aguacate', icon: '🥑' },
  { name: 'Café', icon: '☕' },
  { name: 'Hongos', icon: '🍄' },
  { name: 'Açaí', icon: '🫐' },
  { name: 'Plátano', icon: '🍌' },
  { name: 'Huevos', icon: '🥚' },
];
