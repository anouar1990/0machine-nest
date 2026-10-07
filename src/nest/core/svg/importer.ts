import { DesignImporter } from './importerAbstraction';
import { NormalizedDesign, Geometry, Contour, Point, Bounds } from '../types';
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
  doPolygonsIntersect,
} from '../geometry';
import { minDistanceBetweenPolygons } from '../../nesting/collision';
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

type GroupInfo = {
  element: Element;
  id?: string;
  label?: string;
  isLayerOrRoot: boolean;
};

type ExtractedPolyline = {
  points: Point[]; // in mm
  area: number;
  bounds: Bounds;
  groupAncestors: GroupInfo[];
  elementId?: string;
};

type TopologicalComponent = {
  id: number;
  outerContours: Contour[];
  holes: Contour[];
  allPoints: Point[];
  bounds: Bounds;
  area: number;
  groupAncestors: GroupInfo[];
  primaryGroupId?: string;
  primaryGroupName?: string;
};

function checkIsLayerOrRootGroup(element: Element, isRoot: boolean): boolean {
  if (isRoot) return true;
  const tag = element.tagName ? element.tagName.toLowerCase() : '';
  if (tag === 'svg') return true;

  const groupMode = element.getAttribute('inkscape:groupmode');
  if (groupMode && groupMode.toLowerCase() === 'layer') return true;

  const id = (element.getAttribute('id') || '').toLowerCase().trim();
  if (!id) return false;

  if (/^(layer[_\-\d]*|svg[_\-\d]*|root|viewport|artboard|canvas|document|designs|parts)$/i.test(id)) {
    return true;
  }

  return false;
}

function doBoundsOverlap(b1: Bounds, b2: Bounds, margin: number = 0.1): boolean {
  return !(
    b1.maxX + margin < b2.minX ||
    b1.minX - margin > b2.maxX ||
    b1.maxY + margin < b2.minY ||
    b1.minY - margin > b2.maxY
  );
}

function formatPartName(rawName: string): string {
  return rawName
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Concrete SVG Design Importer implementing DesignImporter interface.
 * Supports multi-design grouping, decomposition, hole classification, and transform flattening.
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
          'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\nPlease verify the design in your design software.',
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

    // Extract all closed polylines with parent group hierarchy & transform matrices
    const extractedPolylines: ExtractedPolyline[] = [];
    this.extractElementGeometry(
      svgEl as unknown as Element,
      identityMatrix(),
      [],
      extractedPolylines,
      scaleToMm,
      warnings,
      true
    );

    if (extractedPolylines.length === 0) {
      return {
        fileName,
        parts: [],
        errors: [
          'Could not import this SVG.\n\nThe file contains invalid or empty cutting geometry.\n\nPlease verify the design in your design software.',
        ],
        warnings,
      };
    }

    // Classify polylines into topological components (Outer contours + Holes)
    const topologicalComponents = this.classifyTopologicalComponents(extractedPolylines);

    if (topologicalComponents.length === 0) {
      return {
        fileName,
        parts: [],
        errors: ['No outer cut boundaries found in geometry.'],
        warnings,
      };
    }

    // Group topological components into candidate physical Parts
    const candidateParts = this.groupComponentsIntoParts(
      topologicalComponents,
      fileName
    );

    if (candidateParts.length === 0) {
      return {
        fileName,
        parts: [],
        errors: ['Imported geometry has zero area or invalid dimensions.'],
        warnings,
      };
    }

    return {
      fileName,
      parts: candidateParts,
      warnings,
    };
  }

  /**
   * Recursively traverses SVG DOM tree to extract geometry polylines with group ancestry & transforms.
   */
  private extractElementGeometry(
    element: Element,
    parentMatrix: Matrix,
    groupStack: GroupInfo[],
    polylines: ExtractedPolyline[],
    scaleToMm: number,
    warnings: string[],
    isRoot: boolean = false
  ) {
    if (!element || !element.tagName) return;

    const transformAttr = element.getAttribute ? element.getAttribute('transform') : null;
    const localMatrix = parseTransformAttribute(transformAttr);
    const currentMatrix = multiplyMatrix(parentMatrix, localMatrix);

    const tagName = element.tagName.toLowerCase();
    const currentGroupStack = [...groupStack];

    if (tagName === 'g' || tagName === 'svg') {
      const id = element.getAttribute('id') || undefined;
      const label =
        element.getAttribute('inkscape:label') ||
        element.getAttribute('name') ||
        element.getAttribute('data-name') ||
        id;

      const isLayerOrRoot = checkIsLayerOrRootGroup(element, isRoot);
      currentGroupStack.push({
        element,
        id,
        label: label || undefined,
        isLayerOrRoot,
      });
    }

    const processPoints = (ptsInSvgSpace: Point[], elemId?: string) => {
      // Transform to canvas mm coordinates
      const mmPoints = ptsInSvgSpace.map((p) => {
        const transformed = applyMatrixToPoint(p, currentMatrix);
        return {
          x: transformed.x * scaleToMm,
          y: transformed.y * scaleToMm,
        };
      });

      const simplified = simplifyContour(mmPoints, 0.01);
      if (simplified.length >= 3) {
        const area = Math.abs(computeContourArea(simplified));
        if (area > 0.001) {
          polylines.push({
            points: simplified,
            area,
            bounds: computeBounds(simplified),
            groupAncestors: [...currentGroupStack],
            elementId: elemId,
          });
        }
      }
    };

    switch (tagName) {
      case 'path': {
        const d = element.getAttribute('d');
        const elemId = element.getAttribute('id') || undefined;
        if (d) {
          const subPaths = parseSvgPathToContours(d);
          for (const sp of subPaths) {
            if (sp.length >= 3) {
              processPoints(sp, elemId);
            }
          }
        }
        break;
      }

      case 'rect': {
        const x = parseFloat(element.getAttribute('x') || '0');
        const y = parseFloat(element.getAttribute('y') || '0');
        const w = parseFloat(element.getAttribute('width') || '0');
        const h = parseFloat(element.getAttribute('height') || '0');
        const elemId = element.getAttribute('id') || undefined;
        if (w > 0 && h > 0) {
          const pts = [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
            { x, y },
          ];
          processPoints(pts, elemId);
        }
        break;
      }

      case 'circle': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const r = parseFloat(element.getAttribute('r') || '0');
        const elemId = element.getAttribute('id') || undefined;
        if (r > 0) {
          const pts = sampleCircle(cx, cy, r);
          processPoints(pts, elemId);
        }
        break;
      }

      case 'ellipse': {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const rx = parseFloat(element.getAttribute('rx') || '0');
        const ry = parseFloat(element.getAttribute('ry') || '0');
        const elemId = element.getAttribute('id') || undefined;
        if (rx > 0 && ry > 0) {
          const pts = sampleEllipse(cx, cy, rx, ry);
          processPoints(pts, elemId);
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
        const elemId = element.getAttribute('id') || undefined;
        if (pointsStr) {
          const nums = pointsStr
            .trim()
            .split(/[\s,]+/)
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v));

          const pts: Point[] = [];
          for (let i = 0; i < nums.length - 1; i += 2) {
            pts.push({ x: nums[i], y: nums[i + 1] });
          }
          if (pts.length >= 3) {
            if (
              tagName === 'polygon' &&
              (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y)
            ) {
              pts.push({ ...pts[0] });
            }
            processPoints(pts, elemId);
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
      this.extractElementGeometry(
        child as unknown as Element,
        currentMatrix,
        currentGroupStack,
        polylines,
        scaleToMm,
        warnings,
        false
      );
    }
  }

  /**
   * Classifies polylines into topological components (Outer Contours + Holes).
   * Ensures holes/cutouts are strictly topologically bound to their surrounding outer boundary.
   */
  private classifyTopologicalComponents(
    polylines: ExtractedPolyline[]
  ): TopologicalComponent[] {
    // Sort polylines by absolute area descending
    const items = [...polylines].sort((a, b) => b.area - a.area);
    const n = items.length;

    const parentIndex = new Array<number | null>(n).fill(null);
    const depth = new Array<number>(n).fill(0);

    // Build containment tree with strict containment verification
    for (let i = 0; i < n; i++) {
      const candidate = items[i];
      const cBounds = candidate.bounds;

      // Find innermost parent strictly containing candidate
      for (let j = i - 1; j >= 0; j--) {
        const pBounds = items[j].bounds;

        // Broad phase: Bounding box of candidate must be inside parent bounding box
        if (
          cBounds.minX >= pBounds.minX - 1e-3 &&
          cBounds.maxX <= pBounds.maxX + 1e-3 &&
          cBounds.minY >= pBounds.minY - 1e-3 &&
          cBounds.maxY <= pBounds.maxY + 1e-3
        ) {
          // Narrow phase: Test representative points (start, mid, 3/4) inside parent polygon
          const pts = candidate.points;
          const p1 = pts[0];
          const p2 = pts[Math.floor(pts.length / 2)];
          const p3 = pts[Math.floor(pts.length / 4)];

          if (
            isPointInPolygon(p1, items[j].points) &&
            isPointInPolygon(p2, items[j].points) &&
            isPointInPolygon(p3, items[j].points)
          ) {
            parentIndex[i] = j;
            depth[i] = depth[j] + 1;
            break;
          }
        }
      }
    }

    // Map root polylines (depth 0) to Topological Component buckets
    const rootComponentMap = new Map<number, TopologicalComponent>();
    let componentIdCounter = 0;

    for (let i = 0; i < n; i++) {
      const item = items[i];

      // Trace back to root polyline at depth 0
      let rootIdx = i;
      while (parentIndex[rootIdx] !== null) {
        rootIdx = parentIndex[rootIdx]!;
      }

      let comp = rootComponentMap.get(rootIdx);
      if (!comp) {
        // Innermost (leaf) non-layer design group for this component root
        const rootItem = items[rootIdx];
        let primaryGroupId: string | undefined;
        let primaryGroupName: string | undefined;

        for (let g = rootItem.groupAncestors.length - 1; g >= 0; g--) {
          const group = rootItem.groupAncestors[g];
          if (!group.isLayerOrRoot) {
            primaryGroupId = group.id;
            primaryGroupName = group.label || group.id;
            break;
          }
        }

        comp = {
          id: componentIdCounter++,
          outerContours: [],
          holes: [],
          allPoints: [],
          bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
          area: 0,
          groupAncestors: rootItem.groupAncestors,
          primaryGroupId,
          primaryGroupName,
        };
        rootComponentMap.set(rootIdx, comp);
      }

      // Even depth = Outer Contour, Odd depth = Hole
      if (depth[i] % 2 === 0) {
        comp.outerContours.push(item.points);
      } else {
        comp.holes.push(item.points);
      }
    }

    const components = Array.from(rootComponentMap.values());

    // Finalize bounds and area for each component
    for (const comp of components) {
      comp.allPoints = comp.outerContours.flat().concat(comp.holes.flat());
      comp.bounds = computeBounds(comp.allPoints);
      comp.area = computeGeometryArea(comp.outerContours, comp.holes);
    }

    return components.filter(
      (c) => c.outerContours.length > 0 && c.area > 0.001
    );
  }

  /**
   * Groups topological components into independent candidate physical Parts.
   * Hierarchy of evidence:
   * 1. Innermost explicit meaningful SVG group (<g>)
   * 2. Geometric connectivity / overlap / touch
   * 3. Fallback: Independent physical parts
   */
  private groupComponentsIntoParts(
    components: TopologicalComponent[],
    fileName: string
  ): Array<{
    geometry: Geometry;
    width: number;
    height: number;
    area: number;
    name?: string;
  }> {
    const k = components.length;
    if (k === 0) return [];

    // Union-Find data structure for merging components
    const parent = Array.from({ length: k }, (_, i) => i);
    const find = (i: number): number => {
      if (parent[i] === i) return i;
      return (parent[i] = find(parent[i]));
    };
    const union = (i: number, j: number) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    };

    // Pairwise merging based on innermost SVG design group or geometric connectivity
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const cA = components[i];
        const cB = components[j];

        // 1. Innermost (Leaf) Design Group (<g>) Match
        if (
          cA.primaryGroupId &&
          cB.primaryGroupId &&
          cA.primaryGroupId === cB.primaryGroupId
        ) {
          union(i, j);
          continue;
        }

        // 2. Geometric Connectivity / Overlap / Touch
        if (doBoundsOverlap(cA.bounds, cB.bounds, 0.1)) {
          let touch = false;
          for (const polyA of cA.outerContours) {
            for (const polyB of cB.outerContours) {
              if (doPolygonsIntersect(polyA, polyB)) {
                touch = true;
                break;
              }
              const dist = minDistanceBetweenPolygons(polyA, polyB);
              if (dist <= 0.05) {
                touch = true;
                break;
              }
            }
            if (touch) break;
          }

          if (touch) {
            union(i, j);
          }
        }
      }
    }

    // Group components by root set
    const partBuckets = new Map<number, TopologicalComponent[]>();
    for (let i = 0; i < k; i++) {
      const root = find(i);
      if (!partBuckets.has(root)) {
        partBuckets.set(root, []);
      }
      partBuckets.get(root)!.push(components[i]);
    }

    const baseName = fileName.replace(/\.svg$/i, '');
    const candidateBuckets = Array.from(partBuckets.values());

    // Sort candidate buckets by spatial position (top-to-bottom, left-to-right) for stable ordering
    candidateBuckets.sort((bA, bB) => {
      const minYA = Math.min(...bA.map((c) => c.bounds.minY));
      const minYB = Math.min(...bB.map((c) => c.bounds.minY));
      if (Math.abs(minYA - minYB) > 1e-2) return minYA - minYB;
      const minXA = Math.min(...bA.map((c) => c.bounds.minX));
      const minXB = Math.min(...bB.map((c) => c.bounds.minX));
      return minXA - minXB;
    });

    const results: Array<{
      geometry: Geometry;
      width: number;
      height: number;
      area: number;
      name?: string;
    }> = [];

    let partIndex = 1;

    for (const groupComps of candidateBuckets) {
      const allContours = groupComps.flatMap((c) => c.outerContours);
      const allHoles = groupComps.flatMap((c) => c.holes);
      const allPts = groupComps.flatMap((c) => c.allPoints);

      if (allPts.length === 0 || allContours.length === 0) continue;

      const bounds = computeBounds(allPts);
      if (bounds.width <= 0 || bounds.height <= 0) continue;

      // Normalize points to origin (0, 0)
      const normalizedContours = allContours.map((c) =>
        c.map((p) => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
      );
      const normalizedHoles = allHoles.map((h) =>
        h.map((p) => ({ x: p.x - bounds.minX, y: p.y - bounds.minY }))
      );

      const normalizedBounds = computeBounds(
        normalizedContours.flat().concat(normalizedHoles.flat())
      );

      const totalArea = computeGeometryArea(normalizedContours, normalizedHoles);
      if (totalArea <= 0.001) continue;

      // Determine part name
      let partName: string | undefined;
      const namedComp = groupComps.find(
        (c) => c.primaryGroupName || c.primaryGroupId
      );

      if (namedComp) {
        const raw = namedComp.primaryGroupName || namedComp.primaryGroupId || '';
        partName = formatPartName(raw);
      }

      if (!partName) {
        partName =
          candidateBuckets.length === 1 ? baseName : `${baseName} #${partIndex}`;
      }

      const geometry: Geometry = {
        contours: normalizedContours,
        holes: normalizedHoles,
        bounds: normalizedBounds,
        area: totalArea,
      };

      results.push({
        geometry,
        width: normalizedBounds.width,
        height: normalizedBounds.height,
        area: totalArea,
        name: partName,
      });

      partIndex++;
    }

    return results;
  }
}

