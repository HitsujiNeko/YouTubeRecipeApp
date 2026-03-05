# 01 MVP Issue Backlog

## Epic A: Import and Extraction
- A-1 URL parser実装 + unit test
- A-2 YouTube metadata client + timeout/retry
- A-3 description cleaner/chapter extractor
- A-4 import API (`POST /api/recipes/import`)

## Epic B: Recipe Detail and Cook Mode
- B-1 RecipeDetail UI（材料/手順/栄養カード）
- B-2 CookMode UI（1ステップ/タイマー/チェック）

## Epic C: Nutrition and Fix Flow
- C-1 nutrition compute API
- C-2 unresolved一覧UI
- C-3 ingredient match override API/UI

## Epic D: Share and Search
- D-1 share slug作成/rotate API
- D-2 SharePage UI
- D-3 title検索API/UI

## Definition of Ready
- 入出力がOpenAPI/DBで定義済み
- 受け入れ基準が明文化済み
- 失敗時UXが定義済み

## Definition of Done
- lint/typecheck/関連テスト通過
- docs更新
- APIとOpenAPI整合
