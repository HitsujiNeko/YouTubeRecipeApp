# 01 Implementation Order

## Phase 0: Environment
1. `apps/web` の依存インストール
2. `.env.local` 設定
3. CIゲート有効化

## Phase 1: Import Path (最優先)
1. URL parser
2. YouTube metadata client
3. import API
4. Home -> RecipeDetail最低導線

## Phase 2: Nutrition Path
1. food検索/matchロジック
2. nutrition API
3. NutritionFix UI

## Phase 3: Cook and Share
1. CookMode UI
2. share API + SharePage
3. 検索UI

## Phase 4: Hardening
1. エラーUX改善
2. E2E拡張
3. 性能チューニング

## WIP制限
- 同時進行は最大2Issue
- 各Issueは1PRで完結
