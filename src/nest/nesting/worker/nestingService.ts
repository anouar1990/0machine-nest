import { Part, Sheet, NestingOptions, NestingScore } from '../../core/types';
import { trueShapeNestParts } from '../algorithms/trueShapeNesting';

export type ProgressCallback = (progress: {
  generation: number;
  totalGenerations: number;
  bestUtilization: number;
  currentStrategy: string;
}) => void;

class NestingService {
  private isCancelled: boolean = false;

  public cancel() {
    this.isCancelled = true;
  }

  /**
   * Executes multi-start true-shape nesting asynchronously with progress callbacks
   * and non-blocking yield intervals to keep UI smooth and responsive.
   */
  public async runNestingAsync(
    parts: Part[],
    sheet: Sheet,
    options?: Partial<NestingOptions>,
    onProgress?: ProgressCallback
  ): Promise<NestingScore> {
    this.isCancelled = false;

    const multiStartCount = options?.multiStartCount || 6;
    let bestResult: NestingScore = {
      score: 0,
      wastePercentage: 100,
      utilizationPercentage: 0,
      totalPartsPlaced: 0,
      totalPartsAvailable: parts.reduce((a, b) => a + (b.quantity || 1), 0),
      areaUsedMm2: 0,
      sheetUsableAreaMm2: (sheet.width - 2 * sheet.margin) * (sheet.height - 2 * sheet.margin),
      materialSavedEur: 0,
      sheetCount: 1,
      sheetResults: [],
    };

    // Yield control to browser rendering loop before heavy calculation
    await new Promise((resolve) => setTimeout(resolve, 30));

    for (let gen = 1; gen <= multiStartCount; gen++) {
      if (this.isCancelled) {
        break;
      }

      // Execute iteration
      const currentOptions: Partial<NestingOptions> = {
        ...options,
        multiStartCount: gen,
      };

      const result = trueShapeNestParts(parts, sheet, currentOptions);

      if (result.utilizationPercentage > bestResult.utilizationPercentage) {
        bestResult = result;
      }

      if (onProgress) {
        onProgress({
          generation: gen,
          totalGenerations: multiStartCount,
          bestUtilization: bestResult.utilizationPercentage,
          currentStrategy: `Strategy #${gen}`,
        });
      }

      // Yield 20ms to UI event loop between generations to keep canvas reactive
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    return bestResult;
  }
}

export const nestingService = new NestingService();
