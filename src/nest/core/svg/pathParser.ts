import { Point } from '../types';
import { sampleCubicBezier, sampleQuadraticBezier, sampleSvgArc } from '../geometry';

/**
 * SVG Path Command Types
 */
type PathCommand = {
  type: string;
  args: number[];
};

/**
 * Tokenizes SVG path string 'd' into SVG commands and numerical arguments.
 */
export function tokenizePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  if (!d) return commands;

  const regex = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;

  let currentCmd: string | null = null;
  let currentArgs: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(d)) !== null) {
    if (match[1]) {
      if (currentCmd) {
        commands.push({ type: currentCmd, args: currentArgs });
      }
      currentCmd = match[1];
      currentArgs = [];
    } else if (match[2]) {
      currentArgs.push(parseFloat(match[2]));
    }
  }

  if (currentCmd) {
    commands.push({ type: currentCmd, args: currentArgs });
  }

  return commands;
}

/**
 * Parses SVG path 'd' string into one or more sub-path polylines (contours/holes).
 */
export function parseSvgPathToContours(d: string): Point[][] {
  const commands = tokenizePath(d);
  if (commands.length === 0) return [];

  const subPaths: Point[][] = [];
  let currentPolyline: Point[] = [];

  let currentPoint: Point = { x: 0, y: 0 };
  let startPoint: Point = { x: 0, y: 0 };

  let lastCubicControl: Point | null = null;
  let lastQuadControl: Point | null = null;

  for (let idx = 0; idx < commands.length; idx++) {
    const cmd = commands[idx];
    const type = cmd.type;
    const args = cmd.args;
    const isRel = type === type.toLowerCase();
    const upperType = type.toUpperCase();

    let i = 0;
    while (i < args.length || upperType === 'Z') {
      if (upperType === 'Z') {
        if (currentPolyline.length > 0) {
          if (
            Math.hypot(
              currentPoint.x - startPoint.x,
              currentPoint.y - startPoint.y
            ) > 1e-5
          ) {
            currentPolyline.push({ ...startPoint });
          }
        }
        currentPoint = { ...startPoint };
        lastCubicControl = null;
        lastQuadControl = null;
        break; // break out of while
      }

      switch (upperType) {
        case 'M': {
          if (args.length < i + 2) {
            i = args.length;
            break;
          }
          const x = isRel ? currentPoint.x + args[i] : args[i];
          const y = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          i += 2;

          if (currentPolyline.length > 1) {
            subPaths.push(currentPolyline);
          }
          currentPolyline = [{ x, y }];
          currentPoint = { x, y };
          startPoint = { x, y };
          lastCubicControl = null;
          lastQuadControl = null;

          while (i + 1 < args.length) {
            const lx = isRel ? currentPoint.x + args[i] : args[i];
            const ly = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
            i += 2;
            currentPoint = { x: lx, y: ly };
            currentPolyline.push(currentPoint);
          }
          break;
        }

        case 'L': {
          if (args.length < i + 2) {
            i = args.length;
            break;
          }
          const x = isRel ? currentPoint.x + args[i] : args[i];
          const y = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          i += 2;
          currentPoint = { x, y };
          currentPolyline.push(currentPoint);
          lastCubicControl = null;
          lastQuadControl = null;
          break;
        }

        case 'H': {
          if (args.length < i + 1) {
            i = args.length;
            break;
          }
          const x = isRel ? currentPoint.x + args[i] : args[i];
          i += 1;
          currentPoint = { x, y: currentPoint.y };
          currentPolyline.push(currentPoint);
          lastCubicControl = null;
          lastQuadControl = null;
          break;
        }

        case 'V': {
          if (args.length < i + 1) {
            i = args.length;
            break;
          }
          const y = isRel ? currentPoint.y + args[i] : args[i];
          i += 1;
          currentPoint = { x: currentPoint.x, y };
          currentPolyline.push(currentPoint);
          lastCubicControl = null;
          lastQuadControl = null;
          break;
        }

        case 'C': {
          if (args.length < i + 6) {
            i = args.length;
            break;
          }
          const x1 = isRel ? currentPoint.x + args[i] : args[i];
          const y1 = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          const x2 = isRel ? currentPoint.x + args[i + 2] : args[i + 2];
          const y2 = isRel ? currentPoint.y + args[i + 3] : args[i + 3];
          const x = isRel ? currentPoint.x + args[i + 4] : args[i + 4];
          const y = isRel ? currentPoint.y + args[i + 5] : args[i + 5];
          i += 6;

          const p0 = currentPoint;
          const p1 = { x: x1, y: y1 };
          const p2 = { x: x2, y: y2 };
          const p3 = { x, y };

          const bezierPts = sampleCubicBezier(p0, p1, p2, p3);
          currentPolyline.push(...bezierPts.slice(1));

          currentPoint = p3;
          lastCubicControl = p2;
          lastQuadControl = null;
          break;
        }

        case 'S': {
          if (args.length < i + 4) {
            i = args.length;
            break;
          }
          let x1 = currentPoint.x;
          let y1 = currentPoint.y;
          if (lastCubicControl) {
            x1 = 2 * currentPoint.x - lastCubicControl.x;
            y1 = 2 * currentPoint.y - lastCubicControl.y;
          }
          const x2 = isRel ? currentPoint.x + args[i] : args[i];
          const y2 = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          const x = isRel ? currentPoint.x + args[i + 2] : args[i + 2];
          const y = isRel ? currentPoint.y + args[i + 3] : args[i + 3];
          i += 4;

          const p0 = currentPoint;
          const p1 = { x: x1, y: y1 };
          const p2 = { x: x2, y: y2 };
          const p3 = { x, y };

          const bezierPts = sampleCubicBezier(p0, p1, p2, p3);
          currentPolyline.push(...bezierPts.slice(1));

          currentPoint = p3;
          lastCubicControl = p2;
          lastQuadControl = null;
          break;
        }

        case 'Q': {
          if (args.length < i + 4) {
            i = args.length;
            break;
          }
          const x1 = isRel ? currentPoint.x + args[i] : args[i];
          const y1 = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          const x = isRel ? currentPoint.x + args[i + 2] : args[i + 2];
          const y = isRel ? currentPoint.y + args[i + 3] : args[i + 3];
          i += 4;

          const p0 = currentPoint;
          const p1 = { x: x1, y: y1 };
          const p2 = { x, y };

          const quadPts = sampleQuadraticBezier(p0, p1, p2);
          currentPolyline.push(...quadPts.slice(1));

          currentPoint = p2;
          lastQuadControl = p1;
          lastCubicControl = null;
          break;
        }

        case 'T': {
          if (args.length < i + 2) {
            i = args.length;
            break;
          }
          let x1 = currentPoint.x;
          let y1 = currentPoint.y;
          if (lastQuadControl) {
            x1 = 2 * currentPoint.x - lastQuadControl.x;
            y1 = 2 * currentPoint.y - lastQuadControl.y;
          }
          const x = isRel ? currentPoint.x + args[i] : args[i];
          const y = isRel ? currentPoint.y + args[i + 1] : args[i + 1];
          i += 2;

          const p0 = currentPoint;
          const p1 = { x: x1, y: y1 };
          const p2 = { x, y };

          const quadPts = sampleQuadraticBezier(p0, p1, p2);
          currentPolyline.push(...quadPts.slice(1));

          currentPoint = p2;
          lastQuadControl = p1;
          lastCubicControl = null;
          break;
        }

        case 'A': {
          if (args.length < i + 7) {
            i = args.length;
            break;
          }
          const rx = args[i];
          const ry = args[i + 1];
          const rot = args[i + 2];
          const largeArc = args[i + 3] !== 0;
          const sweep = args[i + 4] !== 0;
          const x = isRel ? currentPoint.x + args[i + 5] : args[i + 5];
          const y = isRel ? currentPoint.y + args[i + 6] : args[i + 6];
          i += 7;

          const p0 = currentPoint;
          const p1 = { x, y };

          const arcPts = sampleSvgArc(p0, rx, ry, rot, largeArc, sweep, p1);
          currentPolyline.push(...arcPts);

          currentPoint = p1;
          lastCubicControl = null;
          lastQuadControl = null;
          break;
        }

        default:
          i = args.length;
          break;
      }
    }
  }

  if (currentPolyline.length > 1) {
    subPaths.push(currentPolyline);
  }

  return subPaths;
}
