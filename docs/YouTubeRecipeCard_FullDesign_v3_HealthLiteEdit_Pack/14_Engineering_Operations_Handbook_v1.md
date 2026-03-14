# 14 Engineering Operations Handbook v1

作成日: 2026-03-08
目的: AI実装時に必要な開発運用情報（環境、実装フロー、運用対応、CI/CD）を1冊に集約する。

## 14.1 対象範囲

- 開発環境セットアップ
- AI駆動開発フロー
- 障害時Runbook
- CI/CDゲート

## 14.2 クイックスタート

1. `cd apps/web`
2. `npm install`
3. `.env.example` を `.env.local` にコピーし値を設定
4. `npm run dev`

## 14.3 前提

- Node.js 22+
- npm 10+
- Supabase Project
- LLM API Key（`LLM_PROVIDER` に応じて `GEMINI_API_KEY` または `OPENAI_API_KEY`）
- YouTube Data API Key

## 14.4 ディレクトリ

- `apps/web`: Next.js アプリ本体
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack`: 要件・設計
- `.github/skills`: Agent Skills（開発特化ワークフロー）

## 14.5 開発原則

- 1PR = 1機能（小さく、レビュー容易に）
- LLM出力は必ず JSON + zod 検証
- 例外で落とさない: 失敗時UX（不足明示）を必ず実装
- 栄養は best-effort とし、confidence/coverageを常に返す
- APIエラーは `13_API_Error_Contract_v1.md` の形式に統一
- 認可は `12_Auth_Authorization_RLS_v1.md` の owner/edit token モデルで実装
- YouTubeの動画データをダウンロードして解析しない
- 栄養値を断定しない（推定・confidence必須）

## 14.6 AI駆動の標準フロー（1機能単位）

1. 仕様確認: PRD / UX / OpenAPI / DB Schema
2. 実装: Route Handler + UI + domain lib を同時更新
3. 検証: lint / typecheck / 該当テスト
4. 仕様同期: docs更新（仕様変更がある場合）
5. PR作成: 目的、変更点、リスク、テスト結果を明記

## 14.7 実装順序（最短）

- Foundation -> Import and Recipe -> Nutrition -> Growth and Quality

## 14.8 品質コマンド

- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run test:e2e`
