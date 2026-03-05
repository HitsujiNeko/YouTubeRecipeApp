import { RecipeRecentList } from "@/components/RecipeRecentList";
import { YouTubeUrlForm } from "@/components/YouTubeUrlForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">YouTube Recipe Card</h1>
        <p className="mt-3 text-sm text-slate-700 sm:text-base">
          YouTube URLを入力して、材料・手順・栄養サマリー付きのレシピカードを作成します。
        </p>

        <div className="mt-8 space-y-4">
          <YouTubeUrlForm />
          <RecipeRecentList />
        </div>
      </div>
    </main>
  );
}
