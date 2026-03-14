import Link from "next/link";
import { notFound } from "next/navigation";

import { IngredientList } from "@/components/IngredientList";
import { NutritionSummaryCard } from "@/components/NutritionSummaryCard";
import { StepList } from "@/components/StepList";
import { getSharedRecipeBySlug } from "@/lib/recipes/getSharedRecipeBySlug";
import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;

  if (!slug || slug.length > 120) {
    notFound();
  }

  const recipe = await getSharedRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const videoId = parseYouTubeVideoId(recipe.sourceUrl);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link href="/" className="text-xs text-slate-600 underline hover:text-slate-800">
          ← Homeへ戻る
        </Link>

        <header className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share Page</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{recipe.title}</h1>
          <p className="mt-2 text-xs text-slate-600">
            クレジット: {recipe.channelTitle ? `${recipe.channelTitle} / YouTube` : "YouTube"}
          </p>
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-blue-700 underline"
          >
            元動画を開く
          </a>
        </header>

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {videoId ? (
            <iframe
              title={`${recipe.title} のYouTube埋め込み`}
              src={`https://www.youtube.com/embed/${videoId}`}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="p-4 text-sm text-slate-700">
              動画を埋め込めませんでした。上の「元動画を開く」リンクからご確認ください。
            </div>
          )}
        </section>

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

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600">
          <p>栄養値は推定です。材料の分量や油の量などにより誤差が生じます。</p>
          <p className="mt-1">
            医療・診断目的ではありません。体調や治療中の方は専門家にご相談ください。
          </p>
        </section>

        <div className="mt-6 grid gap-4">
          <IngredientList items={recipe.ingredients} />
          <StepList steps={recipe.steps} />
        </div>
      </div>
    </main>
  );
}
