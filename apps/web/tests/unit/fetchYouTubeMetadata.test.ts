import { describe, expect, it, vi } from "vitest";
import { fetchYouTubeMetadata } from "@/lib/youtube/fetchYouTubeMetadata";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchYouTubeMetadata", () => {
  it("returns title on successful response", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        items: [
          {
            snippet: {
              title: "Chicken Curry",
              description: "How to make curry",
              channelTitle: "Recipe Channel",
              thumbnails: {
                high: { url: "https://example.com/thumb.jpg" },
              },
            },
          },
        ],
      }),
    );

    const result = await fetchYouTubeMetadata("WLfTFCKqANA", {
      apiKey: "test-key",
      fetchFn,
      sleepFn: vi.fn().mockResolvedValue(undefined),
      randomFn: () => 0,
    });

    expect(result).toEqual({
      videoId: "WLfTFCKqANA",
      title: "Chicken Curry",
      description: "How to make curry",
      channelTitle: "Recipe Channel",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable 503 and then succeeds", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({ error: { message: "unavailable" } }, 503))
      .mockResolvedValueOnce(
        createJsonResponse({
          items: [
            {
              snippet: {
                title: "Recovered Title",
              },
            },
          ],
        }),
      );

    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const result = await fetchYouTubeMetadata("WLfTFCKqANA", {
      apiKey: "test-key",
      fetchFn,
      sleepFn,
      randomFn: () => 0,
    });

    expect(result.title).toBe("Recovered Title");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledTimes(1);
    expect(sleepFn).toHaveBeenCalledWith(500);
  });

  it("retries on timeout-style AbortError", async () => {
    const abortError = new Error("Request timed out");
    abortError.name = "AbortError";

    const fetchFn = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(
        createJsonResponse({
          items: [
            {
              snippet: {
                title: "After Timeout",
              },
            },
          ],
        }),
      );

    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const result = await fetchYouTubeMetadata("WLfTFCKqANA", {
      apiKey: "test-key",
      fetchFn,
      sleepFn,
      randomFn: () => 0,
    });

    expect(result.title).toBe("After Timeout");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledWith(500);
  });

  it("throws without retrying for non-retryable status", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({ error: {} }, 400));

    await expect(
      fetchYouTubeMetadata("WLfTFCKqANA", {
        apiKey: "test-key",
        fetchFn,
      }),
    ).rejects.toThrow("status 400");

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("throws after retry limit for repeated 429", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse({ error: { message: "rate limit" } }, 429));

    const sleepFn = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchYouTubeMetadata("WLfTFCKqANA", {
        apiKey: "test-key",
        fetchFn,
        sleepFn,
        randomFn: () => 0,
      }),
    ).rejects.toThrow("retryable status: 429");

    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(sleepFn).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenNthCalledWith(1, 500);
    expect(sleepFn).toHaveBeenNthCalledWith(2, 1000);
    expect(sleepFn).toHaveBeenNthCalledWith(3, 2000);
  });
});
