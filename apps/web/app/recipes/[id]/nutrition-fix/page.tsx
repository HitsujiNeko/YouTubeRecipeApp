"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type {
  CommonApiErrorResponse,
  FoodSearchCandidate,
  FoodSearchResponse,
  IngredientMatchRequest,
  UnresolvedIngredient,
} from "@/types/api";

type NutritionFixState = "loading_candidates" | "editing" | "saving" | "next" | "done" | "error";

type UnresolvedItem = UnresolvedIngredient & {
  lowConfidenceReason: string;
};

type DraftState = {
  query: string;
  selectedFoodId: number | null;
  grams: string;
};

const MOCK_UNRESOLVED: UnresolvedItem[] = [
  {
    ingredient_id: "sample-ingredient-oil",
    name: "油 適量",
    reason: "quantity_text is ambiguous",
    lowConfidenceReason: "量が曖昧なため推定誤差が大きいです。",
  },
  {
    ingredient_id: "sample-ingredient-sugar",
    name: "砂糖 ひとつまみ",
    reason: "quantity_text is ambiguous",
    lowConfidenceReason: "食品候補と分量が不確定です。",
  },
];

function parseApiError(payload: unknown): string {
  const maybe = payload as CommonApiErrorResponse | null;
  if (maybe && typeof maybe === "object" && maybe.error?.message) {
    return maybe.error.message;
  }

  return "予期しないエラーが発生しました。";
}

export default function NutritionFixPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, setState] = useState<NutritionFixState>("loading_candidates");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<FoodSearchCandidate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [index, setIndex] = useState(0);

  const unresolved = useMemo(() => MOCK_UNRESOLVED, []);
  const current = unresolved[index];
  const initialQuery = current ? (current.name.split(" ")[0] ?? current.name) : "";
  const currentDraft = useMemo(() => {
    if (!current) {
      return null;
    }

    return (
      drafts[current.ingredient_id] ?? {
        query: initialQuery,
        selectedFoodId: null,
        grams: "",
      }
    );
  }, [current, drafts, initialQuery]);

  useEffect(() => {
    if (!current) {
      return;
    }

    const load = async () => {
      setState("loading_candidates");
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/foods/search?q=${encodeURIComponent(initialQuery)}`);
        const payload = (await response.json()) as FoodSearchResponse | CommonApiErrorResponse;

        if (!response.ok) {
          setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
          setState("error");
          return;
        }

        if (!("items" in payload)) {
          setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
          setState("error");
          return;
        }

        setCandidates(payload.items);
        setState("editing");
      } catch {
        setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
        setState("error");
      }
    };

    void load();
  }, [current, initialQuery]);

  const updateCurrentDraft = (next: Partial<DraftState>) => {
    if (!current || !currentDraft) {
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [current.ingredient_id]: {
        ...currentDraft,
        ...next,
      },
    }));
  };

  const searchCandidates = async () => {
    if (!currentDraft) {
      return;
    }

    setState("loading_candidates");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(currentDraft.query)}`);
      const payload = (await response.json()) as FoodSearchResponse | CommonApiErrorResponse;

      if (!response.ok) {
        setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
        setState("error");
        return;
      }

      if (!("items" in payload)) {
        setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
        setState("error");
        return;
      }

      setCandidates(payload.items);
      setState("editing");
    } catch {
      setErrorMessage("候補取得に失敗しました。検索して手動選択してください");
      setState("error");
    }
  };

  const saveCurrent = async () => {
    if (!current || !currentDraft?.selectedFoodId) {
      return;
    }

    const gramsValue = Number(currentDraft.grams);
    if (!Number.isFinite(gramsValue) || gramsValue <= 0 || gramsValue > 5000) {
      setErrorMessage("保存に失敗しました。入力を確認して再試行してください");
      setState("error");
      return;
    }

    setState("saving");
    setErrorMessage(null);

    const payload: IngredientMatchRequest = {
      matched_food_id: currentDraft.selectedFoodId,
      grams: gramsValue,
      match_method: "manual",
    };

    try {
      if (!current.ingredient_id.startsWith("sample-")) {
        const saveResponse = await fetch(`/api/ingredients/${current.ingredient_id}/match`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!saveResponse.ok) {
          const errorPayload = (await saveResponse.json().catch(() => null)) as unknown;
          setErrorMessage(parseApiError(errorPayload));
          setState("error");
          return;
        }
      }

      const nextIndex = index + 1;
      if (nextIndex >= unresolved.length) {
        const recomputeResponse = await fetch(`/api/recipes/${params.id}/nutrition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allow_best_effort: true }),
        });

        if (!recomputeResponse.ok) {
          setErrorMessage("更新は保存されましたが再計算に失敗しました");
          setState("error");
          return;
        }

        setState("done");
        router.push(`/recipes/${params.id}`);
        return;
      }

      setIndex(nextIndex);
      setState("next");
    } catch {
      setErrorMessage("保存に失敗しました。入力を確認して再試行してください");
      setState("error");
    }
  };

  if (state === "done" || !current) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/recipes/${params.id}`}
          className="text-xs text-slate-600 underline hover:text-slate-800"
        >
          ← RecipeDetailへ戻る
        </Link>

        <header className="mt-3">
          <p className="text-xs text-slate-500">
            {Math.min(index + 1, unresolved.length)} / {unresolved.length} 未確定材料
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">NutritionFix</h1>
        </header>

        {current ? (
          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">材料</p>
            <p className="text-lg font-semibold text-slate-900">{current.name}</p>
            <p className="mt-1 text-xs text-orange-700">
              低confidence理由: {current.lowConfidenceReason}
            </p>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700" htmlFor="food-query">
                食材検索
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="food-query"
                  type="text"
                  value={currentDraft?.query ?? ""}
                  onChange={(event) => updateCurrentDraft({ query: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={searchCandidates}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                >
                  検索
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {candidates.slice(0, 3).map((candidate) => (
                <label
                  key={candidate.food_id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="food-candidate"
                    checked={currentDraft?.selectedFoodId === candidate.food_id}
                    onChange={() => updateCurrentDraft({ selectedFoodId: candidate.food_id })}
                  />
                  <span>{candidate.name_ja}</span>
                  <span className="ml-auto text-xs text-slate-500">
                    score: {candidate.score.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700" htmlFor="grams-input">
                使用量(g)
              </label>
              <input
                id="grams-input"
                type="number"
                min={0}
                max={5000}
                value={currentDraft?.grams ?? ""}
                onChange={(event) => updateCurrentDraft({ grams: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={saveCurrent}
              disabled={
                state === "saving" ||
                state === "loading_candidates" ||
                !currentDraft?.selectedFoodId ||
                !currentDraft?.grams
              }
              className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "saving" ? "保存中..." : "保存して次へ"}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
