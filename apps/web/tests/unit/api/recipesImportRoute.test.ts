import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/recipes/import/route";
import { YouTubeUpstreamError } from "@/lib/youtube/fetchYouTubeMetadata";

const parseYouTubeVideoIdMock = vi.fn();
const fetchYouTubeMetadataMock = vi.fn();
const createSupabaseServiceClientMock = vi.fn();

vi.mock("@/lib/youtube/parseYouTubeVideoId", () => ({
  parseYouTubeVideoId: (...args: unknown[]) => parseYouTubeVideoIdMock(...args),
}));

vi.mock("@/lib/youtube/fetchYouTubeMetadata", async () => {
  const actual = await vi.importActual<typeof import("@/lib/youtube/fetchYouTubeMetadata")>(
    "@/lib/youtube/fetchYouTubeMetadata",
  );

  return {
    ...actual,
    fetchYouTubeMetadata: (...args: unknown[]) => fetchYouTubeMetadataMock(...args),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceClient: () => createSupabaseServiceClientMock(),
}));

type MockSupabase = {
  from: ReturnType<typeof vi.fn>;
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/recipes/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createMockSupabase(params: {
  videoSourceResult?: {
    data: { id: string } | null;
    error: { message: string; code?: string; details?: string } | null;
  };
  recipeResult?: {
    data: { id: string; extraction_confidence: number | null } | null;
    error: { message: string; code?: string; details?: string } | null;
  };
  insertedIngredients?: Array<{ id: string; name: string; quantity_text: string | null }>;
  foodSearchResultsByQuery?: Record<string, Array<{ id: number; searchable_name: string }>>;
}): MockSupabase {
  const videoSourceResult = params.videoSourceResult ?? { data: { id: "source-1" }, error: null };
  const recipeResult = params.recipeResult ?? {
    data: { id: "recipe-1", extraction_confidence: 0 },
    error: null,
  };
  const insertedIngredients = params.insertedIngredients ?? [];
  const foodSearchResultsByQuery = params.foodSearchResultsByQuery ?? {};

  const upsertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(videoSourceResult),
  };

  const insertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(recipeResult),
  };

  const ingredientInsertSelect = vi
    .fn()
    .mockResolvedValue({ data: insertedIngredients, error: null });
  const ingredientInsert = vi.fn().mockReturnValue({
    select: ingredientInsertSelect,
  });

  const foodItemsQuery = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockImplementation((_field: string, pattern: string) => ({
      limit: vi.fn().mockResolvedValue({
        data: foodSearchResultsByQuery[pattern] ?? [],
        error: null,
      }),
    })),
  };

  const recipeStepsInsert = vi.fn().mockResolvedValue({ data: [], error: null });
  const matchesUpsert = vi.fn().mockResolvedValue({ data: [], error: null });
  const recipesUpdateEq = vi.fn().mockResolvedValue({ data: [], error: null });
  const recipesUpdate = vi.fn().mockReturnValue({ eq: recipesUpdateEq });

  const from = vi.fn((tableName: string) => {
    if (tableName === "video_sources") {
      return {
        upsert: vi.fn().mockReturnValue(upsertChain),
      };
    }

    if (tableName === "recipes") {
      return {
        insert: vi.fn().mockReturnValue(insertChain),
        update: recipesUpdate,
      };
    }

    if (tableName === "recipe_ingredients") {
      return {
        insert: ingredientInsert,
      };
    }

    if (tableName === "food_items") {
      return foodItemsQuery;
    }

    if (tableName === "recipe_ingredient_matches") {
      return {
        upsert: matchesUpsert,
      };
    }

    if (tableName === "recipe_steps") {
      return {
        insert: recipeStepsInsert,
      };
    }

    throw new Error(`Unexpected table: ${tableName}`);
  });

  return { from };
}

describe("POST /api/recipes/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with recipe_id for valid URL", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockResolvedValue({
      title: "Sample",
      description: null,
      channelTitle: "Channel",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });

    const mockSupabase = createMockSupabase({});
    createSupabaseServiceClientMock.mockReturnValue(mockSupabase);

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      recipe_id: "recipe-1",
      nutrition: null,
    });
    expect(body.extraction_confidence).toBe(0.2);
  });

  it("returns 400 for unsupported YouTube URL format", async () => {
    parseYouTubeVideoIdMock.mockReturnValue(null);

    const response = await POST(createRequest({ url: "https://example.com/video" }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("bad_request");
    expect(body.error.retryable).toBe(false);
  });

  it("returns 429 when upstream quota is exceeded", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockRejectedValue(
      new YouTubeUpstreamError("YouTube API quota exceeded", 429, true),
    );

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("too_many_requests");
    expect(body.error.retryable).toBe(true);
  });

  it("returns 503 when upstream service is unavailable", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockRejectedValue(
      new YouTubeUpstreamError("YouTube API timeout", 503, true),
    );

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("upstream_unavailable");
    expect(body.error.retryable).toBe(true);
  });

  it("returns 503 upstream_unavailable when supabase schema is not initialized", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockResolvedValue({
      title: "Sample",
      description: null,
      channelTitle: "Channel",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });

    const mockSupabase = createMockSupabase({
      videoSourceResult: {
        data: null,
        error: {
          message: 'relation "video_sources" does not exist',
          code: "42P01",
        },
      },
    });
    createSupabaseServiceClientMock.mockReturnValue(mockSupabase);

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("upstream_unavailable");
    expect(body.error.details.provider).toBe("supabase");
  });

  it("returns 503 upstream_unavailable when server env is invalid", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockRejectedValue(new Error("Invalid server environment variables"));

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("upstream_unavailable");
    expect(body.error.details.provider).toBe("config");
  });

  it("persists parsed ingredients, steps, and auto matches from description", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeMetadataMock.mockResolvedValue({
      title: "鶏むね肉レシピ",
      description: [
        "材料",
        "鶏むね肉 200g",
        "塩 少々",
        "手順",
        "1. 下味をつける",
        "2:00 焼く",
      ].join("\n"),
      channelTitle: "Channel",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });

    const mockSupabase = createMockSupabase({
      insertedIngredients: [
        { id: "ing-1", name: "鶏むね肉", quantity_text: "200g" },
        { id: "ing-2", name: "塩", quantity_text: "少々" },
      ],
      foodSearchResultsByQuery: {
        "%鶏むね肉%": [{ id: 101, searchable_name: "鶏むね肉" }],
        "%塩%": [{ id: 201, searchable_name: "食塩" }],
      },
    });
    createSupabaseServiceClientMock.mockReturnValue(mockSupabase);

    const response = await POST(
      createRequest({
        url: "https://www.youtube.com/watch?v=WLfTFCKqANA",
        options: { allow_ai_infer_steps: false, compute_nutrition: true },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extraction_confidence).toBeGreaterThan(0);

    const calledTables = mockSupabase.from.mock.calls.map((call) => call[0]);
    expect(calledTables).toContain("recipe_ingredients");
    expect(calledTables).toContain("recipe_steps");
    expect(calledTables).toContain("recipe_ingredient_matches");
  });
});
