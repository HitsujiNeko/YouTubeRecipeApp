# 01 Implementation Order

更新日: 2026-03-08

## Current Baseline
- Q-012（抽出ロジック詳細設計）まで完了。
- 次の実行対象は Q-013（抽出ロジック再実装）。

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

## Near-term Plan (Roadmap-driven)
1. Q-013: 抽出ロジック再実装（`T-005/T-006/T-007` 連動）
2. Q-014: Terms/Privacy + 免責表示の完成（`T-020` 連動）
3. Q-015: CookMode実データ表示（`T-010` 連動）
4. Q-016: チャンネル別パーサ最適化（`T-018` 連動）
5. Q-017: タグ + 栄養フィルタ検索（`T-019` 連動）

## Dependency Gate
- Q-013の完了条件:
	- `04_Extraction_Logic_Design.md` 準拠の実装
	- 抽出ユニットテスト + import統合テストの追加
	- 既存E2Eの回帰なし
- Q-015 は Q-013 完了まで `blocked` を維持する。
- Q-016 は Q-013 完了まで `blocked` を維持する。

## WIP制限
- 同時進行は最大2Issue
- 各Issueは1PRで完結
