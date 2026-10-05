import { Geometry, ValidationResult } from '../types';
import { computeContourArea } from '../geometry';

/**
 * Validates internal geometry representation for manufacturing correctness.
 */
export function validateGeometry(geometry: Geometry): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!geometry) {
    return {
      isValid: false,
      errors: [
        'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\nPlease verify the design in your design software.',
      ],
      warnings: [],
    };
  }

  if (!geometry.contours || geometry.contours.length === 0) {
    errors.push(
      'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\nPlease verify the design in your design software.'
    );
  } else {
    let hasValidPoints = false;
    for (const contour of geometry.contours) {
      if (contour.length >= 3) {
        hasValidPoints = true;
        const area = Math.abs(computeContourArea(contour));
        if (area < 0.01) {
          warnings.push('Part contour has extremely small or zero surface area.');
        }

        // Check for NaN or Infinity coordinates
        for (const pt of contour) {
          if (isNaN(pt.x) || isNaN(pt.y) || !isFinite(pt.x) || !isFinite(pt.y)) {
            errors.push('Geometry contains invalid non-numeric coordinates (NaN/Infinity).');
            break;
          }
        }
      }
    }

    if (!hasValidPoints) {
      errors.push('No closed cutting paths with at least 3 vertices found in design.');
    }
  }

  if (geometry.bounds) {
    if (geometry.bounds.width <= 0 || geometry.bounds.height <= 0) {
      errors.push('Part geometry has zero width or height dimensions.');
    }
  }

  if (geometry.area <= 0) {
    errors.push('Calculated cutting area is zero or negative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
