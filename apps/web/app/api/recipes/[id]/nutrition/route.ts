import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeRecipeNutrition } from "@/lib/nutrition/computeRecipeNutrition";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { CommonApiErrorResponse, ComputeRecipeNutritionResponse } from "@/types/api";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

const requestSchema = z
  .object({
    allow_best_effort: z.boolean().default(true),
  })
  .default({ allow_best_effort: true });

type ErrorCode = "bad_request" | "not_found" | "internal_error";

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

function errorResponse(params: {
  status: number;
  requestId: string;
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}) {
  const body: CommonApiErrorResponse = {
    error: {
      code: params.code,
      message: params.message,
      request_id: params.requestId,
      retryable: params.retryable,
      ...(params.details ? { details: params.details } : {}),
    },
  };

  return NextResponse.json(body, { status: params.status });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = `req_${crypto.randomUUID()}`;

  try {
    const routeParams = routeParamsSchema.safeParse(await context.params);

    if (!routeParams.success) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Invalid recipe id",
        retryable: false,
        details: routeParams.error.flatten(),
      });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsedBody = requestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Invalid request payload",
        retryable: false,
        details: parsedBody.error.flatten(),
      });
    }

    const recipeId = routeParams.data.id;
    const { allow_best_effort } = parsedBody.data;
    const supabase = createSupabaseServiceClient();

    const recipeResult = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeResult.error) {
      throw new Error(recipeResult.error.message);
    }

    if (!recipeResult.data) {
      return errorResponse({
        status: 404,
        requestId,
        code: "not_found",
        message: "Recipe not found",
        retryable: false,
      });
    }

    const ingredientsResult = await supabase
      .from("recipe_ingredients")
      .select("id,name,quantity_text")
      .eq("recipe_id", recipeId)
      .order("position", { ascending: true });

    if (ingredientsResult.error) {
      throw new Error(ingredientsResult.error.message);
    }

    const ingredients = (ingredientsResult.data ?? []) as IngredientRow[];
    const ingredientIds = ingredients.map((row) => row.id);

    const matchesResult = ingredientIds.length
      ? await supabase
          .from("recipe_ingredient_matches")
          .select("ingredient_id,matched_food_id,grams,match_score")
          .in("ingredient_id", ingredientIds)
      : { data: [], error: null };

    if (matchesResult.error) {
      throw new Error(matchesResult.error.message);
    }

    const matches = (matchesResult.data ?? []) as MatchRow[];
    const foodIds = Array.from(
      new Set(
        matches
          .map((row) => row.matched_food_id)
          .filter((value): value is number => typeof value === "number"),
      ),
    );

    const nutrientsResult = foodIds.length
      ? await supabase
          .from("food_nutrients_per_100g")
          .select("food_id,kcal,protein_g,fat_g,carbs_g,salt_g")
          .in("food_id", foodIds)
      : { data: [], error: null };

    if (nutrientsResult.error) {
      throw new Error(nutrientsResult.error.message);
    }

    const nutrients = (nutrientsResult.data ?? []) as NutrientRow[];
    const computed = computeRecipeNutrition({ ingredients, matches, nutrients });

    if (!allow_best_effort && computed.unresolved.length > 0) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Nutrition cannot be computed without unresolved ingredient fixes",
        retryable: false,
        details: { unresolved_count: computed.unresolved.length },
      });
    }

    const cacheUpsertResult = await supabase.from("recipe_nutrition_cache").upsert(
      {
        recipe_id: recipeId,
        total_kcal: computed.totals.kcal,
        total_protein_g: computed.totals.protein_g,
        total_fat_g: computed.totals.fat_g,
        total_carbs_g: computed.totals.carbs_g,
        total_salt_g: computed.totals.salt_g,
        confidence: computed.confidence,
        coverage: computed.coverage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "recipe_id" },
    );

    if (cacheUpsertResult.error) {
      throw new Error(cacheUpsertResult.error.message);
    }

    const body: ComputeRecipeNutritionResponse = computed;
    return NextResponse.json(body, { status: 200 });
  } catch {
    return errorResponse({
      status: 500,
      requestId,
      code: "internal_error",
      message: "Unexpected server error",
      retryable: false,
    });
  }
}
