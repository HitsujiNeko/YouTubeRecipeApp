import type { SourceMode } from "@/lib/extraction/types";

const INGREDIENT_HEADING_PATTERN = /(材料|ingredients?)/i;
const STEP_HEADING_PATTERN = /(作り方|手順|instructions?|steps?|method)/i;
const AMOUNT_PATTERN =
  /(\d+(?:\.\d+)?\s*(?:g|kg|ml|cc|個|本|枚)|大さじ\s*\d+(?:\.\d+)?|小さじ\s*\d+(?:\.\d+)?|適量|少々)/i;

export function hasRecipeSignalsInDescription(description: string | null): boolean {
  if (!description) {
    return false;
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.some((line) => INGREDIENT_HEADING_PATTERN.test(line))) {
    return true;
  }

  if (lines.some((line) => STEP_HEADING_PATTERN.test(line))) {
    return true;
  }

  const amountLinesCount = lines.filter((line) => AMOUNT_PATTERN.test(line)).length;
  if (amountLinesCount >= 2) {
    return true;
  }

  const stepLikeLinesCount = lines.filter((line) => /^\d+[\.\)．、]/.test(line)).length;
  return stepLikeLinesCount >= 2;
}

export function selectSourceMode(params: {
  descriptionHasRecipe: boolean;
  transcript: string | null;
}): SourceMode {
  const hasTranscript = Boolean(params.transcript && params.transcript.length > 0);

  if (params.descriptionHasRecipe && hasTranscript) {
    return "description+transcript";
  }

  if (params.descriptionHasRecipe) {
    return "description";
  }

  if (hasTranscript) {
    return "transcript";
  }

  return "none";
}
