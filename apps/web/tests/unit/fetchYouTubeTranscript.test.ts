import { describe, expect, it, vi } from "vitest";

import { fetchYouTubeTranscript } from "@/lib/youtube/fetchYouTubeTranscript";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    OPENAI_API_KEY: "openai",
    YOUTUBE_DATA_API_KEY: "youtube",
    NEXT_PUBLIC_APP_NAME: "app",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  }),
}));

function textResponse(body: string, status = 200, contentType = "text/plain"): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

describe("fetchYouTubeTranscript", () => {
  it("parses transcript from vtt", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        textResponse(
          [
            "WEBVTT",
            "",
            "00:00.000 --> 00:01.000",
            "なすを切る",
            "",
            "00:01.000 --> 00:02.000",
            "油で焼く",
          ].join("\n"),
        ),
      );

    const result = await fetchYouTubeTranscript("nMEzehxzBWU", "ja", {
      fetchFn,
      languages: ["ja"],
    });

    expect(result).toContain("なすを切る");
    expect(result).toContain("油で焼く");
  });

  it("falls back to xml transcript when vtt is unavailable", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(
        textResponse(
          '<transcript><text start="0.1" dur="1.2">なす3本</text><text start="2.0" dur="1.0">揚げ焼きにする</text></transcript>',
          200,
          "application/xml",
        ),
      );

    const result = await fetchYouTubeTranscript("nMEzehxzBWU", "ja", {
      fetchFn,
      languages: ["ja"],
    });

    expect(result).toContain("なす3本");
    expect(result).toContain("揚げ焼きにする");
  });

  it("parses json3 transcript", async () => {
    const json3 = JSON.stringify({
      events: [
        {
          segs: [{ utf8: "大葉を刻む" }],
        },
        {
          segs: [{ utf8: "めんつゆを混ぜる" }],
        },
      ],
    });

    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse("", 404))
      .mockResolvedValueOnce(textResponse(json3, 200, "application/json"));

    const result = await fetchYouTubeTranscript("nMEzehxzBWU", "ja", {
      fetchFn,
      languages: ["ja"],
    });

    expect(result).toContain("大葉を刻む");
    expect(result).toContain("めんつゆを混ぜる");
  });

  it("returns null for invalid video id", async () => {
    const fetchFn = vi.fn<typeof fetch>();
    const result = await fetchYouTubeTranscript("invalid", "ja", {
      fetchFn,
      languages: ["ja"],
    });

    expect(result).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
