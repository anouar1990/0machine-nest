import { Part, Sheet } from '../core/types';
import { checkPartCollision, checkSheetCollision } from '../nesting/collision';

export interface PreExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  partsCount: number;
  sheetsCount: number;
}

/**
 * Performs strict production validation on nested layout before SVG export.
 */
export function validatePreExport(parts: Part[], sheet: Sheet, sheets: Sheet[] = [sheet]): PreExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parts || parts.length === 0) {
    errors.push('Layout is empty. Import parts before exporting.');
    return {
      isValid: false,
      errors,
      warnings,
      partsCount: 0,
      sheetsCount: sheets.length,
    };
  }

  // 1. Sheet Dimensions Check
  if (sheet.width <= 0 || sheet.height <= 0) {
    errors.push(`Invalid sheet dimensions (${sheet.width}mm x ${sheet.height}mm). Sheet width and height must be > 0.`);
  }

  // 2. Out of bounds check per sheet
  let totalOutOfBounds = 0;
  parts.forEach((part) => {
    const activeSheet = sheets[part.sheetIndex || 0] || sheet;
    const isOutOfBounds = checkSheetCollision(part, activeSheet);
    if (isOutOfBounds) {
      totalOutOfBounds++;
    }
  });

  if (totalOutOfBounds > 0) {
    errors.push(`${totalOutOfBounds} part(s) exceed sheet boundaries or margin limits.`);
  }

  // 3. Overlap / Collision Check
  let overlapCount = 0;
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const partA = parts[i];
      const partB = parts[j];
      // Only check collision if on same sheet
      if ((partA.sheetIndex || 0) === (partB.sheetIndex || 0)) {
        if (checkPartCollision(partA, partB, 0)) {
          overlapCount++;
        }
      }
    }
  }

  if (overlapCount > 0) {
    errors.push(`${overlapCount} part pair(s) overlap on the sheet.`);
  }

  // 4. Spacing warnings (if clearance is less than target sheet spacing)
  let clearanceWarningCount = 0;
  if (sheet.spacing > 0) {
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const partA = parts[i];
        const partB = parts[j];
        if ((partA.sheetIndex || 0) === (partB.sheetIndex || 0)) {
          if (checkPartCollision(partA, partB, sheet.spacing)) {
            clearanceWarningCount++;
          }
        }
      }
    }
  }

  if (clearanceWarningCount > overlapCount) {
    warnings.push(`${clearanceWarningCount - overlapCount} part pair(s) do not maintain full ${sheet.spacing}mm spacing clearance.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    partsCount: parts.length,
    sheetsCount: sheets.length,
  };
}
