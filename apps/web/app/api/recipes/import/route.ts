import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasRecipeSignalsInDescription, selectSourceMode } from "@/lib/extraction/evaluateSource";
import { LlmStructureError, structureRecipeWithLlm } from "@/lib/extraction/llmStructure";
import { extractRecipeByRules } from "@/lib/extraction/ruleExtract";
import { computeExtractionConfidence, decideExtractionStatus } from "@/lib/extraction/status";
import type {
  ExtractionStatus,
  StructuredIngredient,
  StructuredStep,
} from "@/lib/extraction/types";
import { normalizeFoodQuery } from "@/lib/nutrition/normalizeFoodQuery";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { fetchYouTubeMetadata, YouTubeUpstreamError } from "@/lib/youtube/fetchYouTubeMetadata";
import { fetchYouTubeTranscript } from "@/lib/youtube/fetchYouTubeTranscript";
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

type FoodCandidate = {
  id: number;
  searchable_name: string;
};

type LlmResult =
  | "not_attempted"
  | "success"
  | "fallback_rule"
  | "api_error"
  | "invalid_payload"
  | "unknown_error";

function normalizeSourceText(text: string | null): string {
  if (!text) {
    return "";
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^https?:\/\//i.test(line))
    .join("\n");
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

    const { url, language } = parsed.data;
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

    const [metadata, transcript] = await Promise.all([
      fetchYouTubeMetadata(videoId),
      fetchYouTubeTranscript(videoId, language),
    ]);

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
        extraction_status: "no_source",
        source_text: transcript,
      })
      .select("id, extraction_confidence, extraction_status")
      .single();

    if (recipeResult.error || !recipeResult.data) {
      throw recipeResult.error ?? new Error("Failed to create recipe");
    }

    const descriptionHasRecipe = hasRecipeSignalsInDescription(metadata.description);
    const sourceMode = selectSourceMode({
      descriptionHasRecipe,
      transcript,
    });

    let extracted: {
      ingredients: StructuredIngredient[];
      steps: StructuredStep[];
    } = {
      ingredients: [],
      steps: [],
    };

    let extractionStatus: ExtractionStatus = "no_source";
    let llmResult: LlmResult = "not_attempted";
    let llmRunStatus: "success" | "failed" | null = null;
    let llmRunError: string | null = null;
    let llmModelName: string | null = null;

    if (sourceMode !== "none") {
      const descriptionText = descriptionHasRecipe ? normalizeSourceText(metadata.description) : "";
      const transcriptText = sourceMode === "description" ? "" : normalizeSourceText(transcript);

      try {
        const llmOutput = await structureRecipeWithLlm({
          title: metadata.title,
          descriptionText,
          transcriptText,
        });
        extracted = {
          ingredients: llmOutput.ingredients,
          steps: llmOutput.steps,
        };
        llmModelName = llmOutput.metadata?.modelName ?? null;
        llmResult = "success";
        llmRunStatus = "success";
        extractionStatus = decideExtractionStatus({
          ingredientsCount: extracted.ingredients.length,
          stepsCount: extracted.steps.length,
          mode: sourceMode,
        });
      } catch (error) {
        llmRunStatus = "failed";

        if (error instanceof LlmStructureError) {
          llmResult = error.kind === "api" ? "api_error" : "invalid_payload";
          llmRunError = error.message;
        } else if (error instanceof Error) {
          llmResult = "unknown_error";
          llmRunError = error.message;
        } else {
          llmResult = "unknown_error";
          llmRunError = "Unknown LLM error";
        }

        const fallback = extractRecipeByRules(metadata.description);

        if (fallback.ingredients.length > 0 || fallback.steps.length > 0) {
          extracted = fallback;
          llmResult = "fallback_rule";
          extractionStatus = decideExtractionStatus({
            ingredientsCount: extracted.ingredients.length,
            stepsCount: extracted.steps.length,
            mode: sourceMode,
          });
        } else if (error instanceof LlmStructureError && error.kind === "api") {
          extractionStatus = "no_source";
        } else {
          extractionStatus = descriptionHasRecipe ? "no_recipe_found" : "no_source";
        }
      }

      if (llmRunStatus) {
        const extractionRunResult = await supabase.from("extraction_runs").insert({
          recipe_id: recipeResult.data.id,
          source_id: videoSourceResult.data.id,
          extractor_name: "llm_structure",
          model_name: llmModelName ?? "unknown",
          status: llmRunStatus,
          error_message: llmRunError ? llmRunError.slice(0, 500) : null,
        });

        if (extractionRunResult.error) {
          llmResult = llmResult === "success" ? "unknown_error" : llmResult;
        }
      }
    }

    const ingredientInsertRows = extracted.ingredients.map((ingredient, index) => ({
      recipe_id: recipeResult.data.id,
      position: index + 1,
      name: ingredient.name,
      quantity_text: ingredient.quantity_text,
      group_label: ingredient.group_label,
      is_optional: ingredient.is_optional,
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
      timestamp_sec: step.timestamp_sec,
      timer_sec: step.timer_sec,
      is_ai_inferred: step.is_ai_inferred,
    }));

    if (stepInsertRows.length > 0) {
      const stepInsertResult = await supabase.from("recipe_steps").insert(stepInsertRows);

      if (stepInsertResult.error) {
        throw stepInsertResult.error;
      }
    }

    const extractionConfidence = computeExtractionConfidence({
      ingredientsCount: extracted.ingredients.length,
      stepsCount: extracted.steps.length,
      sourceMode,
    });

    const recipeUpdateResult = await supabase
      .from("recipes")
      .update({
        extraction_confidence: extractionConfidence,
        extraction_status: extractionStatus,
        source_text: transcript,
        extraction_notes: `mode=${sourceMode}; llm_result=${llmResult}; ingredients=${extracted.ingredients.length}; steps=${extracted.steps.length}`,
      })
      .eq("id", recipeResult.data.id);

    if (recipeUpdateResult.error) {
      throw recipeUpdateResult.error;
    }

    return NextResponse.json(
      {
        recipe_id: recipeResult.data.id,
        extraction_confidence: extractionConfidence,
        extraction_status: extractionStatus,
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
