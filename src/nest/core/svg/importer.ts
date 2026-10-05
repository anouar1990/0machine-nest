import { DesignImporter } from './importerAbstraction';
import { NormalizedDesign, Geometry, Contour, Point } from '../types';
import { sanitizeSvgText, sanitizeSvgElement } from './sanitizer';
import { parseSvgPathToContours } from './pathParser';
import { parseSvgLengthToMm, MM_PER_PX } from '../units';
import {
  computeBounds,
  computeContourArea,
  computeGeometryArea,
  isPointInPolygon,
  sampleCircle,
  sampleEllipse,
  simplifyContour,
} from '../geometry';
import { DOMParser } from '@xmldom/xmldom';

/**
 * 2D Matrix for SVG transform accumulation
 */
type Matrix = [number, number, number, number, number, number];

function identityMatrix(): Matrix {
  return [1, 0, 0, 1, 0, 0];
}

function multiplyMatrix(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMatrixToPoint(p: Point, m: Matrix): Point {
  return {
    x: m[0] * p.x + m[2] * p.y + m[4],
    y: m[1] * p.x + m[3] * p.y + m[5],
  };
}

function parseTransformAttribute(transformStr: string | null): Matrix {
  if (!transformStr) return identityMatrix();

  let matrix = identityMatrix();
  const regex = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]+)\)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(transformStr)) !== null) {
    const type = match[1].toLowerCase();
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    let m: Matrix = identityMatrix();

    if (type === 'matrix' && args.length >= 6) {
      m = [args[0], args[1], args[2], args[3], args[4], args[5]];
    } else if (type === 'translate') {
      const tx = args[0] || 0;
      const ty = args.length > 1 ? args[1] : 0;
      m = [1, 0, 0, 1, tx, ty];
    } else if (type === 'scale') {
      const sx = args[0] || 1;
      const sy = args.length > 1 ? args[1] : sx;
      m = [sx, 0, 0, sy, 0, 0];
    } else if (type === 'rotate') {
      const angleDeg = args[0] || 0;
      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        m = [
          cos,
          sin,
          -sin,
          cos,
          cx - cx * cos + cy * sin,
          cy - cx * sin - cy * cos,
        ];
      } else {
        m = [cos, sin, -sin, cos, 0, 0];
      }
    }

    matrix = multiplyMatrix(matrix, m);
  }

  return matrix;
}

/**
 * Concrete SVG Design Importer implementing DesignImporter interface.
 */
export class SvgImporter implements DesignImporter {
  canImport(file: File): boolean {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return name.endsWith('.svg') || file.type === 'image/svg+xml';
  }

  async import(file: File): Promise<NormalizedDesign> {
    const fileName = file.name || 'untitled.svg';
    try {
      const text = await file.text();
      return this.parseSvgString(text, fileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return {
        fileName,
        parts: [],
        errors: [`Could not read file: ${msg}`],
      };
    }
  }

  /**
   * Parses raw SVG string into NormalizedDesign geometry in millimeters.
   */
  parseSvgString(rawSvg: string, fileName: string = 'design.svg'): NormalizedDesign {
    const warnings: string[] = [];

    const sanitizedSvg = sanitizeSvgText(rawSvg);
    if (!sanitizedSvg.trim()) {
      return {
        fileName,
        parts: [],
        errors: [
          'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\ visual verification recommended in your CAD software.',
        ],
      };
    }

    let doc: Document;
    try {
      if (typeof window !== 'undefined' && window.DOMParser) {
        doc = new window.DOMParser().parseFromString(sanitizedSvg, 'image/svg+xml');
      } else {
        doc = new DOMParser().parseFromString(sanitizedSvg, 'image/svg+xml') as unknown as Document;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Syntax error';
      return {
        fileName,
        parts: [],
        errors: [`Failed to parse SVG XML: ${msg}`],
      };
    }

    const svgEl = doc.documentElement;
    if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') {
      return {
        fileName,
        parts: [],
        errors: ['Invalid SVG file: root <svg> element missing.'],
      };
    }

    // Sanitize DOM tree recursively
    sanitizeSvgElement(svgEl as unknown as Element);

    // Calculate document unit scale factor to Millimeters
    let scaleToMm = MM_PER_PX;

    const widthAttr = svgEl.getAttribute('width');
    const heightAttr = svgEl.getAttribute('height');
    const viewBoxAttr = svgEl.getAttribute('viewBox');

    let viewBoxWidth: number | null = null;
    let viewBoxHeight: number | null = null;

    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map((v) => parseFloat(v));
      if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
        viewBoxWidth = parts[2];
        viewBoxHeight = parts[3];
      }
    }

    if (widthAttr) {
      const widthMm = parseSvgLengthToMm(widthAttr, 0);
      if (widthMm > 0 && viewBoxWidth && viewBoxWidth > 0) {
        scaleToMm = widthMm / viewBoxWidth;
      } else if (widthMm > 0) {
        scaleToMm = 1.0; // explicit mm in width
      }
    } else if (heightAttr) {
      const heightMm = parseSvgLengthToMm(heightAttr, 0);
      if (heightMm > 0 && viewBoxHeight && viewBoxHeight > 0) {
        scaleToMm = heightMm / viewBoxHeight;
      } else if (heightMm > 0) {
        scaleToMm = 1.0;
      }
    }

    // Collect all polylines across elements
    const rawPolylines: Point[][] = [];
    this.extractElementGeometry(
      svgEl as unknown as Element,
      identityMatrix(),
      rawPolylines,
      warnings
    );

    if (rawPolylines.length === 0) {
      return {
        fileName,
        parts: [],
        errors: [
          'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\nPlease verify the design in your design software.',
        ],
        warnings,
      };
    }

    // Convert raw polylines to MM and simplify slightly
    const mmPolylines: Point[][] = rawPolylines
      .map((poly) =>
        poly.map((p) => ({
          x: p.x * scaleToMm,
          y: p.y * scaleToMm,
        }))
      )
      .map((poly) => simplifyContour(poly, 0.01))
      .filter((poly) => poly.length >= 3);

    if (mmPolylines.length === 0) {
      return {
        fileName,
        parts: [],
        errors: ['No valid closed cutting contours found in SVG.'],
        warnings,
      };
    }

    // Separate outer contours vs holes using polygon containment
    const { contours, holes } = this.classifyContoursAndHoles(mmPolylines);

    if (contours.length === 0) {
      return {
        fileName,
        parts: [],
        errors: ['No outer cut boundaries found in geometry.'],
        warnings,
      };
    }

    // Normalize geometry bounds relative to (0, 0)
    const allPts = contours.flat().concat(holes.flat());
    const bounds = computeBounds(allPts);

    const normalizedContours = contours.map((c) =>
      c.map((p) => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
    );
    const normalizedHoles = holes.map((h) =>
      h.map((p) => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
    );

    const normalizedBounds = computeBounds(
      normalizedContours.flat().concat(normalizedHoles.flat())
    );

    const totalArea = computeGeometryArea(normalizedContours, normalizedHoles);

    if (totalArea <= 0.001 || normalizedBounds.width <= 0 || normalizedBounds.height <= 0) {
      return {
        fileName,
        parts: [],
        errors: ['Imported geometry has zero area or invalid dimensions.'],
        warnings,
      };
    }

    const geometry: Geometry = {
      contours: normalizedContours,
      holes: normalizedHoles,
      bounds: normalizedBounds,
      area: totalArea,
    };

    return {
      fileName,
      parts: [
        {
          geometry,
          width: normalizedBounds.width,
          height: normalizedBounds.height,
          area: totalArea,
          name: fileName.replace(/\.svg$/i, ''),
        },
      ],
      warnings,
    };
  }

  /**
   * Recursively traverses SVG DOM tree to extract geometry polylines from elements.
   */
  private extractElementGeometry(
    element: Element,
    parentMatrix: Matrix,
    polylines: Point[][],
    warnings: string[]
  ) {
    if (!element || !element.tagName) return;

    const transformAttr = element.getAttribute ? element.getAttribute('transform') : null;
    const localMatrix = parseTransformAttribute(transformAttr);
    const currentMatrix = multiplyMatrix(parentMatrix, localMatrix);

    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'path': {
        const d = element.getAttribute('d');
        if (d) {
          const subPaths = parseSvgPathToContours(d);
          for (const sp of subPaths) {
            const transformed = sp.map((p) => applyMatrixToPoint(p, currentMatrix));
            if (transformed.length >= 3) polylines.push(transformed);
          }
        }
        break;
      }

      case 'rect': {
        const x = parseFloat(element.getAttribute('x') || '0');
        const y = parseFloat(element.getAttribute('y') || '0');
        const w = parseFloat(element.getAttribute('width') || '0');
        const h = parseFloat(element.getAttribute('height') || '0');
        if (w > 0 && h > 0) {
          const pts = [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
            { x, y },
          ].map((p) => applyMatrixToPoint(p, currentMatrix));
          polylines.push(pts);
        }
        break;
      }

      case 'circle': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const r = parseFloat(element.getAttribute('r') || '0');
        if (r > 0) {
          const pts = sampleCircle(cx, cy, r).map((p) =>
            applyMatrixToPoint(p, currentMatrix)
          );
          polylines.push(pts);
        }
        break;
      }

      case 'ellipse': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const rx = parseFloat(element.getAttribute('rx') || '0');
        const ry = parseFloat(element.getAttribute('ry') || '0');
        if (rx > 0 && ry > 0) {
          const pts = sampleEllipse(cx, cy, rx, ry).map((p) =>
            applyMatrixToPoint(p, currentMatrix)
          );
          polylines.push(pts);
        }
        break;
      }

      case 'line': {
        warnings.push('Open line element skipped (cutting paths must form closed loops).');
        break;
      }

      case 'polygon':
      case 'polyline': {
        const pointsStr = element.getAttribute('points');
        if (pointsStr) {
          const nums = pointsStr
            .trim()
            .split(/[\s,]+/)
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v));

          const pts: Point[] = [];
          for (let i = 0; i < nums.length - 1; i += 2) {
            pts.push(applyMatrixToPoint({ x: nums[i], y: nums[i + 1] }, currentMatrix));
          }
          if (pts.length >= 3) {
            if (
              tagName === 'polygon' &&
              (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y)
            ) {
              pts.push({ ...pts[0] });
            }
            polylines.push(pts);
          }
        }
        break;
      }

      case 'g':
      case 'svg':
      default:
        break;
    }

    // Traverse element children safely across DOMParser environments
    const childNodes = element.children
      ? Array.from(element.children)
      : Array.from(element.childNodes || []).filter((n: Node) => n.nodeType === 1);

    for (const child of childNodes) {
      this.extractElementGeometry(child as unknown as Element, currentMatrix, polylines, warnings);
    }
  }

  /**
   * Classifies polylines into outer contours vs inner cutouts (holes) using polygon containment.
   */
  private classifyContoursAndHoles(polylines: Point[][]): {
    contours: Contour[];
    holes: Contour[];
  } {
    // Sort polylines by absolute area descending
    const items = polylines
      .map((pts) => ({
        points: pts,
        area: Math.abs(computeContourArea(pts)),
      }))
      .filter((item) => item.area > 0.001)
      .sort((a, b) => b.area - a.area);

    const contours: Contour[] = [];
    const holes: Contour[] = [];

    for (let i = 0; i < items.length; i++) {
      const candidate = items[i];
      let parentCount = 0;

      // Count how many outer polylines contain candidate's first point
      const testPoint = candidate.points[0];
      for (let j = 0; j < i; j++) {
        if (isPointInPolygon(testPoint, items[j].points)) {
          parentCount++;
        }
      }

      // Even parent depth = Outer Contour, Odd parent depth = Hole
      if (parentCount % 2 === 0) {
        contours.push(candidate.points);
      } else {
        holes.push(candidate.points);
      }
    }

    return { contours, holes };
  }
}
