import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link href="/" className="text-xs text-slate-600 underline hover:text-slate-800">
          ← Homeへ戻る
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-slate-600">最終更新: 2026-03-12</p>

        <section className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">
          <p>
            本サービスは、レシピカード生成および共有のために必要最小限のデータのみを取り扱います。取り扱いデータは利用目的の範囲内でのみ利用します。
          </p>

          <div>
            <h2 className="font-semibold text-slate-900">取得する情報</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>YouTube URL、動画ID、動画タイトル、チャンネル名、サムネイルURL</li>
              <li>ユーザーが編集・保存したレシピ情報（材料、手順、メモ）</li>
              <li>サービス改善に必要な最小限の技術ログ</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">利用目的</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>レシピカード生成、栄養推定、共有機能の提供</li>
              <li>障害対応および品質改善</li>
              <li>不正利用の検知と防止</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">第三者提供</h2>
            <p className="mt-2">
              法令に基づく場合を除き、本人同意なく個人情報を第三者へ提供しません。外部サービス利用時は、各サービスの規約・ポリシーに従ってデータが処理される場合があります。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}