import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { IngredientList } from "@/components/IngredientList";
import { NutritionSummaryCard } from "@/components/NutritionSummaryCard";
import { StepList } from "@/components/StepList";
import { getRecipeDetailById } from "@/lib/recipes/getRecipeDetailById";
import { getMockRecipeDetail } from "@/lib/recipes/mockRecipeDetail";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe =
    (await getRecipeDetailById(id)) ?? (id.startsWith("sample-") ? getMockRecipeDetail(id) : null);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link href="/" className="text-xs text-slate-600 underline hover:text-slate-800">
          ← Homeへ戻る
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{recipe.title}</h1>
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-blue-700 underline"
        >
          元動画を開く
        </a>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image
            src={recipe.thumbnailUrl}
            alt={`${recipe.title} のサムネイル`}
            width={960}
            height={540}
            className="h-auto w-full"
            priority
          />
        </div>

        <div className="mt-5">
          <NutritionSummaryCard
            totals={{
              kcal: recipe.nutrition.kcal,
              proteinG: recipe.nutrition.proteinG,
              fatG: recipe.nutrition.fatG,
              carbsG: recipe.nutrition.carbsG,
              saltG: recipe.nutrition.saltG,
            }}
            confidence={recipe.nutrition.confidence}
            coverage={recipe.nutrition.coverage}
            unresolvedCount={recipe.nutrition.unresolvedCount}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/recipes/${id}/cook`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            CookModeを開く
          </Link>
          {recipe.nutrition.unresolvedCount > 0 ? (
            <Link
              href={`/recipes/${id}/nutrition-fix`}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
            >
              未確定: {recipe.nutrition.unresolvedCount}件を直す
            </Link>
          ) : null}
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
          <p>栄養値は推定です。材料の分量や油の量などにより誤差が生じます。</p>
          <p className="mt-1">
            医療・診断目的ではありません。体調や治療中の方は専門家にご相談ください。
          </p>
          <p className="mt-1">未確定の材料を修正すると、推定精度が上がります。</p>
        </section>

        <div className="mt-6 grid gap-4">
          <IngredientList items={recipe.ingredients} />
          <StepList steps={recipe.steps} />
        </div>
      </div>
    </main>
  );
}
