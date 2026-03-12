import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/recipes/import/route";
import { LlmStructureError } from "@/lib/extraction/llmStructure";
import { YouTubeUpstreamError } from "@/lib/youtube/fetchYouTubeMetadata";

const parseYouTubeVideoIdMock = vi.fn();
const fetchYouTubeMetadataMock = vi.fn();
const fetchYouTubeTranscriptMock = vi.fn();
const structureRecipeWithLlmMock = vi.fn();
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

vi.mock("@/lib/youtube/fetchYouTubeTranscript", () => ({
  fetchYouTubeTranscript: (...args: unknown[]) => fetchYouTubeTranscriptMock(...args),
}));

vi.mock("@/lib/extraction/llmStructure", async () => {
  const actual = await vi.importActual<typeof import("@/lib/extraction/llmStructure")>(
    "@/lib/extraction/llmStructure",
  );

  return {
    ...actual,
    structureRecipeWithLlm: (...args: unknown[]) => structureRecipeWithLlmMock(...args),
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
    data: {
      id: string;
      extraction_confidence: number | null;
      extraction_status?: string | null;
    } | null;
    error: { message: string; code?: string; details?: string } | null;
  };
  insertedIngredients?: Array<{ id: string; name: string; quantity_text: string | null }>;
  foodSearchResultsByQuery?: Record<string, Array<{ id: number; searchable_name: string }>>;
}): MockSupabase {
  const videoSourceResult = params.videoSourceResult ?? { data: { id: "source-1" }, error: null };
  const recipeResult = params.recipeResult ?? {
    data: { id: "recipe-1", extraction_confidence: 0, extraction_status: "no_source" },
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
  const extractionRunsInsert = vi.fn().mockResolvedValue({ data: [], error: null });
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

    if (tableName === "extraction_runs") {
      return {
        insert: extractionRunsInsert,
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
    fetchYouTubeTranscriptMock.mockResolvedValue(null);
    structureRecipeWithLlmMock.mockResolvedValue({
      ingredients: [],
      steps: [],
      metadata: { provider: "gemini", modelName: "gemini-2.0-flash-lite" },
    });
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
      extraction_status: "no_source",
      nutrition: null,
    });
    expect(body.extraction_confidence).toBe(0);
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
    fetchYouTubeTranscriptMock.mockResolvedValue(null);
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
    fetchYouTubeTranscriptMock.mockResolvedValue(null);
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
    fetchYouTubeTranscriptMock.mockResolvedValue(null);
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
    fetchYouTubeTranscriptMock.mockResolvedValue(null);
    fetchYouTubeMetadataMock.mockRejectedValue(new Error("Invalid server environment variables"));

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("upstream_unavailable");
    expect(body.error.details.provider).toBe("config");
  });

  it("persists extracted ingredients/steps and returns extraction_status", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeTranscriptMock.mockResolvedValue("鶏むね肉 200g\n手順: 焼く");
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
    structureRecipeWithLlmMock.mockResolvedValue({
      ingredients: [
        {
          name: "鶏むね肉",
          quantity_text: "200g",
          group_label: null,
          is_optional: false,
          confidence: 0.75,
        },
        {
          name: "塩",
          quantity_text: "少々",
          group_label: null,
          is_optional: false,
          confidence: 0.75,
        },
      ],
      steps: [
        {
          text: "下味をつける",
          timestamp_sec: null,
          timer_sec: null,
          is_ai_inferred: false,
          confidence: 0.75,
        },
        {
          text: "焼く",
          timestamp_sec: 120,
          timer_sec: null,
          is_ai_inferred: false,
          confidence: 0.75,
        },
      ],
      metadata: { provider: "gemini", modelName: "gemini-2.0-flash-lite" },
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
    expect(body.extraction_status).toBe("success");
    expect(body.extraction_confidence).toBeGreaterThan(0);

    const calledTables = mockSupabase.from.mock.calls.map((call) => call[0]);
    expect(calledTables).toContain("recipe_ingredients");
    expect(calledTables).toContain("recipe_steps");
    expect(calledTables).toContain("recipe_ingredient_matches");
    expect(calledTables).toContain("extraction_runs");

    const extractionRunsCallIndex = mockSupabase.from.mock.calls.findIndex(
      (call) => call[0] === "extraction_runs",
    );
    const extractionRunsInsertArgs =
      extractionRunsCallIndex >= 0
        ? (mockSupabase.from.mock.results[extractionRunsCallIndex]?.value.insert.mock.calls[0]?.[0] as
            | { status?: string; model_name?: string }
            | undefined)
        : undefined;

    expect(extractionRunsInsertArgs?.status).toBe("success");
    expect(extractionRunsInsertArgs?.model_name).toBe("gemini-2.0-flash-lite");

    const recipesUpdateArgs = mockSupabase.from.mock.results.find(
      (result) => result.type === "return" && result.value.update,
    )?.value.update.mock.calls[0]?.[0];
    expect(recipesUpdateArgs.extraction_notes).toContain("llm_result=success");
  });

  it("falls back to rule extraction when LLM payload validation fails", async () => {
    parseYouTubeVideoIdMock.mockReturnValue("WLfTFCKqANA");
    fetchYouTubeTranscriptMock.mockResolvedValue("テキスト");
    fetchYouTubeMetadataMock.mockResolvedValue({
      title: "Sample",
      description: "材料\n鶏むね肉 200g",
      channelTitle: "Channel",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });
    structureRecipeWithLlmMock.mockRejectedValue(
      new LlmStructureError("invalid", "invalid_payload"),
    );

    const mockSupabase = createMockSupabase({});
    createSupabaseServiceClientMock.mockReturnValue(mockSupabase);

    const response = await POST(
      createRequest({ url: "https://www.youtube.com/watch?v=WLfTFCKqANA" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extraction_status).toBe("partial");

    const calledTables = mockSupabase.from.mock.calls.map((call) => call[0]);
    expect(calledTables).toContain("extraction_runs");
  });
});
