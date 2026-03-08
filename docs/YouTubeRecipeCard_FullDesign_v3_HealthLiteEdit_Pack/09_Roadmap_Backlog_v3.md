# 09 Roadmap Backlog v3

更新日: 2026-03-08
対象: MVPロードマップ（P0/P1）

## 1. 使い方
- `Priority` の意味:
	- `Must`: MVP成立に必須
	- `Should`: MVP価値を大きく高める
	- `Could`: 後続フェーズで実施可能
- `Dependencies` は先行タスクID。
- `Est(days)` はAI実装の目安工数（日）。

## 2. P0 Backlog（MVP）

| ID | Priority | Epic | Task | Acceptance Criteria | Est(days) | Dependencies | Notes |
|---|---|---|---|---|---:|---|---|
| T-001 | Must | Foundation | Repo init (Next.js TS, lint, prettier) | CI build/test passes | 0.5 | - | - |
| T-002 | Must | Foundation | Supabase schema apply (v3) | All tables exist; local env connects | 0.5 | T-001 | Use `04_DB_Schema_v3.sql` |
| T-003 | Must | YouTube | `parseYouTubeVideoId(url)` | Unit tests cover watch/shorts/youtu.be/embed; invalid->null | 0.5 | T-001 | - |
| T-004 | Must | YouTube | YouTube Data API client (`videos.list`) | Handles quota/404; returns snippet/contentDetails | 0.5 | T-003 | Mock tests |
| T-005 | Must | Extraction | description cleaner + chapter extractor | Unit tests for URL removal + timestamps | 1.0 | T-004 | - |
| T-006 | Must | Extraction | LLM wrapper (Prompt A) + zod validation | Retries invalid JSON; logs extraction_runs | 1.0 | T-005 | - |
| T-007 | Must | API | `POST /api/recipes/import` (stores card) | Creates video_sources, recipes, ingredients, steps | 1.5 | T-002, T-004, T-006 | - |
| T-008 | Must | UI | Home screen (paste URL + recent list) | Paste/import works; shows recent cards | 1.0 | T-007 | - |
| T-009 | Must | UI | RecipeDetail (ingredients/steps + nutrition box placeholder) | Shows card; confidence badge; video link | 1.0 | T-007 | - |
| T-010 | Must | UI | CookMode (step-by-step + timer) | Mobile-friendly; checklist works; timer works | 2.0 | T-009 | - |
| T-011 | Must | Nutrition | Ingest food DB (MEXT) | food_items and nutrients populated; search works | 1.5 | T-002 | Use `10_Data_Ingestion_MEXT_Runbook.md` |
| T-012 | Must | Nutrition | matchFoodItem + parseQuantity + computeNutrition | Returns totals+confidence+coverage+unresolved | 2.0 | T-011 | Unit tests |
| T-013 | Must | API | `POST /api/recipes/{id}/nutrition` | Computes and caches nutrition; returns unresolved list | 1.0 | T-012 | - |
| T-014 | Must | UI | NutritionFix screen (quick edits) | Candidate select + grams input; saves overrides | 2.0 | T-013 | - |
| T-015 | Must | API | `PATCH /api/ingredients/{ingredient_id}/match` | Stores manual match+grams; triggers recompute | 1.0 | T-014 | - |
| T-016 | Should | Growth | Share slug + public page | Share page includes embed+credit; slug rotation | 1.5 | T-009 | - |
| T-017 | Must | Testing | Playwright E2E 3 scenarios | E2E passes in CI | 2.0 | T-008, T-010, T-014 | - |
| T-020 | Must | Compliance | Terms/Privacy pages + disclaimers | YouTube links + nutrition disclaimers present | 1.0 | T-008 | - |

## 3. P1 Backlog（拡張）

| ID | Priority | Epic | Task | Acceptance Criteria | Est(days) | Dependencies | Notes |
|---|---|---|---|---|---:|---|---|
| T-018 | Should | Quality | Channel-specific parser (e.g., Ryuji) | Improves extraction on 10 sample URLs | 1.5 | T-005 | - |
| T-019 | Could | Search | Tags + nutrition filter | Filter by protein density etc | 2.0 | T-012 | - |

## 4. 依存の要点
- `T-007` は Import中核で、UI導線（`T-008`, `T-009`）の前提。
- 栄養導線は `T-011 -> T-012 -> T-013 -> T-014 -> T-015` の順。
- 主要E2E (`T-017`) は Home/Cook/NutritionFix の完了が前提。


