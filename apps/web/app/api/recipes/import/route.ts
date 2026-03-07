import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeFoodQuery } from "@/lib/nutrition/normalizeFoodQuery";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { fetchYouTubeMetadata, YouTubeUpstreamError } from "@/lib/youtube/fetchYouTubeMetadata";
import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

const importRequestSchema = z.object({
  url: z.string().url(),
  language: z.string().default("ja"),
  options: z
    .object({
      allow_ai_infer_steps: z.boolean().default(false),
      compute_nutrition: z.boolean().default(true),
    })
    .optional(),
});

type ErrorCode = "bad_request" | "too_many_requests" | "upstream_unavailable" | "internal_error";

type SupabaseLikeError = {
  message: string;
  code?: string;
  details?: string;
};

type ExtractedIngredient = {
  name: string;
  quantityText: string | null;
};

type ExtractedStep = {
  text: string;
  timestampSec: number | null;
  isAiInferred: boolean;
};

type FoodCandidate = {
  id: number;
  searchable_name: string;
};

const INGREDIENT_HEADING_PATTERN = /(材料|ingredients?)/i;
const STEP_HEADING_PATTERN = /(作り方|手順|instructions?|steps?|method)/i;
const URL_PATTERN = /^https?:\/\//i;
const TIMESTAMP_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;

function stripBulletPrefix(line: string): string {
  return line.replace(/^[\s\-・●○■□◆◇▶▷►]+/, "").trim();
}

function parseIngredientLine(line: string): ExtractedIngredient {
  const cleaned = stripBulletPrefix(line);
  const quantityMatch = cleaned.match(
    /^(.*?)(?:[\s\u3000]+)(\d+(?:\.\d+)?\s*(?:g|ml|cc|個|本|枚)|大さじ\s*\d+(?:\.\d+)?|小さじ\s*\d+(?:\.\d+)?|適量|少々)$/i,
  );

  if (!quantityMatch) {
    return {
      name: cleaned,
      quantityText: null,
    };
  }

  return {
    name: quantityMatch[1].trim(),
    quantityText: quantityMatch[2].trim(),
  };
}

function toTimestampSec(value: string): number | null {
  const match = value.match(TIMESTAMP_PATTERN);

  if (!match) {
    return null;
  }

  const hOrM = Number(match[1]);
  const m = Number(match[2]);
  const s = Number(match[3] ?? 0);

  if (Number.isNaN(hOrM) || Number.isNaN(m) || Number.isNaN(s)) {
    return null;
  }

  return match[3] ? hOrM * 3600 + m * 60 + s : hOrM * 60 + m;
}

function parseStepLine(line: string): ExtractedStep {
  const cleaned = stripBulletPrefix(line);
  const timestamp = toTimestampSec(cleaned);
  const textWithoutTimestamp = cleaned
    .replace(TIMESTAMP_PATTERN, "")
    .replace(/^[-:：\s]+/, "")
    .replace(/^\d+[\.\)．、]\s*/, "")
    .trim();

  return {
    text: textWithoutTimestamp || cleaned,
    timestampSec: timestamp,
    isAiInferred: false,
  };
}

function extractIngredientsAndSteps(
  description: string | null,
  allowAiInferSteps: boolean,
): {
  ingredients: ExtractedIngredient[];
  steps: ExtractedStep[];
} {
  if (!description) {
    return {
      ingredients: [],
      steps: allowAiInferSteps
        ? [
            {
              text: "動画の内容を参照して調理してください。",
              timestampSec: null,
              isAiInferred: true,
            },
          ]
        : [],
    };
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const ingredients: ExtractedIngredient[] = [];
  const steps: ExtractedStep[] = [];

  let mode: "neutral" | "ingredients" | "steps" = "neutral";

  for (const rawLine of lines) {
    const line = stripBulletPrefix(rawLine);

    if (!line || URL_PATTERN.test(line)) {
      continue;
    }

    if (INGREDIENT_HEADING_PATTERN.test(line)) {
      mode = "ingredients";
      continue;
    }

    if (STEP_HEADING_PATTERN.test(line)) {
      mode = "steps";
      continue;
    }

    if (mode === "ingredients") {
      ingredients.push(parseIngredientLine(line));
      continue;
    }

    if (mode === "steps" || TIMESTAMP_PATTERN.test(line) || /^\d+[\.\)．、]/.test(line)) {
      steps.push(parseStepLine(line));
    }
  }

  const dedupedIngredients = ingredients
    .filter((item) => item.name.length > 0)
    .filter((item, index, list) => list.findIndex((row) => row.name === item.name) === index)
    .slice(0, 20);

  const dedupedSteps = steps
    .filter((item) => item.text.length > 0)
    .filter((item, index, list) => list.findIndex((row) => row.text === item.text) === index)
    .slice(0, 30);

  return {
    ingredients: dedupedIngredients,
    steps:
      dedupedSteps.length > 0
        ? dedupedSteps
        : allowAiInferSteps
          ? [
              {
                text: "動画の内容を参照して調理してください。",
                timestampSec: null,
                isAiInferred: true,
              },
            ]
          : [],
  };
}

function scoreMatch(query: string, candidate: string): number {
  if (!candidate) {
    return 0;
  }

  if (candidate === query) {
    return 1;
  }

  if (candidate.startsWith(query)) {
    return 0.9;
  }

  if (candidate.includes(query)) {
    return 0.7;
  }

  return 0;
}

function inferGrams(quantityText: string | null): number {
  if (!quantityText) {
    return 100;
  }

  const gramsMatch = quantityText.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (gramsMatch) {
    return Math.max(1, Math.min(5000, Number(gramsMatch[1])));
  }

  const tbspMatch = quantityText.match(/大さじ\s*(\d+(?:\.\d+)?)/);
  if (tbspMatch) {
    return Math.max(1, Math.min(5000, Number(tbspMatch[1]) * 15));
  }

  const tspMatch = quantityText.match(/小さじ\s*(\d+(?:\.\d+)?)/);
  if (tspMatch) {
    return Math.max(1, Math.min(5000, Number(tspMatch[1]) * 5));
  }

  return 100;
}

function isSupabaseLikeError(value: unknown): value is SupabaseLikeError {
  return Boolean(
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string" &&
    ("code" in value || "details" in value),
  );
}

function errorResponse(params: {
  status: number;
  requestId: string;
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      error: {
        code: params.code,
        message: params.message,
        request_id: params.requestId,
        retryable: params.retryable,
        ...(params.details ? { details: params.details } : {}),
      },
    },
    { status: params.status },
  );
}

export async function POST(req: NextRequest) {
  const requestId = `req_${crypto.randomUUID()}`;

  try {
    const raw = await req.json();
    const parsed = importRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Invalid request payload",
        retryable: false,
        details: parsed.error.flatten(),
      });
    }

    const { url, language, options } = parsed.data;
    const videoId = parseYouTubeVideoId(url);

    if (!videoId) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Unsupported YouTube URL format",
        retryable: false,
        details: { field: "url" },
      });
    }

    const metadata = await fetchYouTubeMetadata(videoId);
    const supabase = createSupabaseServiceClient();

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const nowIso = new Date().toISOString();

    const videoSourceResult = await supabase
      .from("video_sources")
      .upsert(
        {
          platform: "youtube",
          video_id: videoId,
          canonical_url: canonicalUrl,
          channel_title: metadata.channelTitle,
          title: metadata.title,
          thumbnail_url: metadata.thumbnailUrl,
          last_refreshed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "platform,video_id" },
      )
      .select("id")
      .single();

    if (videoSourceResult.error || !videoSourceResult.data) {
      throw videoSourceResult.error ?? new Error("Failed to upsert video source");
    }

    const recipeResult = await supabase
      .from("recipes")
      .insert({
        source_id: videoSourceResult.data.id,
        language,
        title: metadata.title,
        extraction_confidence: 0,
      })
      .select("id, extraction_confidence")
      .single();

    if (recipeResult.error || !recipeResult.data) {
      throw recipeResult.error ?? new Error("Failed to create recipe");
    }

    const extracted = extractIngredientsAndSteps(
      metadata.description,
      options?.allow_ai_infer_steps ?? false,
    );

    const ingredientInsertRows = extracted.ingredients.map((ingredient, index) => ({
      recipe_id: recipeResult.data.id,
      position: index + 1,
      name: ingredient.name,
      quantity_text: ingredient.quantityText,
    }));

    const ingredientResult = ingredientInsertRows.length
      ? await supabase
          .from("recipe_ingredients")
          .insert(ingredientInsertRows)
          .select("id,name,quantity_text")
      : { data: [], error: null };

    if (ingredientResult.error) {
      throw ingredientResult.error;
    }

    const insertedIngredients =
      (ingredientResult.data as Array<{
        id: string;
        name: string;
        quantity_text: string | null;
      }>) ?? [];

    const autoMatchRows: Array<{
      ingredient_id: string;
      matched_food_id: number;
      match_score: number;
      match_method: "dict" | "trgm";
      grams: number;
      grams_confidence: number;
    }> = [];

    for (const ingredient of insertedIngredients) {
      const normalized = normalizeFoodQuery(ingredient.name);

      if (!normalized || normalized.length < 2) {
        continue;
      }

      const foodSearchResult = await supabase
        .from("food_items")
        .select("id,searchable_name")
        .ilike("searchable_name", `%${normalized}%`)
        .limit(5);

      if (foodSearchResult.error) {
        throw foodSearchResult.error;
      }

      const candidates = (foodSearchResult.data as FoodCandidate[]) ?? [];

      if (candidates.length === 0) {
        continue;
      }

      const scored = candidates
        .map((candidate) => ({
          id: candidate.id,
          score: scoreMatch(normalized, candidate.searchable_name),
        }))
        .sort((a, b) => b.score - a.score);

      const best = scored[0];

      if (!best || best.score < 0.7) {
        continue;
      }

      autoMatchRows.push({
        ingredient_id: ingredient.id,
        matched_food_id: best.id,
        match_score: Number(best.score.toFixed(2)),
        match_method: best.score >= 1 ? "dict" : "trgm",
        grams: inferGrams(ingredient.quantity_text),
        grams_confidence: ingredient.quantity_text ? 0.8 : 0.5,
      });
    }

    if (autoMatchRows.length > 0) {
      const autoMatchResult = await supabase
        .from("recipe_ingredient_matches")
        .upsert(autoMatchRows, { onConflict: "ingredient_id" });

      if (autoMatchResult.error) {
        throw autoMatchResult.error;
      }
    }

    const stepInsertRows = extracted.steps.map((step, index) => ({
      recipe_id: recipeResult.data.id,
      position: index + 1,
      text: step.text,
      timestamp_sec: step.timestampSec,
      is_ai_inferred: step.isAiInferred,
    }));

    if (stepInsertRows.length > 0) {
      const stepInsertResult = await supabase.from("recipe_steps").insert(stepInsertRows);

      if (stepInsertResult.error) {
        throw stepInsertResult.error;
      }
    }

    const extractionConfidenceBase =
      extracted.ingredients.length > 0 && extracted.steps.length > 0
        ? 0.7
        : extracted.ingredients.length > 0 || extracted.steps.length > 0
          ? 0.5
          : 0.2;
    const matchBoost = extracted.ingredients.length
      ? Math.min(0.25, autoMatchRows.length / extracted.ingredients.length)
      : 0;
    const extractionConfidence = Number(
      Math.min(1, extractionConfidenceBase + matchBoost).toFixed(2),
    );

    const recipeUpdateResult = await supabase
      .from("recipes")
      .update({
        extraction_confidence: extractionConfidence,
        extraction_notes:
          extracted.ingredients.length > 0 || extracted.steps.length > 0
            ? "parsed from YouTube description"
            : "metadata-only import",
      })
      .eq("id", recipeResult.data.id);

    if (recipeUpdateResult.error) {
      throw recipeUpdateResult.error;
    }

    return NextResponse.json(
      {
        recipe_id: recipeResult.data.id,
        extraction_confidence: extractionConfidence,
        nutrition: null,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof YouTubeUpstreamError) {
      if (error.statusCode === 429) {
        return errorResponse({
          status: 429,
          requestId,
          code: "too_many_requests",
          message: error.message,
          retryable: true,
          details: { provider: error.provider },
        });
      }

      return errorResponse({
        status: 503,
        requestId,
        code: "upstream_unavailable",
        message: error.message,
        retryable: true,
        details: { provider: error.provider },
      });
    }

    if (error instanceof Error && /Invalid server environment variables/i.test(error.message)) {
      return errorResponse({
        status: 503,
        requestId,
        code: "upstream_unavailable",
        message: "Server environment configuration is invalid",
        retryable: false,
        details: { provider: "config" },
      });
    }

    if (isSupabaseLikeError(error)) {
      const schemaErrorCodes = new Set(["42P01", "PGRST204", "PGRST205"]);
      const isSchemaOrInfraIssue =
        (error.code ? schemaErrorCodes.has(error.code) : false) ||
        /relation .* does not exist|schema cache|Failed to create recipe|Failed to upsert video source/i.test(
          error.message,
        );

      return errorResponse({
        status: isSchemaOrInfraIssue ? 503 : 500,
        requestId,
        code: isSchemaOrInfraIssue ? "upstream_unavailable" : "internal_error",
        message: isSchemaOrInfraIssue
          ? "Database dependency is unavailable or not initialized"
          : "Unexpected server error",
        retryable: isSchemaOrInfraIssue,
        details: {
          provider: "supabase",
          error_code: error.code ?? null,
        },
      });
    }

    return errorResponse({
      status: 500,
      requestId,
      code: "internal_error",
      message: "Unexpected server error",
      retryable: false,
    });
  }
}
