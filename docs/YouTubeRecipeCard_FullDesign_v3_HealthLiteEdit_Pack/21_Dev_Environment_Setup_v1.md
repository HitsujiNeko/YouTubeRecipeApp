# 21 開発環境セットアップ v1

作成日: 2026-03-05

## 21.1 目的
- AI中心で実装を継続できる最小開発環境を定義する。

## 21.2 ディレクトリ
- `apps/web`: Next.js アプリ本体
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack`: 要件・設計
- `.github/skills`: Agent Skills（開発特化ワークフロー）

## 21.3 前提
- Node.js 22+
- npm 10+
- Supabase Project
- OpenAI API Key
- YouTube Data API Key

## 21.4 初期セットアップ
1. `cd apps/web`
2. `npm install`
3. `.env.example` を `.env.local` にコピーし値を設定
4. `npm run dev`

## 21.5 品質コマンド
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run test:e2e`

## 21.6 DB適用
- Supabase SQL Editorで `07_DB_Schema_v3.sql` を適用
- 食品マスタ取り込みは `16_Data_Ingestion_MEXT_Runbook.md` を参照

## 21.7 AI駆動開発ルール
- 1PR 1機能
- 仕様変更時は docs を先に更新
- OpenAPI と Route Handler 実装を同時更新
- 失敗時UX（confidence/coverage/unresolved）を必ず返す
