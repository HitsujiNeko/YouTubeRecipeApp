import type { ExtractionStatus, SourceMode } from "@/lib/extraction/types";

export function decideExtractionStatus(params: {
  ingredientsCount: number;
  stepsCount: number;
  mode: SourceMode;
}): ExtractionStatus {
  if (params.ingredientsCount >= 2 && params.stepsCount >= 2) {
    return "success";
  }

  if (params.ingredientsCount >= 1 || params.stepsCount >= 1) {
    return "partial";
  }

  if (params.mode === "none") {
    return "no_source";
  }

  return "no_recipe_found";
}

export function computeExtractionConfidence(params: {
  ingredientsCount: number;
  stepsCount: number;
  sourceMode: SourceMode;
}): number {
  const ingredientScore = params.ingredientsCount > 0 ? 0.75 : 0;
  const stepScore = params.stepsCount > 0 ? 0.75 : 0;
  const coverageScore = Math.min(
    1,
    (params.ingredientsCount >= 3 ? 0.5 : params.ingredientsCount / 6) +
      (params.stepsCount >= 3 ? 0.5 : params.stepsCount / 6),
  );
  const sourceBonus =
    params.sourceMode === "description+transcript" || params.sourceMode === "transcript" ? 0.05 : 0;

  return Number(
    Math.min(
      1,
      0.4 * ingredientScore + 0.4 * stepScore + 0.2 * coverageScore + sourceBonus,
    ).toFixed(2),
  );
}
