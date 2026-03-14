import { describe, expect, it } from "vitest";

import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

describe("parseYouTubeVideoId", () => {
  it("parses watch URL", () => {
    const id = parseYouTubeVideoId("https://www.youtube.com/watch?v=WLfTFCKqANA");
    expect(id).toBe("WLfTFCKqANA");
  });

  it("parses watch URL with extra params", () => {
    const id = parseYouTubeVideoId(
      "https://www.youtube.com/watch?v=WLfTFCKqANA&list=PL000000&t=17s",
    );
    expect(id).toBe("WLfTFCKqANA");
  });

  it("parses youtu.be URL", () => {
    const id = parseYouTubeVideoId("https://youtu.be/WLfTFCKqANA");
    expect(id).toBe("WLfTFCKqANA");
  });

  it("parses shorts URL", () => {
    const id = parseYouTubeVideoId("https://www.youtube.com/shorts/WLfTFCKqANA");
    expect(id).toBe("WLfTFCKqANA");
  });

  it("parses embed URL", () => {
    const id = parseYouTubeVideoId("https://www.youtube.com/embed/WLfTFCKqANA");
    expect(id).toBe("WLfTFCKqANA");
  });

  it("returns null for invalid URL", () => {
    const id = parseYouTubeVideoId("not-a-url");
    expect(id).toBeNull();
  });

  it("returns null for non-youtube URL", () => {
    const id = parseYouTubeVideoId("https://example.com/watch?v=WLfTFCKqANA");
    expect(id).toBeNull();
  });
});
