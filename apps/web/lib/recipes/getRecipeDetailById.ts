import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { NutritionConfidence, RecipeDetailView } from "@/types/models";

type RecipeRow = {
  id: string;
  title: string;
  source_id: string;
};

type VideoSourceRow = {
  canonical_url: string | null;
  thumbnail_url: string | null;
};

type NutritionCacheRow = {
  total_kcal: number | null;
  total_protein_g: number | null;
  total_fat_g: number | null;
  total_carbs_g: number | null;
  total_salt_g: number | null;
  confidence: number | null;
  coverage: number | null;
};

type IngredientRow = {
  id: string;
  name: string;
  quantity_text: string | null;
};

type MatchRow = {
  ingredient_id: string;
  matched_food_id: number | null;
  grams: number | null;
};

type StepRow = {
  text: string;
};

function toConfidenceLabel(value: number | null | undefined): NutritionConfidence {
  const score = Number(value ?? 0);

  if (score >= 0.8) {
    return "high";
  }

  if (score >= 0.55) {
    return "medium";
  }

  return "low";
}

export async function getRecipeDetailById(recipeId: string): Promise<RecipeDetailView | null> {
  const supabase = createSupabaseServiceClient();

  const recipeResult = await supabase
    .from("recipes")
    .select("id,title,source_id")
    .eq("id", recipeId)
    .maybeSingle();

  if (recipeResult.error || !recipeResult.data) {
    return null;
  }

  const recipe = recipeResult.data as RecipeRow;

  const [videoResult, nutritionResult, ingredientsResult, stepsResult] = await Promise.all([
    supabase
      .from("video_sources")
      .select("canonical_url,thumbnail_url")
      .eq("id", recipe.source_id)
      .maybeSingle(),
    supabase
      .from("recipe_nutrition_cache")
      .select(
        "total_kcal,total_protein_g,total_fat_g,total_carbs_g,total_salt_g,confidence,coverage",
      )
      .eq("recipe_id", recipe.id)
      .maybeSingle(),
    supabase
      .from("recipe_ingredients")
      .select("id,name,quantity_text")
      .eq("recipe_id", recipe.id)
      .order("position", { ascending: true }),
    supabase
      .from("recipe_steps")
      .select("text")
      .eq("recipe_id", recipe.id)
      .order("position", { ascending: true }),
  ]);

  if (videoResult.error || ingredientsResult.error || stepsResult.error) {
    return null;
  }

  const video = (videoResult.data ?? {
    canonical_url: null,
    thumbnail_url: null,
  }) as VideoSourceRow;
  const nutrition = (nutritionResult.data ?? null) as NutritionCacheRow | null;
  const ingredients = (ingredientsResult.data ?? []) as IngredientRow[];
  const steps = (stepsResult.data ?? []) as StepRow[];

  const ingredientIds = ingredients.map((item) => item.id);

  const matchesResult = ingredientIds.length
    ? await supabase
        .from("recipe_ingredient_matches")
        .select("ingredient_id,matched_food_id,grams")
        .in("ingredient_id", ingredientIds)
    : { data: [], error: null };

  if (matchesResult.error) {
    return null;
  }

  const matches = (matchesResult.data ?? []) as MatchRow[];
  const resolved = matches.filter(
    (item) => item.matched_food_id && item.grams && item.grams > 0,
  ).length;
  const unresolvedCount = Math.max(0, ingredients.length - resolved);
  const fallbackCoverage = ingredients.length > 0 ? resolved / ingredients.length : 0;

  return {
    id: recipe.id,
    title: recipe.title,
    sourceUrl: video.canonical_url ?? "",
    thumbnailUrl: video.thumbnail_url ?? "https://i.ytimg.com/vi/WLfTFCKqANA/hqdefault.jpg",
    nutrition: {
      kcal: Number(nutrition?.total_kcal ?? 0),
      proteinG: Number(nutrition?.total_protein_g ?? 0),
      fatG: Number(nutrition?.total_fat_g ?? 0),
      carbsG: Number(nutrition?.total_carbs_g ?? 0),
      saltG: Number(nutrition?.total_salt_g ?? 0),
      confidence: toConfidenceLabel(nutrition?.confidence),
      coverage: Number((nutrition?.coverage ?? fallbackCoverage) * 100),
      unresolvedCount,
    },
    ingredients: ingredients.map((item) =>
      item.quantity_text ? `${item.name} ${item.quantity_text}` : item.name,
    ),
    steps: steps.map((item) => item.text),
  };
}
