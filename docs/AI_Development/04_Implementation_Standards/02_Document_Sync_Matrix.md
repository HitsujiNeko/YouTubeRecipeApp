# 02 Document Sync Matrix

## 目的
- 仕様変更時の更新漏れを防ぐため、変更種別ごとの必須更新先を固定化する。

## 変更影響マトリクス

| 変更種別 | 必須更新ファイル | 任意更新ファイル |
|---|---|---|
| API request/response 変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/05_OpenAPI_v3.yaml`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/13_API_Error_Contract_v1.md` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/18_OpenAPI_Examples_v1.md` |
| DB schema 変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/04_DB_Schema_v3.sql`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/03_Tech_Architecture_v3.md` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/12_Auth_Authorization_RLS_v1.md` |
| 認証/認可変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/12_Auth_Authorization_RLS_v1.md`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/05_OpenAPI_v3.yaml` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/08_Legal_Compliance_v3.md` |
| 画面仕様変更 | `docs/AI_Development/03_UX_Detail/01_MVP_Screen_Spec.md` | `docs/AI_Development/03_UX_Detail/03_Screen_Flow.md`, `docs/AI_Development/03_UX_Detail/04_Wireframes.md`, `docs/AI_Development/03_UX_Detail/05_Component_Spec.md` |
| 免責/UIコピー変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/02_UX_Spec_v3.md` | `docs/AI_Development/03_UX_Detail/01_MVP_Screen_Spec.md` |
| Product/PRD戦略変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/01_Product_and_PRD_Handbook_v3.md` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/02_UX_Spec_v3.md`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/03_Tech_Architecture_v3.md`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/08_Legal_Compliance_v3.md`, `docs/AI_Development/01_Execution_Hub.md` |
| 抽出Prompt/Test変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/06_Extraction_and_Nutrition_Pipeline_v3.md` | `docs/AI_Development/04_Implementation_Standards/04_Extraction_Logic_Design.md` |
| 実装順序/タスク変更 | `docs/AI_Development/01_Product_Backlog/02_Task_Queue.md`, `docs/AI_Development/02_Delivery_Plan/01_Implementation_Order.md` | `docs/AI_Development/01_Product_Backlog/01_MVP_Issue_Backlog.md` |
| 抽出ロジック変更 | `docs/AI_Development/04_Implementation_Standards/04_Extraction_Logic_Design.md`, `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/06_Extraction_and_Nutrition_Pipeline_v3.md` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/09_Roadmap_Backlog_v3.md` |
| 非機能要件変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/16_NFR_SLO_v1.md` | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/14_Engineering_Operations_Handbook_v1.md`, `docs/AI_Development/05_Operations_and_Quality/01_Quality_Gates.md` |
| CI/CD運用変更 | `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack/14_Engineering_Operations_Handbook_v1.md`, `.github/workflows/ci.yml` | `.github/pull_request_template.md` |

## PRチェック（必須）
- 変更種別を1つ以上選択
- マトリクスの「必須更新ファイル」がすべて更新済みか確認
- 未更新の場合は理由をPR本文に記載

