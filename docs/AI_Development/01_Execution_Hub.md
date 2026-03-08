# 01 Execution Hub

更新日: 2026-03-08
目的: 実装時に最短で参照すべきドキュメントを1枚で示す。

## 0. まずここだけ見る
1. 実行順（唯一の着手順）
- `docs/AI_Development/01_Product_Backlog/02_Task_Queue.md`

2. 今回タスクの依存・近傍計画
- `docs/AI_Development/02_Delivery_Plan/01_Implementation_Order.md`

3. 変更時の必須同期先
- `docs/AI_Development/04_Implementation_Standards/02_Document_Sync_Matrix.md`

4. 品質ゲート
- `docs/AI_Development/05_Operations_and_Quality/01_Quality_Gates.md`

## 1. レイヤー定義（迷わないための役割分離）
- Strategy（戦略）:
  - `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/09_Roadmap_Backlog_v3.md`
- Execution（実行順）:
  - `docs/AI_Development/01_Product_Backlog/02_Task_Queue.md`
- Contract（仕様契約）:
  - OpenAPI: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/05_OpenAPI_v3.yaml`
  - DB: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/04_DB_Schema_v3.sql`
  - Error: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/13_API_Error_Contract_v1.md`
- UX Detail（画面詳細）:
  - `docs/AI_Development/03_UX_Detail/01_MVP_Screen_Spec.md`

## 2. 実行ルール（固定）
- 着手順は Queue 先頭 `todo` のみで決定する。
- `done` への更新は PR作成時に行う。
- `blocked` は仕様不足/依存待ち/外部待ちを許可し、理由と解除条件を書く。
- Roadmap は優先背景として参照し、着手順を直接決めない。

## 3. 典型フロー
1. Queueの先頭 `todo` を選ぶ。
2. `spec_sync` にある契約文書を読む。
3. 実装する。
4. Quality Gatesに従って検証する。
5. Queueを更新し、PR作成時に `done` にする。

## 4. docs-only変更時
- `docs/**` のみ変更時は lint/typecheck/test は任意。
- ただし最低限、以下の整合確認は必須:
  - Queue
  - Delivery Plan
  - Sync Matrix

## 5. 安定参照ID方針
- ファイル番号（例: `02_`, `14_`）は可読性のために使う。
- 長期参照は「文書ID + 役割」で管理し、番号変更に依存しない。
- 推奨ID:
  - `DOC-PRD-HANDBOOK` -> `01_Product_and_PRD_Handbook_v3.md`
  - `DOC-UX-SPEC` -> `02_UX_Spec_v3.md`
  - `DOC-PIPELINE` -> `06_Extraction_and_Nutrition_Pipeline_v3.md`
  - `DOC-ENG-OPS` -> `14_Engineering_Operations_Handbook_v1.md`

