import { describe, expect, it } from "vitest";

import { computeExtractionConfidence, decideExtractionStatus } from "@/lib/extraction/status";

describe("decideExtractionStatus", () => {
  it("returns success for >=2 ingredients and >=2 steps", () => {
    expect(
      decideExtractionStatus({
        ingredientsCount: 2,
        stepsCount: 2,
        mode: "description+transcript",
      }),
    ).toBe("success");
  });

  it("returns partial when one side exists", () => {
    expect(
      decideExtractionStatus({ ingredientsCount: 1, stepsCount: 0, mode: "description" }),
    ).toBe("partial");
  });

  it("returns no_source when mode is none and empty", () => {
    expect(decideExtractionStatus({ ingredientsCount: 0, stepsCount: 0, mode: "none" })).toBe(
      "no_source",
    );
  });
});

describe("computeExtractionConfidence", () => {
  it("applies source bonus for transcript mode", () => {
    const score = computeExtractionConfidence({
      ingredientsCount: 3,
      stepsCount: 3,
      sourceMode: "transcript",
    });

    expect(score).toBeGreaterThan(0.6);
  });

  it("returns 0 when no data", () => {
    const score = computeExtractionConfidence({
      ingredientsCount: 0,
      stepsCount: 0,
      sourceMode: "none",
    });

    expect(score).toBe(0);
  });
});
