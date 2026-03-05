const nutritionRows = [
  { label: "kcal", value: "520" },
  { label: "P", value: "34.1g" },
  { label: "F", value: "18.2g" },
  { label: "C", value: "49.8g" },
  { label: "salt", value: "1.9g" },
];

const ingredients = [
  "鶏むね肉 1枚",
  "しょうゆ 大さじ1",
  "みりん 大さじ1",
  "にんにく 1片",
  "油 適量 (未確定)",
];

const steps = [
  "鶏むね肉をそぎ切りにする",
  "調味料を混ぜ、鶏むね肉を10分漬ける",
  "フライパンで中火3分、裏返して2分焼く",
  "火を止めて1分休ませ、皿に盛る",
];

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-[320px] shrink-0 rounded-[28px] border border-slate-300 bg-white p-3 shadow-md">
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {children}
      </div>
    </section>
  );
}

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold tracking-tight">UI Preview (MVP)</h1>
        <p className="mt-2 text-sm text-slate-600">
          実装前に完成イメージを確認するための静的プレビューです。Home / RecipeDetail / NutritionFix
          / CookMode を並べて比較できます。
        </p>

        <div className="mt-6 flex gap-5 overflow-x-auto pb-2">
          <PhoneFrame title="Home">
            <div className="space-y-3">
              <h2 className="text-base font-bold">YouTube Recipe Card</h2>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                defaultValue="https://www.youtube.com/watch?v=abc123"
                readOnly
              />
              <button className="w-full rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white">
                生成する
              </button>
              <p className="text-xs text-slate-500">最近のレシピ</p>
              <ul className="space-y-2 text-sm">
                <li className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  高たんぱく鶏むねソテー
                </li>
                <li className="rounded-md border border-slate-200 bg-white px-3 py-2">
                  豆腐チキンナゲット
                </li>
              </ul>
            </div>
          </PhoneFrame>

          <PhoneFrame title="RecipeDetail">
            <div className="space-y-3">
              <h2 className="text-base font-bold">高たんぱく鶏むねソテー</h2>
              <a className="text-xs text-blue-700 underline" href="#">
                元動画を開く
              </a>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {nutritionRows.map((row) => (
                    <div key={row.label} className="rounded bg-white p-2 text-center">
                      <p className="text-slate-500">{row.label}</p>
                      <p className="font-semibold">{row.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-600">confidence: 中 / coverage: 72%</p>
                <button className="mt-2 w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white">
                  未確定: 1件を直す
                </button>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">材料</p>
                <ul className="space-y-1 text-xs">
                  {ingredients.map((item) => (
                    <li key={item} className="rounded border border-slate-200 bg-white px-2 py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PhoneFrame>

          <PhoneFrame title="NutritionFix">
            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">1 / 1 未確定材料</p>
              <h2 className="text-base font-bold">油 適量</h2>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
                  <input type="radio" checked readOnly />
                  サラダ油
                </label>
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
                  <input type="radio" readOnly />
                  オリーブオイル
                </label>
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
                  <input type="radio" readOnly />
                  ごま油
                </label>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">使用量(g)</p>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  defaultValue="8"
                  readOnly
                />
              </div>
              <button className="w-full rounded-lg bg-orange-600 py-2 text-xs font-semibold text-white">
                保存して再計算
              </button>
            </div>
          </PhoneFrame>

          <PhoneFrame title="CookMode">
            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">Step 2 / 4</p>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm leading-relaxed">{steps[1]}</p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 rounded-md border border-slate-300 py-2 text-xs font-semibold">
                  戻る
                </button>
                <button className="flex-1 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white">
                  次へ
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">タイマー</p>
                <p className="text-xl font-bold tabular-nums">00:45</p>
              </div>

              <details className="rounded-lg border border-slate-200 bg-white p-2">
                <summary className="cursor-pointer text-xs font-semibold">材料チェック</summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {ingredients.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <input type="checkbox" readOnly />
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </main>
  );
}
