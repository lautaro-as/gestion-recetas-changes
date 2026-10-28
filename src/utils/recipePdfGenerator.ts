import { jsPDF } from 'jspdf';
import { Recipe } from '../types';

/**
 * Generates and downloads a clean, beautifully formatted "Quick-Read Digital PDF"
 * for an individual recipe (RF-29).
 */
export const downloadRecipePdf = (recipe: Recipe): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174 mm
  let currentY = 18;

  // Helper for adding a new page with header reset
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
  };

  // --- BRAND HEADER ---
  doc.setFillColor(254, 243, 230); // Soft amber tint (#FEF3E6)
  doc.roundedRect(marginX, currentY, contentWidth, 12, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(131, 85, 0); // #835500
  doc.text('GUSTO • SISTEMA DE GESTIÓN DE RECETAS', marginX + 4, currentY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 100, 80);
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Lectura Rápida | ${dateStr}`, pageWidth - marginX - 4, currentY + 7.5, { align: 'right' });

  currentY += 18;

  // --- RECIPE TITLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 25, 20);
  const titleLines = doc.splitTextToSize(recipe.title, contentWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 8 + 2;

  // --- AUTHOR & CO-AUTHORS ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 90, 80);
  let authorLine = `Por Chef ${recipe.authorName}`;
  if (recipe.coAuthors && recipe.coAuthors.length > 0) {
    authorLine += ` | Colaboradores: ${recipe.coAuthors.join(', ')}`;
  }
  doc.text(authorLine, marginX, currentY);
  currentY += 6;

  // --- DESCRIPTION ---
  if (recipe.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(70, 65, 60);
    const descLines = doc.splitTextToSize(recipe.description, contentWidth);
    doc.text(descLines, marginX, currentY);
    currentY += descLines.length * 4.5 + 4;
  }

  // --- METADATA STRIP (Time, Servings, Difficulty, Calories) ---
  checkPageBreak(18);
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;
  const metaItems = [
    { label: 'TIEMPO TOTAL', value: `${totalTime} min (Prep ${recipe.prepTimeMin}m / Coc ${recipe.cookTimeMin}m)` },
    { label: 'PORCIONES', value: `${recipe.servings} raciones` },
    { label: 'DIFICULTAD', value: recipe.difficulty.toUpperCase() },
    { label: 'CALORÍAS', value: `${recipe.nutrition?.calories || 0} kcal / ración` },
  ];

  metaItems.forEach((item, idx) => {
    const xPos = marginX + idx * colWidth + colWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(131, 85, 0);
    doc.text(item.label, xPos, currentY + 5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 25, 20);
    doc.text(item.value, xPos, currentY + 10, { align: 'center' });
  });

  currentY += 19;

  // --- DIETARY TAGS ---
  if (recipe.tags && recipe.tags.length > 0) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 110, 70);
    const tagsText = recipe.tags.map(t => `#${t.replace('_', ' ')}`).join('   ');
    doc.text(`ETIQUETAS: ${tagsText}`, marginX, currentY);
    currentY += 7;
  }

  // --- DIVIDER LINE ---
  doc.setDrawColor(210, 200, 190);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // --- INGREDIENTS SECTION ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(131, 85, 0);
  doc.text('INGREDIENTES REQUERIDOS', marginX, currentY);
  currentY += 6;

  // Render ingredients as a clean 2-column or list with checkbox icons
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(35, 30, 25);

  recipe.ingredients.forEach((ing) => {
    checkPageBreak(6);
    // Draw small checkbox square
    doc.setDrawColor(160, 150, 140);
    doc.rect(marginX, currentY - 3, 3, 3);

    const ingText = `${ing.quantity} ${ing.unit} de ${ing.name}${
      ing.storeName ? `  [Tienda: ${ing.storeName}]` : ''
    }`;
    const splitIng = doc.splitTextToSize(ingText, contentWidth - 8);
    doc.text(splitIng, marginX + 6, currentY);
    currentY += splitIng.length * 4.5 + 1.5;
  });

  currentY += 4;

  // --- NUTRITIONAL HIGHLIGHT BAR ---
  if (recipe.nutrition) {
    checkPageBreak(12);
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(230, 225, 220);
    doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 75, 70);
    const nutText = `Valores nutricionales por porción:  Proteínas: ${recipe.nutrition.proteinG}g  |  Carbohidratos: ${recipe.nutrition.carbsG}g  |  Grasas: ${recipe.nutrition.fatG}g  |  Fibra: ${recipe.nutrition.fiberG}g`;
    doc.text(nutText, marginX + 4, currentY + 5.2);
    currentY += 13;
  }

  // --- PREPARATION STEPS (Paso a paso de lectura rápida) ---
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(131, 85, 0);
  doc.text('MODO DE PREPARACIÓN (PASO A PASO)', marginX, currentY);
  currentY += 6;

  recipe.steps.forEach((step) => {
    // Check height needed for step title + description + optional tip
    const stepTitle = `${step.stepNumber}. ${step.title} (${step.durationMinutes} min)`;
    const descLines = doc.splitTextToSize(step.description, contentWidth - 8);
    let needed = 6 + descLines.length * 4.5 + 4;
    let tipLines: string[] = [];
    if (step.tip) {
      tipLines = doc.splitTextToSize(`* Consejo del Chef: ${step.tip}`, contentWidth - 14);
      needed += tipLines.length * 4 + 4;
    }

    checkPageBreak(needed);

    // Step Header Badge
    doc.setFillColor(254, 243, 230);
    doc.roundedRect(marginX, currentY - 3.5, contentWidth, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(131, 85, 0);
    doc.text(stepTitle, marginX + 3, currentY + 0.8);
    currentY += 6;

    // Step Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 35, 30);
    doc.text(descLines, marginX + 4, currentY);
    currentY += descLines.length * 4.2 + 2;

    // Chef Tip Callout
    if (step.tip && tipLines.length > 0) {
      doc.setFillColor(255, 252, 245);
      doc.setDrawColor(224, 159, 62);
      doc.roundedRect(marginX + 4, currentY - 2.5, contentWidth - 8, tipLines.length * 4 + 3, 1, 1, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(140, 90, 20);
      doc.text(tipLines, marginX + 7, currentY + 1);
      currentY += tipLines.length * 4 + 4;
    }

    currentY += 2;
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 215, 210);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 130, 120);
    doc.text(
      'Gusto • Formato digital de lectura rápida (PDF optimizado para cocina y dispositivos)',
      marginX,
      pageHeight - 7
    );

    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // --- TRIGGER BROWSER DOWNLOAD ---
  const safeFilename = `${recipe.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')}_receta_gusto.pdf`;

  doc.save(safeFilename);
};
