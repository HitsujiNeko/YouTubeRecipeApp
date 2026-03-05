import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">YouTube Recipe Card</h1>
        <p className="mt-3 text-lg text-slate-700">
          開発環境の初期化が完了しました。次は URL インポート API と RecipeDetail UI を実装します。
        </p>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">MVP Scope</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
            <li>YouTube URL import and recipe extraction</li>
            <li>Nutrition estimate with confidence and coverage</li>
            <li>Cook mode and quick nutrition fix flow</li>
            <li>Share page with source attribution</li>
          </ul>

          <div className="mt-6">
            <Link
              href="/ui-preview"
              className="inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
            >
              完成イメージを確認する
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
