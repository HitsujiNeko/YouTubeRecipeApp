import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { normalizeFoodQuery } from "@/lib/nutrition/normalizeFoodQuery";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { CommonApiErrorResponse, FoodSearchResponse } from "@/types/api";

const querySchema = z.object({
  q: z.string().min(1).max(100),
});

type FoodItemRow = {
  id: number;
  name_ja: string;
  category: string | null;
  searchable_name: string;
};

type FoodSynonymRow = {
  food_id: number;
  searchable_synonym: string;
};

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

function errorResponse(params: {
  status: number;
  requestId: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}) {
  const body: CommonApiErrorResponse = {
    error: {
      code: "bad_request",
      message: params.message,
      request_id: params.requestId,
      retryable: params.retryable,
      ...(params.details ? { details: params.details } : {}),
    },
  };

  return NextResponse.json(body, { status: params.status });
}

export async function GET(req: NextRequest) {
  const requestId = `req_${crypto.randomUUID()}`;

  try {
    const parsed = querySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });

    if (!parsed.success) {
      return errorResponse({
        status: 400,
        requestId,
        message: "Invalid query",
        retryable: false,
        details: parsed.error.flatten(),
      });
    }

    const query = normalizeFoodQuery(parsed.data.q);

    if (!query) {
      return errorResponse({
        status: 400,
        requestId,
        message: "Query is empty after normalization",
        retryable: false,
      });
    }

    const supabase = createSupabaseServiceClient();

    const [foodsResult, synonymsResult] = await Promise.all([
      supabase
        .from("food_items")
        .select("id,name_ja,category,searchable_name")
        .ilike("searchable_name", `%${query}%`)
        .limit(20),
      supabase
        .from("food_synonyms")
        .select("food_id,searchable_synonym")
        .ilike("searchable_synonym", `%${query}%`)
        .limit(40),
    ]);

    if (foodsResult.error || synonymsResult.error) {
      throw new Error(
        foodsResult.error?.message ?? synonymsResult.error?.message ?? "Search failed",
      );
    }

    const foods = (foodsResult.data ?? []) as FoodItemRow[];
    const synonyms = (synonymsResult.data ?? []) as FoodSynonymRow[];

    const synonymMap = new Map<number, string[]>();
    for (const synonym of synonyms) {
      const list = synonymMap.get(synonym.food_id) ?? [];
      list.push(synonym.searchable_synonym);
      synonymMap.set(synonym.food_id, list);
    }

    const items = foods
      .map((food) => {
        const baseScore = scoreMatch(query, food.searchable_name);
        const synonymScore = Math.max(
          0,
          ...(synonymMap.get(food.id) ?? []).map((value) => scoreMatch(query, value) * 0.95),
        );

        return {
          food_id: food.id,
          name_ja: food.name_ja,
          category: food.category,
          score: Math.max(baseScore, synonymScore),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const body: FoodSearchResponse = { items };
    return NextResponse.json(body, { status: 200 });
  } catch {
    const body: CommonApiErrorResponse = {
      error: {
        code: "internal_error",
        message: "Unexpected server error",
        request_id: requestId,
        retryable: false,
      },
    };

    return NextResponse.json(body, { status: 500 });
  }
}
