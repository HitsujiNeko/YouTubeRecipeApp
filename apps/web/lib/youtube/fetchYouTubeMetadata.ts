import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3/videos";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_DELAYS_MS = [500, 1_000, 2_000] as const;

const youtubeResponseSchema = z.object({
  items: z
    .array(
      z.object({
        snippet: z
          .object({
            title: z.string(),
            description: z.string().optional(),
            channelTitle: z.string().optional(),
            thumbnails: z
              .object({
                maxres: z.object({ url: z.string().url() }).optional(),
                high: z.object({ url: z.string().url() }).optional(),
                medium: z.object({ url: z.string().url() }).optional(),
                default: z.object({ url: z.string().url() }).optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

export type YouTubeVideoMetadata = {
  videoId: string;
  title: string;
  description: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
};

export type FetchYouTubeMetadataOptions = {
  apiKey?: string;
  timeoutMs?: number;
  retryDelaysMs?: number[];
  fetchFn?: typeof fetch;
  sleepFn?: (milliseconds: number) => Promise<void>;
  randomFn?: () => number;
  apiBaseUrl?: string;
};

type RetryableError = Error & { retryable?: boolean };

export class YouTubeUpstreamError extends Error {
  statusCode: number;
  retryable: boolean;
  provider: "youtube";

  constructor(message: string, statusCode: number, retryable: boolean) {
    super(message);
    this.name = "YouTubeUpstreamError";
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.provider = "youtube";
  }
}

function createRetryableError(message: string): RetryableError {
  const error = new Error(message) as RetryableError;
  error.retryable = true;
  return error;
}

function toYouTubeUpstreamError(error: unknown): YouTubeUpstreamError | null {
  if (error instanceof YouTubeUpstreamError) {
    return error;
  }

  return null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status === 503;
}

type YouTubeSnippet = z.infer<typeof youtubeResponseSchema>["items"][number]["snippet"];
type YouTubeThumbnails = NonNullable<YouTubeSnippet>["thumbnails"];

function pickThumbnailUrl(thumbnails: YouTubeThumbnails | undefined): string | null {
  if (!thumbnails) {
    return null;
  }

  return (
    thumbnails.maxres?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    null
  );
}

function toMetadata(
  videoId: string,
  payload: z.infer<typeof youtubeResponseSchema>,
): YouTubeVideoMetadata {
  const firstItem = payload.items[0];
  const snippet = firstItem?.snippet;

  if (!snippet?.title) {
    throw new YouTubeUpstreamError("YouTube metadata missing snippet.title", 503, true);
  }

  return {
    videoId,
    title: snippet.title,
    description: snippet.description ?? null,
    channelTitle: snippet.channelTitle ?? null,
    thumbnailUrl: pickThumbnailUrl(snippet.thumbnails),
  };
}

function jitterDelay(baseDelayMs: number, randomFn: () => number): number {
  const jitterRangeMs = Math.floor(baseDelayMs * 0.2);
  return baseDelayMs + Math.floor(randomFn() * (jitterRangeMs + 1));
}

async function fetchWithTimeout(
  input: URL,
  init: RequestInit,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches video metadata (title/description/channel/thumbnail) from YouTube Data API.
 * Applies timeout and retry policy required by NFR.
 */
export async function fetchYouTubeMetadata(
  videoId: string,
  options: FetchYouTubeMetadataOptions = {},
): Promise<YouTubeVideoMetadata> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("Invalid YouTube video ID");
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryDelaysMs = options.retryDelaysMs ?? [...DEFAULT_RETRY_DELAYS_MS];
  const fetchFn = options.fetchFn ?? fetch;
  const sleepFn =
    options.sleepFn ??
    ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const randomFn = options.randomFn ?? Math.random;
  const apiKey = options.apiKey ?? getServerEnv().YOUTUBE_DATA_API_KEY;

  const url = new URL(options.apiBaseUrl ?? YOUTUBE_API_BASE_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        { method: "GET", headers: { Accept: "application/json" } },
        timeoutMs,
        fetchFn,
      );

      if (!response.ok) {
        if (isRetryableHttpStatus(response.status)) {
          throw createRetryableError(`YouTube API retryable status: ${response.status}`);
        }

        throw new YouTubeUpstreamError(
          `YouTube API request failed with status ${response.status}`,
          response.status,
          false,
        );
      }

      const raw = await response.json();
      const parsed = youtubeResponseSchema.safeParse(raw);

      if (!parsed.success) {
        throw new YouTubeUpstreamError("Invalid YouTube API response payload", 503, true);
      }

      return toMetadata(videoId, parsed.data);
    } catch (error) {
      const upstreamError = toYouTubeUpstreamError(error);

      if (upstreamError && !upstreamError.retryable) {
        throw upstreamError;
      }

      const retryable = (error as RetryableError)?.retryable === true || isAbortError(error);
      const hasNextRetry = attempt < retryDelaysMs.length;

      if (!retryable || !hasNextRetry) {
        if (isAbortError(error)) {
          throw new YouTubeUpstreamError("YouTube API timeout", 503, true);
        }

        if (upstreamError) {
          throw upstreamError;
        }

        if (error instanceof Error) {
          throw new YouTubeUpstreamError(error.message, 503, true);
        }

        throw error;
      }

      await sleepFn(jitterDelay(retryDelaysMs[attempt], randomFn));
    }
  }

  throw new Error("Unreachable retry loop state");
}
