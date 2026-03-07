export type ImportErrorCode =
  | "bad_request"
  | "too_many_requests"
  | "upstream_unavailable"
  | "internal_error";

export type CommonErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "too_many_requests"
  | "upstream_unavailable"
  | "internal_error";

export type ApiErrorResponse<TCode extends string = string> = {
  error: {
    code: TCode;
    message: string;
    request_id: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};

export type ImportRecipeRequest = {
  url: string;
  language: string;
  options: {
    allow_ai_infer_steps: boolean;
    compute_nutrition: boolean;
  };
};

export type ImportRecipeResponse = {
  recipe_id: string;
  extraction_confidence: number;
  nutrition: null;
};

export type ImportApiErrorResponse = ApiErrorResponse<ImportErrorCode>;

export type NutritionTotalsResponse = {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  salt_g: number;
};

export type UnresolvedIngredient = {
  ingredient_id: string;
  name: string;
  reason: string;
};

export type ComputeRecipeNutritionRequest = {
  allow_best_effort?: boolean;
};

export type ComputeRecipeNutritionResponse = {
  totals: NutritionTotalsResponse;
  confidence: number;
  coverage: number;
  unresolved: UnresolvedIngredient[];
};

export type CommonApiErrorResponse = ApiErrorResponse<CommonErrorCode>;

export type FoodSearchCandidate = {
  food_id: number;
  name_ja: string;
  category: string | null;
  score: number;
};

export type FoodSearchResponse = {
  items: FoodSearchCandidate[];
};

export type IngredientMatchRequest = {
  matched_food_id: number;
  grams: number;
  match_method?: "manual" | "dict" | "trgm";
};

export type IngredientMatchResponse = {
  ingredient_id: string;
  matched_food_id: number;
  grams: number;
  match_method: "manual" | "dict" | "trgm";
};
