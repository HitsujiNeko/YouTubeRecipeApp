import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link href="/" className="text-xs text-slate-600 underline hover:text-slate-800">
          ← Homeへ戻る
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">利用規約</h1>
        <p className="mt-2 text-sm text-slate-600">最終更新: 2026-03-12</p>

        <section className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">
          <p>
            本サービスは、YouTube URLから材料・手順・栄養サマリーの表示を補助するためのツールです。内容は参考情報であり、正確性・完全性を保証しません。
          </p>

          <div>
            <h2 className="font-semibold text-slate-900">YouTube利用について</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>動画・音声バイナリのダウンロードや保存は行いません。</li>
              <li>共有ページでは元動画リンクとクレジット導線を表示します。</li>
              <li>YouTubeの仕様変更等により機能が制限される場合があります。</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">栄養推定について</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>栄養値は推定であり、材料の分量や調理方法により誤差が生じます。</li>
              <li>医療・診断・治療目的ではありません。</li>
              <li>体調不良や持病がある場合は、必ず医師などの専門家へご相談ください。</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">免責事項</h2>
            <p className="mt-2">
              当社は、本サービスの利用により生じた損害について、当社に故意または重過失がある場合を除き責任を負いません。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}