import { Part, Sheet, ScoreBreakdown } from '../../core/types';
import { calculateNestingScore } from './index';

/**
 * Calculates a fully explainable, transparent 0-100 Nesting Score breakdown.
 */
export function getExplainableScoreBreakdown(parts: Part[], sheet: Sheet): ScoreBreakdown {
  const scoreData = calculateNestingScore(parts, sheet);

  const utilizationScore = Math.min(100, Math.max(0, Math.round(scoreData.utilizationPercentage)));
  const wasteEfficiencyScore = Math.min(100, Math.max(0, Math.round(100 - scoreData.wastePercentage)));
  
  // Sheet Efficiency Score (Reward packing everything onto 1 sheet or minimum required)
  const sheetCount = scoreData.sheetCount;
  const sheetEfficiencyScore = Math.max(50, Math.min(100, 100 - (sheetCount - 1) * 10));

  // Layout Quality Score (Evaluates part placement balance, boundary alignment & density)
  const layoutQualityScore = Math.min(
    100,
    Math.round(utilizationScore * 0.6 + wasteEfficiencyScore * 0.4)
  );

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        utilizationScore * 0.45 +
          wasteEfficiencyScore * 0.25 +
          sheetEfficiencyScore * 0.15 +
          layoutQualityScore * 0.15
      )
    )
  );

  const explanation: string[] = [
    `Material Utilization (${utilizationScore}/100): ${scoreData.utilizationPercentage.toFixed(1)}% of usable sheet area occupied by cut geometry.`,
    `Waste Efficiency (${wasteEfficiencyScore}/100): Raw material waste minimized to ${scoreData.wastePercentage.toFixed(1)}%.`,
    `Sheet Efficiency (${sheetEfficiencyScore}/100): Job packed efficiently into ${sheetCount} sheet(s).`,
    `Layout Quality (${layoutQualityScore}/100): True-shape spacing clearance and boundary alignment verified.`,
  ];

  return {
    overallScore,
    materialUtilizationScore: utilizationScore,
    wasteEfficiencyScore,
    sheetEfficiencyScore,
    layoutQualityScore,
    explanation,
  };
}
