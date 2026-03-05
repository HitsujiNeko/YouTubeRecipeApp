import type { RecipeDetailView } from "@/types/models";

function getDefaultRecipe(id: string): RecipeDetailView {
  return {
    id,
    title: "高たんぱく鶏むねソテー",
    sourceUrl: "https://www.youtube.com/watch?v=WLfTFCKqANA",
    thumbnailUrl: "https://i.ytimg.com/vi/WLfTFCKqANA/hqdefault.jpg",
    nutrition: {
      kcal: 520,
      proteinG: 34.1,
      fatG: 18.2,
      carbsG: 49.8,
      saltG: 1.9,
      confidence: "medium",
      coverage: 72,
      unresolvedCount: 1,
    },
    ingredients: [
      "鶏むね肉 1枚",
      "しょうゆ 大さじ1",
      "みりん 大さじ1",
      "にんにく 1片",
      "油 適量 (未確定)",
    ],
    steps: [
      "鶏むね肉をそぎ切りにする",
      "調味料を混ぜ、鶏むね肉を10分漬ける",
      "フライパンで中火3分、裏返して2分焼く",
      "火を止めて1分休ませ、皿に盛る",
    ],
  };
}

export function getMockRecipeDetail(id: string): RecipeDetailView {
  if (id === "sample-2") {
    return {
      id,
      title: "豆腐チキンナゲット",
      sourceUrl: "https://www.youtube.com/watch?v=QH2-TGUlwu4",
      thumbnailUrl: "https://i.ytimg.com/vi/QH2-TGUlwu4/hqdefault.jpg",
      nutrition: {
        kcal: 460,
        proteinG: 29.4,
        fatG: 14.3,
        carbsG: 52.7,
        saltG: 1.6,
        confidence: "high",
        coverage: 88,
        unresolvedCount: 0,
      },
      ingredients: ["鶏ひき肉 200g", "木綿豆腐 150g", "片栗粉 大さじ2", "しょうゆ 小さじ2"],
      steps: [
        "豆腐を水切りしてボウルに入れる",
        "鶏ひき肉と調味料を混ぜて成形する",
        "フライパンで両面をこんがり焼く",
      ],
    };
  }

  return getDefaultRecipe(id);
}
