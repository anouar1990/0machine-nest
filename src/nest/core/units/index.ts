/**
 * Units & Conversion Utility
 * All manufacturing calculations in 0machine Nest MUST use millimeters (mm).
 */

export const DEFAULT_DPI = 96; // Standard web SVG DPI (Inkscape/Figma/Web)
export const MM_PER_INCH = 25.4;
export const MM_PER_PX = MM_PER_INCH / DEFAULT_DPI; // ~0.26458333 mm per px

/**
 * Converts pixels (at standard 96 DPI) to millimeters.
 */
export function pxToMm(px: number, dpi: number = DEFAULT_DPI): number {
  return (px * MM_PER_INCH) / dpi;
}

/**
 * Converts millimeters to pixels (at standard 96 DPI).
 */
export function mmToPx(mm: number, dpi: number = DEFAULT_DPI): number {
  return (mm * dpi) / MM_PER_INCH;
}

/**
 * Converts inches to millimeters.
 */
export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/**
 * Converts centimeters to millimeters.
 */
export function cmToMm(cm: number): number {
  return cm * 10;
}

/**
 * Converts points (1/72 inch) to millimeters.
 */
export function ptToMm(pt: number): number {
  return (pt * MM_PER_INCH) / 72;
}

/**
 * Converts picas (1/6 inch) to millimeters.
 */
export function pcToMm(pc: number): number {
  return (pc * MM_PER_INCH) / 6;
}

/**
 * Parses SVG length string (e.g. "100mm", "10in", "500px", "5cm", "72pt") to millimeters.
 * Returns default value if invalid or empty.
 */
export function parseSvgLengthToMm(val: string | null | undefined, defaultValue: number = 0): number {
  if (!val || typeof val !== 'string') return defaultValue;
  const str = val.trim();
  if (!str) return defaultValue;

  const match = str.match(/^([+-]?\d*(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(mm|cm|in|px|pt|pc|%)?$/);
  if (!match) {
    const num = parseFloat(str);
    return isNaN(num) ? defaultValue : num * MM_PER_PX;
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) return defaultValue;

  const unit = match[2] ? match[2].toLowerCase() : 'px';

  switch (unit) {
    case 'mm':
      return num;
    case 'cm':
      return cmToMm(num);
    case 'in':
      return inchesToMm(num);
    case 'pt':
      return ptToMm(num);
    case 'pc':
      return pcToMm(num);
    case 'px':
    default:
      return pxToMm(num);
  }
}
