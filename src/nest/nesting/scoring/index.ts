import { Part, Sheet, NestingScore } from '../../core/types';
import { checkSheetCollision, checkPartCollision } from '../collision';

/**
 * Calculates real-time Nesting Score, material utilization, waste percentage, and cost metrics.
 */
export function calculateNestingScore(parts: Part[], sheet: Sheet): NestingScore {
  const margin = sheet.margin || 0;
  const printableWidth = Math.max(0, sheet.width - 2 * margin);
  const printableHeight = Math.max(0, sheet.height - 2 * margin);
  const sheetUsableAreaMm2 = printableWidth * printableHeight;
  const sheetTotalAreaMm2 = sheet.width * sheet.height;

  if (parts.length === 0 || sheetUsableAreaMm2 <= 0) {
    return {
      score: 0,
      wastePercentage: 100,
      utilizationPercentage: 0,
      totalPartsPlaced: 0,
      totalPartsAvailable: 0,
      areaUsedMm2: 0,
      sheetUsableAreaMm2,
      materialSavedEur: 0,
      sheetCount: 1,
      sheetResults: [],
    };
  }

  let totalPartsAvailable = 0;
  let totalPartsPlaced = 0;
  let areaUsedMm2 = 0;
  let outOfBoundsCount = 0;
  let collisionCount = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const qty = part.quantity || 1;
    totalPartsAvailable += qty;

    const isOob = checkSheetCollision(part, sheet);
    if (isOob) {
      outOfBoundsCount++;
    }

    // Check collisions against other parts
    for (let j = i + 1; j < parts.length; j++) {
      if (checkPartCollision(part, parts[j], sheet.spacing || 0)) {
        collisionCount++;
      }
    }

    if (!isOob) {
      totalPartsPlaced += qty;
      areaUsedMm2 += part.area * qty;
    }
  }

  // Calculate raw utilization percentage
  const rawUtilization = Math.min(100, (areaUsedMm2 / sheetUsableAreaMm2) * 100);
  const wastePercentage = Math.max(0, 100 - rawUtilization);

  // Base score comes directly from utilization %
  let score = Math.round(rawUtilization);

  // Apply penalties for out-of-bounds or overlapping parts
  if (outOfBoundsCount > 0) {
    score = Math.max(0, score - outOfBoundsCount * 15);
  }
  if (collisionCount > 0) {
    score = Math.max(0, score - collisionCount * 10);
  }

  // Material cost saved estimate (€)
  const pricePerSheet = sheet.materialPricePerSheet || 15.0;
  const pricePerMm2 = pricePerSheet / sheetTotalAreaMm2;
  const materialSavedEur = parseFloat((areaUsedMm2 * pricePerMm2).toFixed(2));

  return {
    score: Math.min(100, Math.max(0, score)),
    wastePercentage: parseFloat(wastePercentage.toFixed(1)),
    utilizationPercentage: parseFloat(rawUtilization.toFixed(1)),
    totalPartsPlaced,
    totalPartsAvailable,
    areaUsedMm2,
    sheetUsableAreaMm2,
    materialSavedEur,
    sheetCount: 1,
    sheetResults: [
      {
        sheetIndex: 1,
        sheet,
        parts,
        utilizationPercentage: parseFloat(rawUtilization.toFixed(1)),
        wastePercentage: parseFloat(wastePercentage.toFixed(1)),
        score: Math.min(100, Math.max(0, score)),
        areaUsedMm2,
      },
    ],
  };
}
