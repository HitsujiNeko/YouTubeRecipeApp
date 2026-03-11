import { getServerEnv } from "@/lib/env";

const TIMEDTEXT_BASE_URL = "https://www.youtube.com/api/timedtext";
const MAX_TRANSCRIPT_LENGTH = 15_000;
const REQUEST_HEADERS = {
  "accept-language": "ja,en-US;q=0.9,en;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
} as const;

export type FetchYouTubeTranscriptOptions = {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  languages?: string[];
};

const DEFAULT_TIMEOUT_MS = 5_000;

function buildLanguageCandidates(language: string): string[] {
  const normalized = language.trim().toLowerCase();
  const candidates = [normalized, "ja", "en"];
  return [...new Set(candidates.filter((item) => item.length > 0))];
}

function normalizeTranscriptText(text: string): string {
  if (!text) {
    return "";
  }

  const merged = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\s*音楽\s*\]|\[\s*拍手\s*\]/g, "")
    .trim();

  return merged.length > MAX_TRANSCRIPT_LENGTH ? merged.slice(0, MAX_TRANSCRIPT_LENGTH) : merged;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function toPlainTextFromVtt(vtt: string): string {
  const lines = vtt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("WEBVTT"))
    .filter((line) => !/^\d+$/.test(line))
    .filter(
      (line) => !/^\d{2}:\d{2}(?::\d{2})?\.\d{3}\s+-->\s+\d{2}:\d{2}(?::\d{2})?\.\d{3}$/.test(line),
    );

  return normalizeTranscriptText(lines.join("\n"));
}

function toPlainTextFromXml(xml: string): string {
  const chunks: string[] = [];
  const textNodePattern = /<text\b[^>]*>([\s\S]*?)<\/text>/g;
  let match = textNodePattern.exec(xml);

  while (match) {
    const chunk = decodeHtmlEntities(match[1]).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    match = textNodePattern.exec(xml);
  }

  return normalizeTranscriptText(chunks.join("\n"));
}

function toPlainTextFromJson3(jsonText: string): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return "";
  }

  if (!parsed || typeof parsed !== "object") {
    return "";
  }

  const events = (parsed as { events?: Array<{ segs?: Array<{ utf8?: string }> }> }).events;

  if (!Array.isArray(events)) {
    return "";
  }

  const chunks: string[] = [];

  for (const event of events) {
    if (!Array.isArray(event.segs)) {
      continue;
    }

    const text = event.segs
      .map((segment) => segment.utf8 ?? "")
      .join("")
      .trim();

    if (text.length > 0) {
      chunks.push(text);
    }
  }

  return normalizeTranscriptText(chunks.join("\n"));
}

function parseTimedtextBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("{")) {
    const json3Text = toPlainTextFromJson3(trimmed);
    if (json3Text.length > 0) {
      return json3Text;
    }
  }

  if (trimmed.includes("<transcript") || trimmed.includes("<text")) {
    const xmlText = toPlainTextFromXml(trimmed);
    if (xmlText.length > 0) {
      return xmlText;
    }
  }

  return toPlainTextFromVtt(trimmed);
}

function buildTimedtextUrls(videoId: string, lang: string): URL[] {
  const urlParamsList: Array<Record<string, string>> = [
    { v: videoId, lang, fmt: "vtt" },
    { v: videoId, lang, kind: "asr", fmt: "vtt" },
    { v: videoId, lang, fmt: "json3" },
    { v: videoId, lang, kind: "asr", fmt: "json3" },
    { v: videoId, lang },
    { v: videoId, lang, kind: "asr" },
  ];

  return urlParamsList.map((params) => {
    const url = new URL(TIMEDTEXT_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url;
  });
}

async function fetchWithTimeout(
  url: URL,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(url, {
      method: "GET",
      signal: controller.signal,
      headers: REQUEST_HEADERS,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * timedtext endpoint から字幕テキストのみを取得する。
 * 取得できない場合は null を返して継続可能にする。
 */
export async function fetchYouTubeTranscript(
  videoId: string,
  language: string,
  options: FetchYouTubeTranscriptOptions = {},
): Promise<string | null> {
  getServerEnv();

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const languages = options.languages ?? buildLanguageCandidates(language);

  for (const lang of languages) {
    for (const url of buildTimedtextUrls(videoId, lang)) {
      try {
        const response = await fetchWithTimeout(url, timeoutMs, fetchFn);

        if (!response.ok) {
          continue;
        }

        const body = await response.text();
        const transcript = parseTimedtextBody(body);

        if (transcript.length > 0) {
          return transcript;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}
