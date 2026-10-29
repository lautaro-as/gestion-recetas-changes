import { jsPDF } from 'jspdf';
import { Recipe, RecipeCollection, UserProfile } from '../types';

/**
 * Utility to format dates in Spanish
 */
const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Aggregates and groups ingredients from a list of recipes into a clean shopping list.
 */
interface AggregatedIngredient {
  name: string;
  amountText: string;
  category: 'Frescos' | 'Despensa' | 'Lácteos' | 'Especias y Otros';
  store?: string;
}

const buildAggregatedShoppingList = (recipes: Recipe[]): AggregatedIngredient[] => {
  const map = new Map<string, { amounts: string[]; category: AggregatedIngredient['category']; store?: string }>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      const key = ing.name.trim().toLowerCase();
      let category: AggregatedIngredient['category'] = 'Despensa';
      const n = key;
      if (
        n.includes('tomate') ||
        n.includes('cebolla') ||
        n.includes('ajo') ||
        n.includes('albahaca') ||
        n.includes('limón') ||
        n.includes('limon') ||
        n.includes('salmon') ||
        n.includes('salmón') ||
        n.includes('carne') ||
        n.includes('pollo') ||
        n.includes('espinaca') ||
        n.includes('frut') ||
        n.includes('champiñon') ||
        n.includes('hongo') ||
        n.includes('vegetal') ||
        n.includes('zanahoria')
      ) {
        category = 'Frescos';
      } else if (
        n.includes('queso') ||
        n.includes('leche') ||
        n.includes('crema') ||
        n.includes('mantequilla') ||
        n.includes('huevo') ||
        n.includes('parmesano')
      ) {
        category = 'Lácteos';
      } else if (
        n.includes('sal') ||
        n.includes('pimienta') ||
        n.includes('oregano') ||
        n.includes('romero') ||
        n.includes('canela') ||
        n.includes('vainilla') ||
        n.includes('miso') ||
        n.includes('soja')
      ) {
        category = 'Especias y Otros';
      }

      const existing = map.get(key);
      const amountStr = `${ing.quantity} ${ing.unit}`.trim();
      if (existing) {
        existing.amounts.push(amountStr);
        if (ing.storeName && !existing.store) existing.store = ing.storeName;
      } else {
        map.set(key, {
          amounts: [amountStr],
          category,
          store: ing.storeName,
        });
      }
    });
  });

  const list: AggregatedIngredient[] = [];
  map.forEach((val, nameKey) => {
    // Capitalize first letter
    const formattedName = nameKey.charAt(0).toUpperCase() + nameKey.slice(1);
    list.push({
      name: formattedName,
      amountText: val.amounts.slice(0, 3).join(' + '),
      category: val.category,
      store: val.store,
    });
  });

  // Sort by category then name
  const order: Record<AggregatedIngredient['category'], number> = {
    Frescos: 1,
    Lácteos: 2,
    Despensa: 3,
    'Especias y Otros': 4,
  };

  return list.sort((a, b) => order[a.category] - order[b.category] || a.name.localeCompare(b.name));
};

/**
 * Downloads a complete Weekly Meal Planner & Menu (.PDF)
 * featuring the most famous recipes of the week.
 */
export const downloadWeeklyPlannerPdf = ({
  famousRecipes,
  currentUser,
  weekTitle = 'Semana Culinaria de Temporada',
}: {
  famousRecipes: Recipe[];
  currentUser: UserProfile;
  weekTitle?: string;
}): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178 mm
  let currentY = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 18;
    }
  };

  // --- TOP BANNER: PREMIUM GOLD BADGE ---
  doc.setFillColor(131, 85, 0); // #835500 Rich dark gold
  doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GUSTO PREMIUM • PLANIFICADOR SEMANAL Y MENÚ EXCLUSIVO', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 235, 204);
  doc.text('EDICIÓN SEMANAL .PDF', pageWidth - marginX - 6, currentY + 9, { align: 'right' });

  currentY += 19;

  // --- DOCUMENT TITLE & SUBTITLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 25, 20);
  doc.text(weekTitle, marginX, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 90, 80);
  doc.text(
    `Generado para: ${currentUser.name} (@${currentUser.username}) | Membresía: Socio Premium Activo`,
    marginX,
    currentY
  );
  currentY += 5;
  doc.text(`Fecha de emisión: ${getFormattedDate()} | Menú basado en las recetas más aclamadas y votadas`, marginX, currentY);
  currentY += 8;

  // --- HIGHLIGHT BANNER: RECETAS MÁS FAMOSAS DE LA SEMANA ---
  doc.setFillColor(254, 243, 230); // Soft amber
  doc.setDrawColor(224, 159, 62);
  doc.roundedRect(marginX, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(131, 85, 0);
  doc.text('RANKING DE RECETAS MÁS FAMOSAS DE LA COMUNIDAD', marginX + 5, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 55, 40);
  const famousTopSummary = famousRecipes
    .slice(0, 5)
    .map((r, i) => `#${i + 1} ${r.title} (${r.likesCount} likes)`)
    .join('  •  ');
  const splitSummary = doc.splitTextToSize(famousTopSummary, contentWidth - 10);
  doc.text(splitSummary, marginX + 5, currentY + 12);

  currentY += 26;

  // --- SECTION: PLANIFICACIÓN DÍA POR DÍA (Lunes a Domingo) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(131, 85, 0);
  doc.text('CALENDARIO SEMANAL: MENÚ DÍA POR DÍA', marginX, currentY);
  currentY += 6;

  const days = [
    { day: 'Lunes', mealType: 'Almuerzo Revitalizante' },
    { day: 'Martes', mealType: 'Cena Ligera & Gourmet' },
    { day: 'Miércoles', mealType: 'Plato Principal de la Semana' },
    { day: 'Jueves', mealType: 'Cocina Exprés Culinaria' },
    { day: 'Viernes', mealType: 'Especial Fin de Semana' },
    { day: 'Sábado', mealType: 'Gran Menú Festivo' },
    { day: 'Domingo', mealType: 'Postre & Dulce Tradición' },
  ];

  days.forEach((d, idx) => {
    // Pick recipe from famous recipes cycling if needed
    const recipe = famousRecipes[idx % famousRecipes.length];
    if (!recipe) return;

    checkPageBreak(22);

    // Day card box
    doc.setFillColor(252, 250, 248);
    doc.setDrawColor(230, 222, 212);
    doc.roundedRect(marginX, currentY, contentWidth, 19, 2, 2, 'FD');

    // Day Badge on Left
    doc.setFillColor(idx % 2 === 0 ? 224 : 131, idx % 2 === 0 ? 159 : 85, idx % 2 === 0 ? 62 : 0);
    doc.roundedRect(marginX + 2, currentY + 2.5, 26, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(d.day.toUpperCase(), marginX + 15, currentY + 8.5, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text(d.mealType.split(' ')[0], marginX + 15, currentY + 13, { align: 'center' });

    // Recipe Info in Center
    const leftTextX = marginX + 32;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 25, 20);
    const shortTitle = recipe.title.length > 50 ? recipe.title.slice(0, 48) + '...' : recipe.title;
    doc.text(shortTitle, leftTextX, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 80, 70);
    const totalM = recipe.prepTimeMin + recipe.cookTimeMin;
    const authorStr = `Chef: ${recipe.authorName}  |  Tiempo: ${totalM} min  |  ${recipe.servings} porciones  |  ${recipe.nutrition?.calories || 0} kcal`;
    doc.text(authorStr, leftTextX, currentY + 12);

    // Likes & Difficulty Tag on Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(`★ Top #${idx + 1} (${recipe.likesCount} likes)`, pageWidth - marginX - 4, currentY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 100, 90);
    doc.text(`Dificultad: ${recipe.difficulty.toUpperCase()}`, pageWidth - marginX - 4, currentY + 12, { align: 'right' });

    currentY += 21;
  });

  currentY += 5;

  // --- SECTION: LISTA DE COMPRAS SEMANAL CONSOLIDADA ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(131, 85, 0);
  doc.text('LISTA DE COMPRAS SEMANAL CONSOLIDADA', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 80);
  doc.text(
    'Ingredientes unificados de las recetas más famosas seleccionadas para la semana. Marca las casillas al comprar.',
    marginX,
    currentY
  );
  currentY += 6;

  const aggregatedList = buildAggregatedShoppingList(famousRecipes.slice(0, 7));

  // 2-column layout for shopping items
  const colW = (contentWidth - 6) / 2;
  const half = Math.ceil(aggregatedList.length / 2);
  const leftColItems = aggregatedList.slice(0, half);
  const rightColItems = aggregatedList.slice(half);

  const startYForColumns = currentY;
  let leftY = startYForColumns;
  let rightY = startYForColumns;

  // Helper to render one column item
  const renderItem = (item: AggregatedIngredient, xOffset: number, yPos: number): number => {
    // Checkbox
    doc.setDrawColor(160, 140, 120);
    doc.rect(xOffset, yPos - 3, 3, 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 35, 30);
    const itemTitle = `${item.name}`;
    doc.text(itemTitle, xOffset + 5, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 95, 80);
    const detail = `(${item.category}) ${item.amountText}${item.store ? ` • [${item.store}]` : ''}`;
    const splitDetail = doc.splitTextToSize(detail, colW - 7);
    doc.text(splitDetail, xOffset + 5, yPos + 3.8);

    return 4 + splitDetail.length * 3.5;
  };

  // Render Left Column
  leftColItems.forEach((item) => {
    if (leftY + 10 > pageHeight - 20) {
      doc.addPage();
      leftY = 18;
      rightY = 18;
    }
    const addedHeight = renderItem(item, marginX, leftY);
    leftY += addedHeight;
  });

  // Render Right Column
  rightColItems.forEach((item) => {
    if (rightY + 10 > pageHeight - 20) {
      doc.addPage();
      leftY = 18;
      rightY = 18;
    }
    const addedHeight = renderItem(item, marginX + colW + 6, rightY);
    rightY += addedHeight;
  });

  currentY = Math.max(leftY, rightY) + 6;

  // --- SECTION: CONSEJOS DE MEAL PREP & BATCH COOKING ---
  checkPageBreak(30);
  doc.setFillColor(254, 243, 230);
  doc.setDrawColor(224, 159, 62);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(131, 85, 0);
  doc.text('CONSEJOS DE MEAL PREP & COCINA EFICIENTE (PLANNER PREMIUM)', marginX + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 55, 40);
  const tips = [
    '• Domingo de preparación: Lava y corta todas las hierbas y verduras frescas en recipientes herméticos.',
    '• Caldos y bases: Puedes dejar listos los fondos de cocción y conservarlos refrigerados hasta por 4 días.',
    '• Porciones inteligentes: Las recetas seleccionadas rinden para almuerzo y cena; duplica guarniciones secas.',
  ];
  tips.forEach((tip, i) => {
    doc.text(tip, marginX + 5, currentY + 11 + i * 4);
  });

  // --- FOOTERS ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 215, 210);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 130, 120);
    doc.text(
      'Gusto Premium • [RF-30] Planificador Semanal & Menú de Recetas Famosas (.PDF)',
      marginX,
      pageHeight - 6.5
    );

    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
  }

  // --- SAVE / DOWNLOAD ---
  const safeTitle = `planificador_semanal_premium_${getFormattedDate()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(safeTitle);
};

/**
 * Downloads a complete Curated Recipe Package / Master Cookbook (.PDF)
 * containing multiple recipes with full step-by-step instructions.
 */
export const downloadRecipePackagePdf = ({
  packageName,
  description,
  recipes,
  curatedBy,
}: {
  packageName: string;
  description: string;
  recipes: Recipe[];
  curatedBy: string;
}): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 24;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
  };

  // --- COVER / HEADER ---
  doc.setFillColor(131, 85, 0); // Gold header
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('GUSTO • PAQUETE DE RECETAS PREMIUM', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 235, 204);
  doc.text(`Compilación Culinaria Oficial • ${recipes.length} Recetas Seleccionadas`, marginX + 6, currentY + 16);

  currentY += 28;

  // Package title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 25, 20);
  const titleLines = doc.splitTextToSize(packageName, contentWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 7 + 2;

  // Subtitle / Description
  if (description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 80, 70);
    const descLines = doc.splitTextToSize(description, contentWidth);
    doc.text(descLines, marginX, currentY);
    currentY += descLines.length * 4.5 + 4;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 110, 100);
  doc.text(`Curado por: ${curatedBy}  |  Fecha de exportación: ${getFormattedDate()}`, marginX, currentY);
  currentY += 8;

  // Table of Contents Box
  doc.setFillColor(254, 243, 230);
  doc.setDrawColor(224, 159, 62);
  doc.roundedRect(marginX, currentY, contentWidth, 8 + recipes.length * 5, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(131, 85, 0);
  doc.text('ÍNDICE DEL PAQUETE:', marginX + 5, currentY + 6);

  recipes.forEach((rec, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 35, 30);
    doc.text(`${idx + 1}. ${rec.title} (${rec.likesCount} votos)`, marginX + 8, currentY + 11 + idx * 5);
  });

  currentY += 14 + recipes.length * 5;

  // --- RENDER EACH RECIPE ---
  recipes.forEach((recipe, recipeIndex) => {
    // Each recipe starts on a clean section / page
    doc.addPage();
    currentY = 20;

    // Header badge
    doc.setFillColor(245, 240, 232);
    doc.roundedRect(marginX, currentY, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(131, 85, 0);
    doc.text(
      `RECETA #${recipeIndex + 1} DEL PAQUETE  •  ${recipe.category.toUpperCase()}`,
      marginX + 4,
      currentY + 6
    );
    doc.text(`★ ${recipe.likesCount} me gusta`, pageWidth - marginX - 4, currentY + 6, { align: 'right' });
    currentY += 13;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 25, 20);
    const rTitleLines = doc.splitTextToSize(recipe.title, contentWidth);
    doc.text(rTitleLines, marginX, currentY);
    currentY += rTitleLines.length * 7;

    // Author
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 90, 80);
    doc.text(`Por Chef ${recipe.authorName}  |  Dificultad: ${recipe.difficulty.toUpperCase()}`, marginX, currentY);
    currentY += 5;

    // Metadata bar
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(220, 215, 210);
    doc.roundedRect(marginX, currentY, contentWidth, 10, 1, 1, 'FD');

    const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(131, 85, 0);
    const metaStr = `TIEMPO: ${totalTime} min (${recipe.prepTimeMin}m prep / ${recipe.cookTimeMin}m cocción)    |    PORCIONES: ${recipe.servings}    |    CALORÍAS: ${recipe.nutrition?.calories || 0} kcal`;
    doc.text(metaStr, marginX + 4, currentY + 6.5);
    currentY += 14;

    // Description
    if (recipe.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(70, 65, 60);
      const rDescLines = doc.splitTextToSize(recipe.description, contentWidth);
      doc.text(rDescLines, marginX, currentY);
      currentY += rDescLines.length * 4 + 4;
    }

    // Ingredients
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(131, 85, 0);
    doc.text('Ingredientes Requeridos', marginX, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(35, 30, 25);
    recipe.ingredients.forEach((ing) => {
      checkPageBreak(5);
      doc.setDrawColor(180, 170, 160);
      doc.rect(marginX, currentY - 2.5, 2.5, 2.5);
      const ingLine = `${ing.quantity} ${ing.unit} de ${ing.name}${ing.storeName ? ` (${ing.storeName})` : ''}`;
      doc.text(ingLine, marginX + 5, currentY);
      currentY += 4.5;
    });

    currentY += 4;

    // Steps
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(131, 85, 0);
    doc.text('Instrucciones de Preparación', marginX, currentY);
    currentY += 5;

    recipe.steps.forEach((step) => {
      const stepTitle = `${step.stepNumber}. ${step.title} (${step.durationMinutes} min)`;
      const sDescLines = doc.splitTextToSize(step.description, contentWidth - 6);
      let needed = 5 + sDescLines.length * 3.8 + 3;
      if (step.tip) needed += 6;

      checkPageBreak(needed);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(131, 85, 0);
      doc.text(stepTitle, marginX, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(40, 35, 30);
      doc.text(sDescLines, marginX + 3, currentY);
      currentY += sDescLines.length * 3.8 + 2;

      if (step.tip) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(140, 90, 20);
        doc.text(`* Tip: ${step.tip}`, marginX + 3, currentY);
        currentY += 4.5;
      }
      currentY += 1.5;
    });
  });

  // --- FOOTERS ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 215, 210);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 130, 120);
    doc.text(
      `Gusto • Paquete de Recetas: ${packageName} (.PDF)`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
  }

  // --- SAVE ---
  const safeName = `paquete_${packageName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(safeName);
};
