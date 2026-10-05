import { Part, Sheet } from '../../core/types';

/**
 * Grid-based shelf placement algorithm for arranging parts on a sheet.
 * Places parts starting from top-left margin, creating rows based on maximum item height in line.
 */
export function autoArrangePartsOnSheet(parts: Part[], sheet: Sheet): Part[] {
  if (!parts || parts.length === 0) return [];

  const margin = sheet.margin || 5;
  const spacing = sheet.spacing || 3;
  const sheetW = sheet.width;

  let currentX = margin;
  let currentY = margin;
  let rowMaxHeight = 0;

  return parts.map((part) => {
    // If locked, maintain its current position
    if (part.locked) {
      return part;
    }

    const w = part.width;
    const h = part.height;

    // Check if part fits in current row
    if (currentX + w > sheetW - margin) {
      // Move to next row
      currentX = margin;
      currentY += rowMaxHeight + spacing;
      rowMaxHeight = 0;
    }

    // Assign position
    const placedX = currentX;
    const placedY = currentY;

    // Update next position cursor
    currentX += w + spacing;
    if (h > rowMaxHeight) {
      rowMaxHeight = h;
    }

    return {
      ...part,
      position: {
        x: placedX,
        y: placedY,
      },
    };
  });
}
