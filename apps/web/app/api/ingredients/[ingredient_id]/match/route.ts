import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  CommonApiErrorResponse,
  IngredientMatchRequest,
  IngredientMatchResponse,
} from "@/types/api";

const paramsSchema = z.object({
  ingredient_id: z.string().uuid(),
});

const requestSchema = z.object({
  matched_food_id: z.number().int().positive(),
  grams: z.number().gt(0).lte(5000),
  match_method: z.enum(["manual", "dict", "trgm"]).default("manual"),
});

function errorResponse(params: {
  status: number;
  requestId: string;
  code: "bad_request" | "not_found" | "internal_error";
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ ingredient_id: string }> },
) {
  const requestId = `req_${crypto.randomUUID()}`;

  try {
    const params = paramsSchema.safeParse(await context.params);

    if (!params.success) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Invalid ingredient id",
        retryable: false,
        details: params.error.flatten(),
      });
    }

    const parsedBody = requestSchema.safeParse(await req.json().catch(() => ({})));

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

    const ingredientId = params.data.ingredient_id;
    const body = parsedBody.data satisfies IngredientMatchRequest;
    const supabase = createSupabaseServiceClient();

    const ingredientResult = await supabase
      .from("recipe_ingredients")
      .select("id")
      .eq("id", ingredientId)
      .maybeSingle();

    if (ingredientResult.error) {
      throw new Error(ingredientResult.error.message);
    }

    if (!ingredientResult.data) {
      return errorResponse({
        status: 404,
        requestId,
        code: "not_found",
        message: "Ingredient not found",
        retryable: false,
      });
    }

    const upsertResult = await supabase.from("recipe_ingredient_matches").upsert(
      {
        ingredient_id: ingredientId,
        matched_food_id: body.matched_food_id,
        grams: body.grams,
        match_method: body.match_method,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ingredient_id" },
    );

    if (upsertResult.error) {
      throw new Error(upsertResult.error.message);
    }

    const response: IngredientMatchResponse = {
      ingredient_id: ingredientId,
      matched_food_id: body.matched_food_id,
      grams: body.grams,
      match_method: body.match_method,
    };

    return NextResponse.json(response, { status: 200 });
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
