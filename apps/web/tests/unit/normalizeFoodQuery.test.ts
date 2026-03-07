import { describe, expect, it } from "vitest";
import { normalizeFoodQuery } from "@/lib/nutrition/normalizeFoodQuery";

describe("normalizeFoodQuery", () => {
  it("normalizes spaces and width", () => {
    expect(normalizeFoodQuery("  鶏 むね 肉  ")).toBe("鶏むね肉");
    expect(normalizeFoodQuery("ﾄﾘﾑﾈ")).toBe("とりむね");
  });

  it("converts katakana to hiragana", () => {
    expect(normalizeFoodQuery("トリム")).toBe("とりむ");
  });
});
