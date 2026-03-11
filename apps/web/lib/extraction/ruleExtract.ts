import type { StructuredIngredient, StructuredStep } from "@/lib/extraction/types";

const INGREDIENT_HEADING_PATTERN = /(材料|ingredients?|今回のレシピ)/i;
const STEP_HEADING_PATTERN = /(作り方|手順|instructions?|steps?|method)/i;
const URL_PATTERN = /^https?:\/\//i;
const QUANTITY_PATTERN =
  /(\d+(?:\.\d+)?\s*(?:g|kg|ml|cc|個|本|枚)|大さじ\s*\d+(?:\.\d+)?|小さじ\s*\d+(?:\.\d+)?|適量|少々)/i;
const COOKING_VERB_PATTERN = /完成|炒め|焼き|煮|茹で|混ぜ|入れ|つける|切る|置く|加熱|揉み|下味|絞っ|沸か|注ぎ|serve|mix|cook/i;

function stripBulletPrefix(line: string): string {
  return line.replace(/^[\s\-・●○■□◆◇▶▷►]+/, "").trim();
}

function normalizeIngredientName(value: string): string {
  return value.replace(/[…・:：]+$/g, "").replace(/^★+/, "").trim();
}

function isClearlyNotIngredientLine(line: string): boolean {
  const cleaned = stripBulletPrefix(line);

  if (/^★?味変/i.test(cleaned)) {
    return true;
  }

  if (/^[-ー]{5,}$/.test(cleaned)) {
    return true;
  }

  if (/ダウンロード|ツイッター|インスタ|TikTok|書籍|amazon|チャンネル|仕事の依頼/i.test(cleaned)) {
    return true;
  }

  return false;
}

function parseIngredient(line: string): StructuredIngredient | null {
  const cleaned = stripBulletPrefix(line);

  if (!cleaned || URL_PATTERN.test(cleaned) || cleaned.length > 120) {
    return null;
  }

  if (isClearlyNotIngredientLine(cleaned)) {
    return null;
  }

  // 調理文は材料として解釈しない（LLM失敗時のフォールバック精度を優先）。
  if ((/、|。/.test(cleaned) && COOKING_VERB_PATTERN.test(cleaned)) || /\d+分/.test(cleaned)) {
    return null;
  }

  const quantityMatch = cleaned.match(
    /^(.*?)(?:[\s\u3000]+)(\d+(?:\.\d+)?\s*(?:g|kg|ml|cc|個|本|枚)|大さじ\s*\d+(?:\.\d+)?|小さじ\s*\d+(?:\.\d+)?|適量|少々)$/i,
  );

  if (quantityMatch) {
    const name = normalizeIngredientName(quantityMatch[1]);

    if (!name || COOKING_VERB_PATTERN.test(name)) {
      return null;
    }

    return {
      name,
      quantity_text: quantityMatch[2].trim(),
      group_label: null,
      is_optional: /味変|お好み|optional|あれば/i.test(cleaned),
      confidence: 0.65,
    };
  }

  if (!QUANTITY_PATTERN.test(cleaned)) {
    return null;
  }

  const name = normalizeIngredientName(cleaned.replace(QUANTITY_PATTERN, "").trim() || cleaned);

  if (!name || COOKING_VERB_PATTERN.test(name)) {
    return null;
  }

  return {
    name,
    quantity_text: (cleaned.match(QUANTITY_PATTERN)?.[0] ?? null) as string | null,
    group_label: null,
    is_optional: /味変|お好み|optional|あれば/i.test(cleaned),
    confidence: 0.55,
  };
}

function splitStepText(text: string): string[] {
  const parts = text
    .split(/、|。/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (parts.length <= 1) {
    return [text];
  }

  return parts;
}

function parseStep(line: string): StructuredStep[] {
  const cleaned = stripBulletPrefix(line);

  if (!cleaned || URL_PATTERN.test(cleaned)) {
    return [];
  }

  if (isClearlyNotIngredientLine(cleaned)) {
    return [];
  }

  const timestampMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const timestampSec = timestampMatch
    ? timestampMatch[3]
      ? Number(timestampMatch[1]) * 3600 +
        Number(timestampMatch[2]) * 60 +
        Number(timestampMatch[3])
      : Number(timestampMatch[1]) * 60 + Number(timestampMatch[2])
    : null;

  const text = cleaned
    .replace(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/, "")
    .replace(/^\d+[\.\)．、]\s*/, "")
    .replace(/^[-:：\s]+/, "")
    .trim();

  const normalizedText = text || cleaned;
  const isStepLike =
    timestampSec !== null ||
    /^\d+[\.\)．、]/.test(cleaned) ||
    COOKING_VERB_PATTERN.test(normalizedText);

  if (!isStepLike) {
    return [];
  }

  return splitStepText(normalizedText).map((item, index) => ({
    text: item,
    timestamp_sec: index === 0 ? timestampSec : null,
    timer_sec: null,
    is_ai_inferred: false,
    confidence: 0.6,
  }));
}

export function extractRecipeByRules(description: string | null): {
  ingredients: StructuredIngredient[];
  steps: StructuredStep[];
} {
  if (!description) {
    return { ingredients: [], steps: [] };
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const ingredients: StructuredIngredient[] = [];
  const steps: StructuredStep[] = [];

  let mode: "neutral" | "ingredients" | "steps" = "neutral";

  for (const rawLine of lines) {
    const line = stripBulletPrefix(rawLine);

    if (!line || URL_PATTERN.test(line)) {
      continue;
    }

    if (INGREDIENT_HEADING_PATTERN.test(line)) {
      mode = "ingredients";
      continue;
    }

    if (STEP_HEADING_PATTERN.test(line)) {
      mode = "steps";
      continue;
    }

    if (mode === "ingredients") {
      const stepsInIngredientMode = parseStep(line);
      if (stepsInIngredientMode.length > 0 && (/、|。/.test(line) || COOKING_VERB_PATTERN.test(line))) {
        steps.push(...stepsInIngredientMode);
        continue;
      }

      const parsedIngredient = parseIngredient(line);
      if (parsedIngredient) {
        ingredients.push(parsedIngredient);
        continue;
      }
    }

    if (mode === "steps") {
      const parsedSteps = parseStep(line);
      if (parsedSteps.length > 0) {
        steps.push(...parsedSteps);
      }
      continue;
    }

    const fallbackSteps = parseStep(line);
    if (fallbackSteps.length > 0) {
      steps.push(...fallbackSteps);
    }
  }

  const dedupedIngredients = ingredients
    .filter((item) => item.name.length > 0)
    .filter((item, index, list) => list.findIndex((row) => row.name === item.name) === index)
    .slice(0, 30);

  const dedupedSteps = steps
    .filter((item) => item.text.length > 0)
    .filter((item, index, list) => list.findIndex((row) => row.text === item.text) === index)
    .slice(0, 50);

  return {
    ingredients: dedupedIngredients,
    steps: dedupedSteps,
  };
}
