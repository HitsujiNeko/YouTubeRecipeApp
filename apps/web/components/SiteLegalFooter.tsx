import Link from "next/link";

export function SiteLegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="underline hover:text-slate-800">
            利用規約
          </Link>
          <Link href="/privacy" className="underline hover:text-slate-800">
            プライバシーポリシー
          </Link>
        </div>

        <div className="mt-3 space-y-1">
          <p>本サービスはYouTube動画を埋め込み表示し、元動画リンクとクレジット導線を提供します。</p>
          <p>栄養値は推定であり誤差を含みます。医療・診断目的ではありません。</p>
        </div>
      </div>
    </footer>
  );
}
