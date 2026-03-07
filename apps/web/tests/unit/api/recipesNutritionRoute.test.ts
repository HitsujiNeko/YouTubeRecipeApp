import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/recipes/[id]/nutrition/route";

type MockSupabase = {
  from: ReturnType<typeof vi.fn>;
};

const RECIPE_ID = "77ecf1a0-4f5d-4f40-9ab2-9dd0ec9cc0f2";
const createSupabaseServiceClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceClient: () => createSupabaseServiceClientMock(),
}));

function createRequest(body?: unknown): Request {
  return new Request(`http://localhost/api/recipes/${RECIPE_ID}/nutrition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

function createMockSupabase(params?: {
  recipeExists?: boolean;
  ingredients?: Array<{ id: string; name: string; quantity_text: string | null }>;
  matches?: Array<{
    ingredient_id: string;
    matched_food_id: number | null;
    grams: number | null;
    match_score: number | null;
  }>;
  nutrients?: Array<{
    food_id: number;
    kcal: number | null;
    protein_g: number | null;
    fat_g: number | null;
    carbs_g: number | null;
    salt_g: number | null;
  }>;
}) {
  const recipeExists = params?.recipeExists ?? true;
  const ingredients = params?.ingredients ?? [
    { id: "ing-1", name: "鶏むね肉", quantity_text: "200g" },
  ];
  const matches = params?.matches ?? [
    { ingredient_id: "ing-1", matched_food_id: 10, grams: 200, match_score: 0.8 },
  ];
  const nutrients = params?.nutrients ?? [
    { food_id: 10, kcal: 110, protein_g: 23, fat_g: 1.5, carbs_g: 0, salt_g: 0.1 },
  ];

  const cacheUpsert = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table === "recipes") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: recipeExists ? { id: RECIPE_ID } : null,
          error: null,
        }),
      };
    }

    if (table === "recipe_ingredients") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: ingredients, error: null }),
      };
    }

    if (table === "recipe_ingredient_matches") {
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: matches, error: null }),
      };
    }

    if (table === "food_nutrients_per_100g") {
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: nutrients, error: null }),
      };
    }

    if (table === "recipe_nutrition_cache") {
      return {
        upsert: cacheUpsert,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return { mock: { from }, cacheUpsert };
}

describe("POST /api/recipes/{id}/nutrition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns nutrition result and updates cache", async () => {
    const { mock, cacheUpsert } = createMockSupabase();
    createSupabaseServiceClientMock.mockReturnValue(mock as MockSupabase);

    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      totals: {
        kcal: 220,
        protein_g: 46,
        fat_g: 3,
        carbs_g: 0,
        salt_g: 0.2,
      },
      confidence: 0.88,
      coverage: 1,
      unresolved: [],
    });
    expect(cacheUpsert).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when recipe is not found", async () => {
    const { mock } = createMockSupabase({ recipeExists: false });
    createSupabaseServiceClientMock.mockReturnValue(mock as MockSupabase);

    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("not_found");
    expect(body.error.retryable).toBe(false);
  });

  it("returns 400 when allow_best_effort=false and unresolved exists", async () => {
    const { mock, cacheUpsert } = createMockSupabase({
      ingredients: [
        { id: "ing-1", name: "鶏むね肉", quantity_text: "200g" },
        { id: "ing-2", name: "油", quantity_text: "適量" },
      ],
      matches: [
        { ingredient_id: "ing-1", matched_food_id: 10, grams: 200, match_score: 0.8 },
        { ingredient_id: "ing-2", matched_food_id: 20, grams: null, match_score: 0.3 },
      ],
      nutrients: [{ food_id: 10, kcal: 110, protein_g: 23, fat_g: 1.5, carbs_g: 0, salt_g: 0.1 }],
    });
    createSupabaseServiceClientMock.mockReturnValue(mock as MockSupabase);

    const response = await POST(createRequest({ allow_best_effort: false }) as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("bad_request");
    expect(cacheUpsert).not.toHaveBeenCalled();
  });
});
