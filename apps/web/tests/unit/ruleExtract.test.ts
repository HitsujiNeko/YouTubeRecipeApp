import { describe, expect, it } from "vitest";
import { extractRecipeByRules } from "@/lib/extraction/ruleExtract";

describe("extractRecipeByRules", () => {
  it("extracts ingredients and at least one step from a typical recipe description", () => {
    const description = [
      "★今回のレシピはこちら",
      "材料",
      "ほうれん草…200g",
      "豚バラ肉…160g",
      "醤油…大さじ1",
      "ほうれん草1袋180～200gを切り、豚バラ肉160g入れ炒め、醤油大さじ1入れ完成",
    ].join("\n");

    const result = extractRecipeByRules(description);

    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty arrays for null description", () => {
    const result = extractRecipeByRules(null);

    expect(result.ingredients).toEqual([]);
    expect(result.steps).toEqual([]);
  });

  it("does not treat '味変' line or instruction sentence as ingredient", () => {
    const description = [
      "★今回のレシピはこちら",
      "ほうれん草…200g",
      "★味変で適量",
      "ほうれん草1袋180～200gを切り、水に15分つけておく",
    ].join("\n");

    const result = extractRecipeByRules(description);

    expect(result.ingredients.some((item) => item.name.includes("味変"))).toBe(false);
    expect(
      result.ingredients.some(
        (item) => item.name.includes("切り") || item.name.includes("つけておく"),
      ),
    ).toBe(false);
  });

  it("splits one-line instructions into multiple steps", () => {
    const description = [
      "オリーブオイル大さじ1でにんにく10g、輪切り唐辛子適量入れ炒め、塩コショウした豚バラ肉160g入れ炒め、醤油大さじ1、お酢小さじ1、味の素4振り入れ炒め、水気を絞ったほうれん草入れ炒め完成",
    ].join("\n");

    const result = extractRecipeByRules(description);

    expect(result.steps.length).toBeGreaterThanOrEqual(3);
  });
});
