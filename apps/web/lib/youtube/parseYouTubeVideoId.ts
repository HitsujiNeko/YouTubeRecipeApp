const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

function normalizeCandidate(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Parses a YouTube video id from a URL string.
 * Supports watch, shorts, embed, youtu.be, and raw 11-char video IDs.
 */
export function parseYouTubeVideoId(urlOrId: string): string | null {
  const directId = normalizeCandidate(urlOrId);
  if (directId) {
    return directId;
  }

  let parsed: URL;

  try {
    parsed = new URL(urlOrId);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null;
  }

  if (hostname.includes("youtu.be")) {
    const fromPath = normalizeCandidate(parsed.pathname.slice(1));
    return fromPath;
  }

  const fromWatch = normalizeCandidate(parsed.searchParams.get("v") ?? "");
  if (fromWatch) {
    return fromWatch;
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);

  if (pathSegments.length >= 2 && (pathSegments[0] === "shorts" || pathSegments[0] === "embed")) {
    const fromPath = normalizeCandidate(pathSegments[1]);
    return fromPath;
  }

  return null;
}
