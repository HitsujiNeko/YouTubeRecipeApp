import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("YouTube Recipe Card"),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  LLM_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
  LLM_OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  LLM_GEMINI_MODEL: z.string().min(1).default("gemini-2.0-flash-lite"),
  YOUTUBE_DATA_API_KEY: z.string().min(1),
});

export const clientEnv = clientEnvSchema.safeParse(process.env);
export const serverEnv = serverEnvSchema.safeParse(process.env);

export function getClientEnv() {
  if (!clientEnv.success) {
    throw new Error("Invalid client environment variables");
  }

  return clientEnv.data;
}

export function getServerEnv() {
  if (!serverEnv.success) {
    throw new Error("Invalid server environment variables");
  }

  return serverEnv.data;
}
