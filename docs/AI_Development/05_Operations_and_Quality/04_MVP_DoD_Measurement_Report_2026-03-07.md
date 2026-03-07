# 04 MVP DoD Measurement Report (2026-03-07)

対象ブランチ: `main`
実行環境: ローカル (`apps/web`, `http://localhost:3000`)

## 1) 代表動画セットで成功率>=70%

計測対象URL（10件）:
- https://www.youtube.com/watch?v=WLfTFCKqANA
- https://www.youtube.com/watch?v=QH2-TGUlwu4
- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://www.youtube.com/watch?v=9bZkp7q19f0
- https://www.youtube.com/watch?v=3JZ_D3ELwOQ
- https://www.youtube.com/watch?v=kJQP7kiw5Fk
- https://www.youtube.com/watch?v=M7lc1UVf-VE
- https://www.youtube.com/watch?v=aqz-KE-bpKQ
- https://www.youtube.com/watch?v=e-ORhEE9VVg
- https://www.youtube.com/watch?v=fJ9rUzIMcZQ

実行コマンド:
- `node scripts/mvp_dod_measurement.js`

結果:
- import成功件数: 9/10
- 成功率: 0.90
- 判定: **達成**（目標 >= 0.70）

補足:
- 失敗1件は `https://www.youtube.com/watch?v=QH2-TGUlwu4`。
- エラーボディ例: `{"error":{"code":"upstream_unavailable","message":"YouTube metadata missing snippet.title",...,"details":{"provider":"youtube"}}}`

## 2) confidence>=0.55割合>=50%

同計測での結果:
- confidence取得件数: 9件
- confidence>=0.55 件数: 0件
- 割合: 0.00
- 判定: **未達**（目標 >= 0.50）

理由:
- 現行実装では import直後に `recipe_ingredients/recipe_ingredient_matches/food_nutrients_per_100g` が未充足のため、`POST /api/recipes/{id}/nutrition` の `confidence` が0.00で返るケースが大半。

## 3) モバイル片手操作の実機観点チェック

実施内容:
- Playwrightにモバイルエミュレーション検証を追加
  - `tests/e2e/smoke.spec.ts` の `mobile one-hand usability` シナリオ
- 実行コマンド:
  - `npm run test:e2e`

結果:
- E2E: 3/3 passed
- 追加シナリオ: `cook mode primary controls are reachable and operable` pass
- 判定: **代替達成（エミュレーション）**

注意:
- 本項目は「実機観点」要件のため、最終リリース判定では実デバイス確認ログを別途残すこと。

## 総括
- DoD計測は「記録」までは完了。
- しきい値判定は以下:
  - 成功率: 達成（0.90）
  - confidence割合: 未達（0.00）
  - モバイル操作: エミュレーションでは確認済み
