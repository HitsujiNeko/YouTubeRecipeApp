# 03 Platform Strategy (Web First, Native Later)

作成日: 2026-03-05

## 結論
- MVPは **Next.js Webアプリ + PWA** として開発する。
- ネイティブアプリ（iOS/Androidストア配布）はMVP後の拡張とする。

## 重要整理
- Next.js: Webアプリ開発フレームワーク（ブラウザ実行）
- React Native / Expo: ネイティブアプリ開発フレームワーク（iOS/Android）

## MVPで実現できるモバイル体験
- モバイルブラウザで利用可能
- PWAとしてホーム画面追加可能
- オフライン限定キャッシュなど一部機能は段階対応

## MVPでやらないこと
- App Store / Google Play へのネイティブ公開
- React Native実装の同時並行開発

## 拡張フェーズ案
### Phase 2-A (推奨)
- Web/PWAのKPI検証完了後に React Native (Expo) を着手
- Backend/APIは既存のNext.js Route Handlersを再利用

### Phase 2-B (代替)
- Capacitor/Tauri系でWebをラップして配布
- ただし将来的なネイティブ拡張性はReact Nativeより制約あり

## 採用判断基準
- KPI: Import成功率、CookMode完走率、W4継続率
- 目標達成後にネイティブ投資を判断

## 影響
- 現行スタック（Next.js + Supabase + OpenAPI）は誤りではない
- 「MVPはWeb/PWAで市場検証」が正しい前提
