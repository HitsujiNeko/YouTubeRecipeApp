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
  videoSourceResult?: { data: { id: string } | null; error: { message: string } | null };
  recipeResult?: {
    data: { id: string; extraction_confidence: number | null } | null;
    error: { message: string } | null;
  };
}): MockSupabase {
  const videoSourceResult = params.videoSourceResult ?? { data: { id: "source-1" }, error: null };
  const recipeResult = params.recipeResult ?? {
    data: { id: "recipe-1", extraction_confidence: 0 },
    error: null,
  };

  const upsertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(videoSourceResult),
  };

  const insertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(recipeResult),
  };

  const from = vi.fn((tableName: string) => {
    if (tableName === "video_sources") {
      return {
        upsert: vi.fn().mockReturnValue(upsertChain),
      };
    }

    if (tableName === "recipes") {
      return {
        insert: vi.fn().mockReturnValue(insertChain),
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
      extraction_confidence: 0,
      nutrition: null,
    });
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
});
