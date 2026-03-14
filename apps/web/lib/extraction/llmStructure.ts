import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import type { StructuredIngredient, StructuredStep } from "@/lib/extraction/types";

type LlmProvider = "gemini" | "openai";

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

type LlmStructureMetadata = {
  provider: LlmProvider;
  modelName: string;
};

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

function parseLlmResponseText(rawText: string): {
  ingredients: StructuredIngredient[];
  steps: StructuredStep[];
} {
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
}

async function invokeOpenAi(input: {
  apiKey: string;
  modelName: string;
  prompt: string;
}): Promise<string> {
  const openai = new OpenAI({ apiKey: input.apiKey });

  const completion = await openai.chat.completions.create({
    model: input.modelName,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "抽出のみを行い、推測や創作はしないでください。",
      },
      {
        role: "user",
        content: input.prompt,
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content;

  if (!rawText) {
    throw new LlmStructureError("LLM returned empty response", "api");
  }

  return rawText;
}

async function invokeGemini(input: {
  apiKey: string;
  modelName: string;
  prompt: string;
}): Promise<string> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.modelName)}:generateContent`,
  );
  url.searchParams.set("key", input.apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "抽出のみを行い、推測や創作はしないでください。" }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: input.prompt }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new LlmStructureError(
      `Gemini API request failed (${response.status}): ${errorText.slice(0, 200)}`,
      "api",
    );
  }

  const responseJson = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText =
    responseJson.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!rawText) {
    throw new LlmStructureError("LLM returned empty response", "api");
  }

  return rawText;
}

function resolveProviderConfig(env: ReturnType<typeof getServerEnv>): {
  provider: LlmProvider;
  modelName: string;
  apiKey: string;
} {
  if (env.LLM_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new LlmStructureError("OPENAI_API_KEY is not configured", "api");
    }

    return {
      provider: "openai",
      modelName: env.LLM_OPENAI_MODEL,
      apiKey: env.OPENAI_API_KEY,
    };
  }

  if (!env.GEMINI_API_KEY) {
    throw new LlmStructureError("GEMINI_API_KEY is not configured", "api");
  }

  return {
    provider: "gemini",
    modelName: env.LLM_GEMINI_MODEL,
    apiKey: env.GEMINI_API_KEY,
  };
}

export async function structureRecipeWithLlm(input: {
  title: string;
  descriptionText: string;
  transcriptText: string;
}): Promise<{
  ingredients: StructuredIngredient[];
  steps: StructuredStep[];
  metadata: LlmStructureMetadata;
}> {
  const env = getServerEnv();
  const prompt = buildPrompt(input);
  const config = resolveProviderConfig(env);

  try {
    const rawText =
      config.provider === "openai"
        ? await invokeOpenAi({ apiKey: config.apiKey, modelName: config.modelName, prompt })
        : await invokeGemini({ apiKey: config.apiKey, modelName: config.modelName, prompt });

    const structured = parseLlmResponseText(rawText);

    return {
      ...structured,
      metadata: {
        provider: config.provider,
        modelName: config.modelName,
      },
    };
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
