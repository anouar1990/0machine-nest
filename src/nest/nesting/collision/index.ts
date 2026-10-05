import { Part, Sheet, Point } from '../../core/types';
import { doPolygonsIntersect, transformPoints } from '../../core/geometry';

/**
 * Calculates perpendicular distance from a point to a line segment.
 */
function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Computes minimum Euclidean distance between two polygons.
 * Returns 0 if polygons intersect.
 */
export function minDistanceBetweenPolygons(polyA: Point[], polyB: Point[]): number {
  if (polyA.length < 3 || polyB.length < 3) return Infinity;

  if (doPolygonsIntersect(polyA, polyB)) {
    return 0;
  }

  let minDist = Infinity;

  // Vertices of A to edges of B
  for (let i = 0; i < polyA.length; i++) {
    for (let j = 0; j < polyB.length; j++) {
      const nextJ = (j + 1) % polyB.length;
      const d = distancePointToSegment(polyA[i], polyB[j], polyB[nextJ]);
      if (d < minDist) minDist = d;
    }
  }

  // Vertices of B to edges of A
  for (let i = 0; i < polyB.length; i++) {
    for (let j = 0; j < polyA.length; j++) {
      const nextJ = (j + 1) % polyA.length;
      const d = distancePointToSegment(polyB[i], polyA[j], polyA[nextJ]);
      if (d < minDist) minDist = d;
    }
  }

  return minDist;
}

/**
 * Gets absolute sheet points for a part given its position and rotation on the sheet.
 */
export function getAbsolutePartContours(part: Part): {
  contours: Point[][];
  holes: Point[][];
} {
  const rot = part.rotation || 0;
  const pos = part.position || { x: 0, y: 0 };

  const bounds = part.geometry.bounds;
  const cx = bounds.minX + bounds.width / 2;
  const cy = bounds.minY + bounds.height / 2;

  const contours = part.geometry.contours.map((c) =>
    transformPoints(c, pos.x, pos.y, 1, 1, rot, cx, cy)
  );

  const holes = part.geometry.holes.map((h) =>
    transformPoints(h, pos.x, pos.y, 1, 1, rot, cx, cy)
  );

  return { contours, holes };
}

/**
 * Checks if a part falls outside the printable boundary of the sheet (considering margin).
 * Returns true if part is OUT OF BOUNDS or collides with margins.
 */
export function checkSheetCollision(part: Part, sheet: Sheet): boolean {
  const margin = sheet.margin || 0;
  const minX = margin;
  const minY = margin;
  const maxX = sheet.width - margin;
  const maxY = sheet.height - margin;

  const { contours } = getAbsolutePartContours(part);
  const allPoints = contours.flat();

  for (const pt of allPoints) {
    if (pt.x < minX - 1e-4 || pt.x > maxX + 1e-4 || pt.y < minY - 1e-4 || pt.y > maxY + 1e-4) {
      return true; // Out of sheet printable bounds
    }
  }

  return false;
}

/**
 * Checks if two parts on the sheet overlap or breach the required minimum part spacing.
 */
export function checkPartCollision(partA: Part, partB: Part, spacingMm: number = 0): boolean {
  if (partA.id === partB.id) return false;

  const { contours: contoursA } = getAbsolutePartContours(partA);
  const { contours: contoursB } = getAbsolutePartContours(partB);

  // Quick broad-phase bounding box rejection
  const allA = contoursA.flat();
  const allB = contoursB.flat();

  let minAx = Infinity, minAy = Infinity, maxAx = -Infinity, maxAy = -Infinity;
  for (const p of allA) {
    if (p.x < minAx) minAx = p.x;
    if (p.y < minAy) minAy = p.y;
    if (p.x > maxAx) maxAx = p.x;
    if (p.y > maxAy) maxAy = p.y;
  }

  let minBx = Infinity, minBy = Infinity, maxBx = -Infinity, maxBy = -Infinity;
  for (const p of allB) {
    if (p.x < minBx) minBx = p.x;
    if (p.y < minBy) minBy = p.y;
    if (p.x > maxBx) maxBx = p.x;
    if (p.y > maxBy) maxBy = p.y;
  }

  if (
    maxAx + spacingMm < minBx - 1e-4 ||
    minAx - spacingMm > maxBx + 1e-4 ||
    maxAy + spacingMm < minBy - 1e-4 ||
    minAy - spacingMm > maxBy + 1e-4
  ) {
    return false; // Broad phase: distance is greater than spacingMm
  }

  // Narrow phase: True-Shape Polygon Distance & Intersection
  for (const polyA of contoursA) {
    for (const polyB of contoursB) {
      const dist = minDistanceBetweenPolygons(polyA, polyB);
      if (dist < spacingMm - 1e-4) {
        return true; // Clearance breached or overlap detected
      }
    }
  }

  return false;
}
