# 00 Document Map

## 目的
- ドキュメントの役割分離を明確にし、AIの参照迷子を防ぐ。

## 参照優先順位
0. 実行ハブ: `docs/AI_Development/01_Execution_Hub.md`
1. 全体設計の正本: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/01_Product_and_PRD_Handbook_v3.md`（契約詳細は同フォルダ内の個別文書を参照）
2. AI実装運用の正本: `docs/AI_Development/README.md`（詳細は配下の個別文書を参照）

補足:
- 画面詳細、実装手順、運用手順は `docs/AI_Development/README.md` から配下の個別文書を優先参照する。
- PRD/OpenAPI/DBの契約は `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/01_Product_and_PRD_Handbook_v3.md` と関連個別文書を優先する。
- 矛盾があれば実装前に差分解消し、両方更新する。

## フォルダ役割
- `01_Product_Backlog`: Issue粒度の実装項目定義
- `02_Delivery_Plan`: 実装順序、依存関係、マイルストーン
- `03_UX_Detail`: 画面詳細、状態、バリデーション、文言
- `04_Implementation_Standards`: API実装テンプレ、命名、品質規約
- `05_Operations_and_Quality`: NFR/SLO、運用Runbook、CI品質基準

## 実装規約（参照先）
- コーディング規約: `docs/AI_Development/04_Implementation_Standards/03_Coding_Standards.md`
