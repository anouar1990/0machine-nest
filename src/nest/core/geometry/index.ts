import { Point, Bounds, Contour, Geometry } from '../types';

/**
 * Computes bounding box for a set of points.
 */
export function computeBounds(points: Point[]): Bounds {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

/**
 * Computes bounding box for an entire Geometry object.
 */
export function computeGeometryBounds(geometry: Geometry): Bounds {
  const allPoints: Point[] = [];
  geometry.contours.forEach((c) => allPoints.push(...c));
  geometry.holes.forEach((h) => allPoints.push(...h));
  return computeBounds(allPoints);
}

/**
 * Computes signed area of a polygon contour using the Shoelace formula.
 * Positive = CCW, Negative = CW.
 */
export function computeContourArea(points: Point[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return area / 2;
}

/**
 * Computes total area of geometry (sum of outer contours - sum of holes).
 */
export function computeGeometryArea(contours: Contour[], holes: Contour[]): number {
  let outerArea = 0;
  for (const c of contours) {
    outerArea += Math.abs(computeContourArea(c));
  }

  let holeArea = 0;
  for (const h of holes) {
    holeArea += Math.abs(computeContourArea(h));
  }

  return Math.max(0, outerArea - holeArea);
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon.
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const x = point.x;
  const y = point.y;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Transforms points by translation, scale, and rotation (in degrees) around origin or custom pivot.
 */
export function transformPoints(
  points: Point[],
  tx: number = 0,
  ty: number = 0,
  scaleX: number = 1,
  scaleY: number = 1,
  rotateDeg: number = 0,
  pivotX: number = 0,
  pivotY: number = 0
): Point[] {
  if (!points || points.length === 0) return [];
  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return points.map((p) => {
    // 1. Scale relative to pivot
    const px = (p.x - pivotX) * scaleX;
    const py = (p.y - pivotY) * scaleY;

    // 2. Rotate
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;

    // 3. Translate back + apply global translation
    return {
      x: rx + pivotX + tx,
      y: ry + pivotY + ty,
    };
  });
}

/**
 * Rotates a Geometry object around its bounding box center by a given angle in degrees (0, 90, 180, 270).
 */
export function rotateGeometry(geometry: Geometry, angleDeg: number): Geometry {
  if (angleDeg % 360 === 0) return geometry;

  const bounds = geometry.bounds;
  const cx = bounds.minX + bounds.width / 2;
  const cy = bounds.minY + bounds.height / 2;

  const newContours = geometry.contours.map((c) =>
    transformPoints(c, 0, 0, 1, 1, angleDeg, cx, cy)
  );

  const newHoles = geometry.holes.map((h) =>
    transformPoints(h, 0, 0, 1, 1, angleDeg, cx, cy)
  );

  const newBounds = computeBounds(
    newContours.flat().concat(newHoles.flat())
  );

  // Normalize geometry to start at (0, 0) relative to its new bounds
  const offsetX = -newBounds.minX;
  const offsetY = -newBounds.minY;

  const shiftedContours = newContours.map((c) =>
    c.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }))
  );
  const shiftedHoles = newHoles.map((h) =>
    h.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }))
  );

  const normalizedBounds = computeBounds(
    shiftedContours.flat().concat(shiftedHoles.flat())
  );

  return {
    contours: shiftedContours,
    holes: shiftedHoles,
    bounds: normalizedBounds,
    area: geometry.area,
  };
}

/**
 * Ramer-Douglas-Peucker path simplification.
 * Simplifies a polyline while maintaining geometric accuracy within tolerance (in mm).
 */
export function simplifyContour(points: Point[], tolerance: number = 0.05): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }

  if (maxDist > tolerance && index > 0 && index < end) {
    const recResults1 = simplifyContour(points.slice(0, index + 1), tolerance);
    const recResults2 = simplifyContour(points.slice(index), tolerance);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(p: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - p1.x, p.y - p1.y);
  }

  const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
  const den = Math.hypot(dx, dy);
  return num / den;
}

/**
 * Samples points along a circle into a closed contour.
 */
export function sampleCircle(cx: number, cy: number, r: number, segments: number = 48): Point[] {
  const points: Point[] = [];
  const step = (Math.PI * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const theta = i * step;
    points.push({
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    });
  }
  return points;
}

/**
 * Samples points along an ellipse into a closed contour.
 */
export function sampleEllipse(cx: number, cy: number, rx: number, ry: number, segments: number = 48): Point[] {
  const points: Point[] = [];
  const step = (Math.PI * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const theta = i * step;
    points.push({
      x: cx + rx * Math.cos(theta),
      y: cy + ry * Math.sin(theta),
    });
  }
  return points;
}

/**
 * Samples cubic Bezier curve points.
 */
export function sampleCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  segments: number = 16
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x;
    const y =
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y;
    points.push({ x, y });
  }
  return points;
}

/**
 * Samples quadratic Bezier curve points.
 */
export function sampleQuadraticBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  segments: number = 12
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    points.push({ x, y });
  }
  return points;
}

/**
 * Samples elliptical arc curve points (SVG A/a command).
 */
export function sampleSvgArc(
  p0: Point,
  rx: number,
  ry: number,
  xAxisRotationDeg: number,
  largeArcFlag: boolean,
  sweepFlag: boolean,
  p1: Point,
  segments: number = 24
): Point[] {
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (rx === 0 || ry === 0) {
    return [p1];
  }

  const phi = (xAxisRotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (p0.x - p1.x) / 2;
  const dy2 = (p0.y - p1.y) / 2;

  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const radiicomb = x1pSq / rxSq + y1pSq / rySq;
  if (radiicomb > 1) {
    rx = Math.sqrt(radiicomb) * rx;
    ry = Math.sqrt(radiicomb) * ry;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArcFlag === sweepFlag ? -1 : 1;
  let sq = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  if (sq < 0) sq = 0;
  const coef = sign * Math.sqrt(sq);

  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2;

  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;

  const theta1 = Math.atan2(uy, ux);
  let dTheta = Math.atan2(vy, vx) - theta1;

  if (!sweepFlag && dTheta > 0) {
    dTheta -= 2 * Math.PI;
  } else if (sweepFlag && dTheta < 0) {
    dTheta += 2 * Math.PI;
  }

  const points: Point[] = [];
  const numSteps = Math.max(8, Math.ceil((Math.abs(dTheta) / (Math.PI * 2)) * segments));

  for (let i = 1; i <= numSteps; i++) {
    const angle = theta1 + (i / numSteps) * dTheta;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const x = cosPhi * rx * cosAngle - sinPhi * ry * sinAngle + cx;
    const y = sinPhi * rx * cosAngle + cosPhi * ry * sinAngle + cy;
    points.push({ x, y });
  }

  return points;
}

/**
 * Separating Axis Theorem (SAT) collision test between two simple polygons.
 */
export function doPolygonsIntersect(polyA: Point[], polyB: Point[]): boolean {
  if (polyA.length < 3 || polyB.length < 3) return false;

  const polygons = [polyA, polyB];
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      // Normal vector to edge
      const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x };

      let minA = Infinity, maxA = -Infinity;
      for (const p of polyA) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minA) minA = projected;
        if (projected > maxA) maxA = projected;
      }

      let minB = Infinity, maxB = -Infinity;
      for (const p of polyB) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minB) minB = projected;
        if (projected > maxB) maxB = projected;
      }

      if (maxA < minB || maxB < minA) {
        return false; // Separating axis found -> No collision
      }
    }
  }

  return true; // No separating axis -> Collision!
}
