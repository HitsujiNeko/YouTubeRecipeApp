"use client";

import { use, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { getMockRecipeDetail } from "@/lib/recipes/mockRecipeDetail";

type CookModePageProps = {
  params: Promise<{ id: string }>;
};

function loadStepIndex(recipeId: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(`cook_step_index:${recipeId}`);
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function loadCheckedIngredients(recipeId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(`cook_checked_ingredients:${recipeId}`);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function hasResumeState(recipeId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.localStorage.getItem(`cook_step_index:${recipeId}`) ||
    window.localStorage.getItem(`cook_checked_ingredients:${recipeId}`),
  );
}

export default function CookModePage({ params }: CookModePageProps) {
  const { id } = use(params);
  const recipe = useMemo(() => getMockRecipeDetail(id), [id]);
  const [stepIndex, setStepIndex] = useState(() => loadStepIndex(recipe.id));
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>(() =>
    loadCheckedIngredients(recipe.id),
  );
  const [timer, setTimer] = useState({ remainingSec: 60, isRunning: false });
  const [showResumeNotice] = useState(() => hasResumeState(recipe.id));

  const clampedStepIndex = Math.max(0, Math.min(stepIndex, recipe.steps.length - 1));
  const currentStep = recipe.steps[clampedStepIndex] ?? "";

  useEffect(() => {
    window.localStorage.setItem(`cook_step_index:${recipe.id}`, String(clampedStepIndex));
  }, [clampedStepIndex, recipe.id]);

  useEffect(() => {
    window.localStorage.setItem(
      `cook_checked_ingredients:${recipe.id}`,
      JSON.stringify(checkedIngredients),
    );
  }, [checkedIngredients, recipe.id]);

  useEffect(() => {
    if (!timer.isRunning || timer.remainingSec <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev.isRunning) {
          return prev;
        }

        if (prev.remainingSec <= 1) {
          return { remainingSec: 0, isRunning: false };
        }

        return { ...prev, remainingSec: prev.remainingSec - 1 };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timer.isRunning, timer.remainingSec]);

  const moveStep = (direction: "next" | "prev") => {
    setStepIndex((prev) => {
      if (direction === "prev") {
        return Math.max(0, prev - 1);
      }

      return Math.min(recipe.steps.length - 1, prev + 1);
    });
    setTimer({ remainingSec: 60, isRunning: false });
  };

  const toggleTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const toggleIngredient = (item: string) => {
    setCheckedIngredients((prev) =>
      prev.includes(item) ? prev.filter((current) => current !== item) : [...prev, item],
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link
          href={`/recipes/${recipe.id}`}
          className="text-xs text-slate-600 underline hover:text-slate-800"
        >
          ← RecipeDetailへ戻る
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">CookMode</h1>

        {showResumeNotice ? (
          <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            前回の続きから再開しました
          </p>
        ) : null}

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500" data-testid="cook-step-progress">
            {clampedStepIndex + 1} / {recipe.steps.length}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900" data-testid="cook-current-step">
            {currentStep}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => moveStep("prev")}
              disabled={clampedStepIndex === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => moveStep("next")}
              disabled={clampedStepIndex >= recipe.steps.length - 1}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              次へ
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">タイマー</p>
            <p className="mt-1 text-2xl font-bold text-slate-900" data-testid="cook-timer-value">
              {timer.remainingSec}s
            </p>
            <button
              type="button"
              onClick={toggleTimer}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold"
            >
              {timer.isRunning ? "一時停止" : "開始"}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">材料チェック</h2>
          <ul className="mt-2 space-y-2">
            {recipe.ingredients.map((item) => (
              <li key={item} className="rounded-md border border-slate-200 px-3 py-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checkedIngredients.includes(item)}
                    onChange={() => toggleIngredient(item)}
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
