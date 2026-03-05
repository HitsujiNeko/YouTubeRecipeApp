# 14 AI開発ランブック v3（Copilot/Codexが迷わない手順）

## 14.1 開発原則
- 1PR = 1機能（小さく、レビュー容易に）
- LLM出力は必ず JSON + zod 検証
- 例外で落とさない：失敗時UX（不足明示）を必ず実装
- 栄養は “best-effort” とし、confidence/coverageを常に返す
- APIエラーは `20_API_Error_Contract_v1.md` の形式に統一
- 認可は `19_Auth_Authorization_RLS_v1.md` の owner/edit token モデルで実装

## 14.2 実装順序（最短）
P0-1: Foundation
1) Next.js初期化、eslint/prettier、環境変数
2) Supabase schema適用（07_DB_Schema_v3.sql）

P0-2: Import & Recipe
3) YouTube URL parser（ユニットテスト）
4) YouTube Data API client（モックテスト）
5) description cleaner + chapter extractor（ユニット）
6) LLM wrapper（Prompt A + zod + retry）
7) POST /api/recipes/import 実装
8) UI: Home → RecipeDetail → CookMode

P0-3: Nutrition (B)
9) food_items取り込み（16_Data_Ingestion_MEXT_Runbook.md）
10) matchFoodItem（trgm）+ parseQuantity（g換算）+ computeNutrition
11) POST /api/recipes/{id}/nutrition
12) NutritionFix UI（未確定だけ修正）
13) PATCH /api/ingredients/{ingredient_id}/match（保存→再計算）

P0-4: Growth & Quality
14) Share slug + SharePage（クレジット必須）
15) Playwright E2E（主要3シナリオ）

## 14.3 Copilot/Codexへのタスク指示テンプレ
- 目的:
- 仕様:
- 受け入れ基準:
- 影響範囲（ファイル）:
- テスト:

## 14.4 重要な“やってはいけない”
- YouTubeの動画データをダウンロードして解析しない
- 字幕を取得できる前提で設計しない
- 栄養値を断定しない（推定・confidence必須）
