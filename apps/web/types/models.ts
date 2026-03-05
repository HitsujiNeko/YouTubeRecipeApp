export type NutritionConfidence = "low" | "medium" | "high";

export type NutritionTotals = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  saltG: number;
};

export type RecipeDetailNutrition = NutritionTotals & {
  confidence: NutritionConfidence;
  coverage: number;
  unresolvedCount: number;
};

export type RecipeDetailView = {
  id: string;
  title: string;
  sourceUrl: string;
  thumbnailUrl: string;
  nutrition: RecipeDetailNutrition;
  ingredients: string[];
  steps: string[];
};
