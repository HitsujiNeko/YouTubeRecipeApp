import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { z } from "zod";

import { getRecipeDetailById } from "@/lib/recipes/getRecipeDetailById";
import type { CommonApiErrorResponse } from "@/types/api";

const routeParamsSchema = z.object({
  id: z.string().min(1),
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

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
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

    const recipe = await getRecipeDetailById(routeParams.data.id);

    if (!recipe) {
      return errorResponse({
        status: 404,
        requestId,
        code: "not_found",
        message: "Recipe not found",
        retryable: false,
      });
    }

    return NextResponse.json(
      {
        id: recipe.id,
        title: recipe.title,
        source_url: recipe.sourceUrl,
        thumbnail_url: recipe.thumbnailUrl,
        nutrition: {
          totals: {
            kcal: recipe.nutrition.kcal,
            protein_g: recipe.nutrition.proteinG,
            fat_g: recipe.nutrition.fatG,
            carbs_g: recipe.nutrition.carbsG,
            salt_g: recipe.nutrition.saltG,
          },
          confidence: recipe.nutrition.confidence,
          coverage: recipe.nutrition.coverage,
          unresolved_count: recipe.nutrition.unresolvedCount,
        },
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      },
      { status: 200 },
    );
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
