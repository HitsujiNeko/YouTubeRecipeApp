import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { CommonApiErrorResponse, RecipeShareResponse } from "@/types/api";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal_error";

type RecipeRow = {
  id: string;
  owner_user_id: string | null;
  anon_edit_token_hash: string | null;
  share_enabled_at: string | null;
};

type RecipeUpdateRow = {
  public_slug: string;
  share_enabled_at: string;
  share_slug_rotated_at: string;
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

function getBearerToken(req: NextRequest): string | null {
  const value = req.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) {
    return null;
  }

  const token = value.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function generatePublicSlug(): string {
  return crypto.randomBytes(6).toString("base64url");
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

    const recipeId = routeParams.data.id;
    const editToken = req.headers.get("x-recipe-edit-token")?.trim() ?? "";
    const bearerToken = getBearerToken(req);
    const supabase = createSupabaseServiceClient();

    const recipeResult = await supabase
      .from("recipes")
      .select("id,owner_user_id,anon_edit_token_hash,share_enabled_at")
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeResult.error) {
      throw new Error(recipeResult.error.message);
    }

    const recipe = recipeResult.data as RecipeRow | null;

    if (!recipe) {
      return errorResponse({
        status: 404,
        requestId,
        code: "not_found",
        message: "Recipe not found",
        retryable: false,
      });
    }

    if (recipe.owner_user_id) {
      if (!bearerToken) {
        return errorResponse({
          status: 401,
          requestId,
          code: "unauthorized",
          message: "Missing auth context for private recipe",
          retryable: false,
        });
      }

      const authResult = await supabase.auth.getUser(bearerToken);

      if (authResult.error || !authResult.data.user) {
        return errorResponse({
          status: 401,
          requestId,
          code: "unauthorized",
          message: "Invalid bearer token",
          retryable: false,
        });
      }

      if (authResult.data.user.id !== recipe.owner_user_id) {
        return errorResponse({
          status: 403,
          requestId,
          code: "forbidden",
          message: "Not recipe owner",
          retryable: false,
        });
      }
    } else {
      if (!editToken) {
        return errorResponse({
          status: 401,
          requestId,
          code: "unauthorized",
          message: "Missing auth context for private recipe",
          retryable: false,
        });
      }

      const tokenHash = sha256Hex(editToken);
      const storedHash = recipe.anon_edit_token_hash;

      if (!storedHash || !safeStringEqual(tokenHash, storedHash)) {
        return errorResponse({
          status: 403,
          requestId,
          code: "forbidden",
          message: "Not recipe owner",
          retryable: false,
        });
      }
    }

    const nowIso = new Date().toISOString();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = generatePublicSlug();
      const updatePayload: Record<string, string> = {
        public_slug: slug,
        share_slug_rotated_at: nowIso,
        updated_at: nowIso,
      };

      if (!recipe.share_enabled_at) {
        updatePayload.share_enabled_at = nowIso;
      }

      const updateResult = await supabase
        .from("recipes")
        .update(updatePayload)
        .eq("id", recipeId)
        .select("public_slug,share_enabled_at,share_slug_rotated_at")
        .single();

      if (!updateResult.error) {
        const updated = updateResult.data as RecipeUpdateRow;
        const body: RecipeShareResponse = {
          public_slug: updated.public_slug,
          share_enabled_at: updated.share_enabled_at,
          share_slug_rotated_at: updated.share_slug_rotated_at,
        };

        return NextResponse.json(body, { status: 200 });
      }

      if (updateResult.error.code !== "23505") {
        throw new Error(updateResult.error.message);
      }
    }

    return errorResponse({
      status: 409,
      requestId,
      code: "conflict",
      message: "Slug collision, retryable",
      retryable: true,
    });
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
