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
  channel_title: string | null;
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
  name: string;
  quantity_text: string | null;
};

type StepRow = {
  text: string;
};

export type SharedRecipeView = RecipeDetailView & {
  channelTitle: string | null;
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

export async function getSharedRecipeBySlug(slug: string): Promise<SharedRecipeView | null> {
  const supabase = createSupabaseServiceClient();

  const recipeResult = await supabase
    .from("recipes")
    .select("id,title,source_id")
    .eq("public_slug", slug)
    .maybeSingle();

  if (recipeResult.error || !recipeResult.data) {
    return null;
  }

  const recipe = recipeResult.data as RecipeRow;

  const [videoResult, nutritionResult, ingredientsResult, stepsResult] = await Promise.all([
    supabase
      .from("video_sources")
      .select("canonical_url,thumbnail_url,channel_title")
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
      .select("name,quantity_text")
      .eq("recipe_id", recipe.id)
      .order("position", { ascending: true }),
    supabase
      .from("recipe_steps")
      .select("text")
      .eq("recipe_id", recipe.id)
      .order("position", { ascending: true }),
  ]);

  if (videoResult.error) {
    return null;
  }

  const video = (videoResult.data ?? {
    canonical_url: null,
    thumbnail_url: null,
    channel_title: null,
  }) as VideoSourceRow;
  const nutrition = (nutritionResult.data ?? null) as NutritionCacheRow | null;
  const ingredients = (ingredientsResult.data ?? []) as IngredientRow[];
  const steps = (stepsResult.data ?? []) as StepRow[];

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
      coverage: Number(nutrition?.coverage ?? 0) * 100,
      unresolvedCount: 0,
    },
    ingredients: ingredients.map((item) =>
      item.quantity_text ? `${item.name} ${item.quantity_text}` : item.name,
    ),
    steps: steps.map((item) => item.text),
    channelTitle: video.channel_title,
  };
}
