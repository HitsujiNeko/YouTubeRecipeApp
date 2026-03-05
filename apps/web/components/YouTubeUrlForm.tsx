"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiErrorPanel } from "@/components/ApiErrorPanel";
import { mapImportApiError, type ImportUiError } from "@/lib/home/importError";
import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";
import type { ImportRecipeRequest, ImportRecipeResponse } from "@/types/api";

type ImportState = "idle" | "validating" | "importing" | "success" | "error";

const DEFAULT_IMPORT_REQUEST: Omit<ImportRecipeRequest, "url"> = {
  language: "ja",
  options: {
    allow_ai_infer_steps: false,
    compute_nutrition: true,
  },
};

export function YouTubeUrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ImportState>("idle");
  const [error, setError] = useState<ImportUiError | null>(null);

  const submitImport = async (targetUrl: string) => {
    setState("importing");

    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...DEFAULT_IMPORT_REQUEST,
          url: targetUrl,
        } satisfies ImportRecipeRequest),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        const mappedError = mapImportApiError(payload);
        setError(mappedError);
        setState("error");
        return;
      }

      const body = (await response.json()) as ImportRecipeResponse;
      setState("success");
      router.push(`/recipes/${body.recipe_id}`);
    } catch {
      setError({
        code: "internal_error",
        message: "予期しないエラーが発生しました",
        retryable: false,
      });
      setState("error");
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setState("validating");

    if (!parseYouTubeVideoId(url)) {
      setError({
        code: "bad_request",
        message: "YouTube URL形式を確認してください",
        retryable: false,
      });
      setState("error");
      return;
    }

    await submitImport(url);
  };

  const onRetry = async () => {
    if (!error?.retryable) {
      return;
    }

    await submitImport(url);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">YouTube URLからレシピを生成</h2>
      <p className="mt-2 text-sm text-slate-600">
        YouTubeのURLを貼り付けると、材料・手順・栄養サマリーを作成します。
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="youtube-url">
          YouTube URL
        </label>
        <input
          id="youtube-url"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
          required
          aria-invalid={state === "error"}
          data-testid="youtube-url-input"
        />

        <button
          type="submit"
          disabled={state === "importing" || state === "validating"}
          className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-orange-500"
          data-testid="youtube-import-submit"
        >
          {state === "importing" || state === "validating" ? "生成中..." : "生成する"}
        </button>
      </form>

      {state === "error" && error ? (
        <div className="mt-4">
          <ApiErrorPanel
            code={error.code}
            message={error.message}
            retryable={error.retryable}
            onRetry={onRetry}
          />
        </div>
      ) : null}
    </section>
  );
}
