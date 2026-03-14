import { describe, expect, it } from "vitest";

import { hasRecipeSignalsInDescription, selectSourceMode } from "@/lib/extraction/evaluateSource";

describe("hasRecipeSignalsInDescription", () => {
  it("returns true for ingredient heading", () => {
    const result = hasRecipeSignalsInDescription("材料\n鶏むね肉 200g");
    expect(result).toBe(true);
  });

  it("returns true for quantity lines", () => {
    const result = hasRecipeSignalsInDescription("鶏むね肉 200g\n塩 少々");
    expect(result).toBe(true);
  });

  it("returns false for sns-only description", () => {
    const result = hasRecipeSignalsInDescription("チャンネル登録お願いします\nInstagramはこちら");
    expect(result).toBe(false);
  });
});

describe("selectSourceMode", () => {
  it("returns description+transcript when both sources are available", () => {
    const mode = selectSourceMode({ descriptionHasRecipe: true, transcript: "字幕" });
    expect(mode).toBe("description+transcript");
  });

  it("returns transcript when description has no recipe", () => {
    const mode = selectSourceMode({ descriptionHasRecipe: false, transcript: "字幕" });
    expect(mode).toBe("transcript");
  });

  it("returns none when both are unavailable", () => {
    const mode = selectSourceMode({ descriptionHasRecipe: false, transcript: null });
    expect(mode).toBe("none");
  });
});
