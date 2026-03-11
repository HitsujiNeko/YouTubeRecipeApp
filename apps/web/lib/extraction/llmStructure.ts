import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { StructuredIngredient, StructuredStep } from "@/lib/extraction/types";

const llmIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity_text: z.string().max(50).nullable(),
  group_label: z.string().max(50).nullable(),
  is_optional: z.boolean(),
});

const llmStepSchema = z.object({
  text: z.string().min(1).max(500),
  timestamp_sec: z.number().int().nonnegative().nullable(),
  timer_sec: z.number().int().nonnegative().nullable(),
  is_ai_inferred: z.boolean().default(false),
});

const llmResponseSchema = z.object({
  ingredients: z.array(llmIngredientSchema).max(30),
  steps: z.array(llmStepSchema).max(50),
});

type LlmResponse = z.infer<typeof llmResponseSchema>;

export class LlmStructureError extends Error {
  kind: "api" | "invalid_payload";

  constructor(message: string, kind: "api" | "invalid_payload") {
    super(message);
    this.name = "LlmStructureError";
    this.kind = kind;
  }
}

function buildPrompt(input: {
  title: string;
  descriptionText: string;
  transcriptText: string;
}): string {
  return [
    "あなたは料理レシピ抽出アシスタントです。",
    "以下のテキストに明示されている情報だけを使い、創作せずJSONで返してください。",
    "ingredients: name, quantity_text, group_label, is_optional",
    "steps: text, timestamp_sec, timer_sec, is_ai_inferred",
    "不明な値は null。",
    "",
    `title: ${input.title}`,
    "",
    "[description]",
    input.descriptionText || "",
    "",
    "[transcript]",
    input.transcriptText || "",
  ].join("\n");
}

function withConfidence(payload: LlmResponse): {
  ingredients: StructuredIngredient[];
  steps: StructuredStep[];
} {
  return {
    ingredients: payload.ingredients.map((item) => ({ ...item, confidence: 0.75 })),
    steps: payload.steps.map((item) => ({ ...item, confidence: 0.75 })),
  };
}

export async function structureRecipeWithLlm(input: {
  title: string;
  descriptionText: string;
  transcriptText: string;
}): Promise<{ ingredients: StructuredIngredient[]; steps: StructuredStep[] }> {
  const env = getServerEnv();
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "抽出のみを行い、推測や創作はしないでください。",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
    });

    const rawText = completion.choices[0]?.message?.content;

    if (!rawText) {
      throw new LlmStructureError("LLM returned empty response", "api");
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      throw new LlmStructureError("LLM returned non-JSON response", "invalid_payload");
    }

    const parsed = llmResponseSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new LlmStructureError("LLM payload failed schema validation", "invalid_payload");
    }

    return withConfidence(parsed.data);
  } catch (error) {
    if (error instanceof LlmStructureError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new LlmStructureError(error.message, "api");
    }

    throw new LlmStructureError("Unknown LLM error", "api");
  }
}
