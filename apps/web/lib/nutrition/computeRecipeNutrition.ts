import type {
  ComputeRecipeNutritionResponse,
  NutritionTotalsResponse,
  UnresolvedIngredient,
} from "@/types/api";

type IngredientRow = {
  id: string;
  name: string;
  quantity_text: string | null;
};

type MatchRow = {
  ingredient_id: string;
  matched_food_id: number | null;
  grams: number | null;
  match_score: number | null;
};

type NutrientRow = {
  food_id: number;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  salt_g: number | null;
};

type ComputeRecipeNutritionParams = {
  ingredients: IngredientRow[];
  matches: MatchRow[];
  nutrients: NutrientRow[];
};

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeRecipeNutrition({
  ingredients,
  matches,
  nutrients,
}: ComputeRecipeNutritionParams): ComputeRecipeNutritionResponse {
  const matchByIngredientId = new Map(matches.map((row) => [row.ingredient_id, row]));
  const nutrientByFoodId = new Map(nutrients.map((row) => [row.food_id, row]));

  const totals: NutritionTotalsResponse = {
    kcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    salt_g: 0,
  };

  const unresolved: UnresolvedIngredient[] = [];
  const resolvedScores: number[] = [];
  let resolvedIngredientCount = 0;

  for (const ingredient of ingredients) {
    const match = matchByIngredientId.get(ingredient.id);

    if (!match || !match.matched_food_id) {
      unresolved.push({
        ingredient_id: ingredient.id,
        name: ingredient.name,
        reason: "matched food is not selected",
      });
      continue;
    }

    if (!match.grams || match.grams <= 0) {
      unresolved.push({
        ingredient_id: ingredient.id,
        name: ingredient.name,
        reason: "grams is missing or invalid",
      });
      continue;
    }

    const nutrient = nutrientByFoodId.get(match.matched_food_id);

    if (!nutrient) {
      unresolved.push({
        ingredient_id: ingredient.id,
        name: ingredient.name,
        reason: "nutrient profile is unavailable",
      });
      continue;
    }

    const ratio = match.grams / 100;
    totals.kcal += (nutrient.kcal ?? 0) * ratio;
    totals.protein_g += (nutrient.protein_g ?? 0) * ratio;
    totals.fat_g += (nutrient.fat_g ?? 0) * ratio;
    totals.carbs_g += (nutrient.carbs_g ?? 0) * ratio;
    totals.salt_g += (nutrient.salt_g ?? 0) * ratio;
    resolvedIngredientCount += 1;

    if (typeof match.match_score === "number") {
      resolvedScores.push(clamp(match.match_score, 0, 1));
    }
  }

  const ingredientCount = ingredients.length;
  const coverage = ingredientCount > 0 ? resolvedIngredientCount / ingredientCount : 0;
  const mappingConfidence =
    resolvedScores.length > 0
      ? resolvedScores.reduce((sum, score) => sum + score, 0) / resolvedScores.length
      : 0;
  const confidence = clamp(0.6 * mappingConfidence + 0.4 * coverage, 0, 1);

  return {
    totals: {
      kcal: roundTo(totals.kcal, 1),
      protein_g: roundTo(totals.protein_g, 2),
      fat_g: roundTo(totals.fat_g, 2),
      carbs_g: roundTo(totals.carbs_g, 2),
      salt_g: roundTo(totals.salt_g, 3),
    },
    confidence: roundTo(confidence, 2),
    coverage: roundTo(coverage, 2),
    unresolved,
  };
}
