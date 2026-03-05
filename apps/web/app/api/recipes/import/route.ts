import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { fetchYouTubeMetadata, YouTubeUpstreamError } from "@/lib/youtube/fetchYouTubeMetadata";
import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

const importRequestSchema = z.object({
  url: z.string().url(),
  language: z.string().default("ja"),
  options: z
    .object({
      allow_ai_infer_steps: z.boolean().default(false),
      compute_nutrition: z.boolean().default(true),
    })
    .optional(),
});

type ErrorCode = "bad_request" | "too_many_requests" | "upstream_unavailable" | "internal_error";

function errorResponse(params: {
  status: number;
  requestId: string;
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      error: {
        code: params.code,
        message: params.message,
        request_id: params.requestId,
        retryable: params.retryable,
        ...(params.details ? { details: params.details } : {}),
      },
    },
    { status: params.status },
  );
}

export async function POST(req: NextRequest) {
  const requestId = `req_${crypto.randomUUID()}`;

  try {
    const raw = await req.json();
    const parsed = importRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Invalid request payload",
        retryable: false,
        details: parsed.error.flatten(),
      });
    }

    const { url, language } = parsed.data;
    const videoId = parseYouTubeVideoId(url);

    if (!videoId) {
      return errorResponse({
        status: 400,
        requestId,
        code: "bad_request",
        message: "Unsupported YouTube URL format",
        retryable: false,
        details: { field: "url" },
      });
    }

    const metadata = await fetchYouTubeMetadata(videoId);
    const supabase = createSupabaseServiceClient();

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const nowIso = new Date().toISOString();

    const videoSourceResult = await supabase
      .from("video_sources")
      .upsert(
        {
          platform: "youtube",
          video_id: videoId,
          canonical_url: canonicalUrl,
          channel_title: metadata.channelTitle,
          title: metadata.title,
          thumbnail_url: metadata.thumbnailUrl,
          last_refreshed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "platform,video_id" },
      )
      .select("id")
      .single();

    if (videoSourceResult.error || !videoSourceResult.data) {
      throw new Error(videoSourceResult.error?.message ?? "Failed to upsert video source");
    }

    const recipeResult = await supabase
      .from("recipes")
      .insert({
        source_id: videoSourceResult.data.id,
        language,
        title: metadata.title,
        extraction_confidence: 0,
      })
      .select("id, extraction_confidence")
      .single();

    if (recipeResult.error || !recipeResult.data) {
      throw new Error(recipeResult.error?.message ?? "Failed to create recipe");
    }

    return NextResponse.json(
      {
        recipe_id: recipeResult.data.id,
        extraction_confidence: Number(recipeResult.data.extraction_confidence ?? 0),
        nutrition: null,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof YouTubeUpstreamError) {
      if (error.statusCode === 429) {
        return errorResponse({
          status: 429,
          requestId,
          code: "too_many_requests",
          message: error.message,
          retryable: true,
          details: { provider: error.provider },
        });
      }

      return errorResponse({
        status: 503,
        requestId,
        code: "upstream_unavailable",
        message: error.message,
        retryable: true,
        details: { provider: error.provider },
      });
    }

    return errorResponse({
      status: 500,
      requestId,
      code: "internal_error",
      message: "Unexpected server error",
      retryable: false,
    });
  }
}
