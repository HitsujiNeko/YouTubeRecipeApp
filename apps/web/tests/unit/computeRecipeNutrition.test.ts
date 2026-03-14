import { describe, expect, it } from "vitest";

import { computeRecipeNutrition } from "@/lib/nutrition/computeRecipeNutrition";

describe("computeRecipeNutrition", () => {
  it("computes totals and unresolved items", () => {
    const result = computeRecipeNutrition({
      ingredients: [
        { id: "ing-1", name: "鶏むね肉", quantity_text: "200g" },
        { id: "ing-2", name: "油", quantity_text: "適量" },
      ],
      matches: [
        { ingredient_id: "ing-1", matched_food_id: 10, grams: 200, match_score: 0.9 },
        { ingredient_id: "ing-2", matched_food_id: 20, grams: null, match_score: 0.5 },
      ],
      nutrients: [{ food_id: 10, kcal: 110, protein_g: 23, fat_g: 1.5, carbs_g: 0, salt_g: 0.1 }],
    });

    expect(result.totals).toEqual({
      kcal: 220,
      protein_g: 46,
      fat_g: 3,
      carbs_g: 0,
      salt_g: 0.2,
    });
    expect(result.coverage).toBe(0.5);
    expect(result.confidence).toBe(0.74);
    expect(result.unresolved).toEqual([
      {
        ingredient_id: "ing-2",
        name: "油",
        reason: "grams is missing or invalid",
      },
    ]);
  });
});
