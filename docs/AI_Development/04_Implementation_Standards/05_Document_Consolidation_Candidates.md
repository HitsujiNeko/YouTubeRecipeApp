# 05 Document Consolidation Candidates

更新日: 2026-03-08
対象: `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack`
目的: AI駆動開発時の参照コストを下げるため、統合候補をファイル単位で明示する。

## 1. 方針
- 契約文書（OpenAPI/DB/Error Contract/Auth）は分離維持。
- 40行未満かつ責務が近い文書は統合候補。
- 実行順は Queue を唯一の基準にし、Roadmap は優先背景として扱う。

## 2. 統合候補マップ（具体ファイル）

### A. Product/PRD 系の統合
- 候補ソース:
  - `00_Project_Overview_v3.md`
  - `01_Market_Research_v3.md`
  - `02_Personas_JTBD_v3.md`
  - `03_Problem_Solution_Priority_v3.md`
  - `04_PRD_MVP_v3.md`
- 統合先案:
  - `01_Product_and_PRD_Handbook_v3.md`
- 理由:
  - 連続参照される戦略情報が分散し、要約の重複が多い。
- 進捗:
  - 2026-03-08 Phase 3として実施済み（`00/01/02/03/04` は移行案内のみ保持）。

### B. UX/コピー系の統合
- 候補ソース:
  - `05_UX_Spec_v3.md`
  - `17_UI_Copy_Disclaimer.md`
- 統合先案:
  - `05_UX_Spec_v3.md`（末尾に Disclaimer節を統合）
- 理由:
  - `17` は3行で独立文書メリットが薄い。
- 進捗:
  - 2026-03-08 Phase 1として実施済み（`17` は移行案内のみ保持）。

### C. 開発運用系の統合
- 候補ソース:
  - `14_AI_Dev_Runbook_v3.md`
  - `21_Dev_Environment_Setup_v1.md`
  - `22_AI_Driven_Development_Playbook_v1.md`
  - `26_Operations_Runbook_v1.md`
  - `27_CI_CD_Definition_v1.md`
- 統合先案:
  - `21_Engineering_Operations_Handbook_v1.md`
- 理由:
  - 実装手順・運用手順・CI手順が横断参照されるため、1冊化で実行導線を短縮できる。
- 進捗:
  - 2026-03-08 Phase 2として実施済み（`14/21/22/26/27` は移行案内のみ保持）。

### D. 栄養・抽出運用系の部分統合
- 候補ソース:
  - `09_Extraction_and_Nutrition_Pipeline_v3.md`
  - `10_Prompt_Library_v3.md`
  - `11_Test_Plan_v3.md`
- 統合先案:
  - `09_Extraction_and_Nutrition_Pipeline_v3.md` を親にして、`10/11` は付録化
- 理由:
  - 抽出改善タスク（Q-013）で同時参照する頻度が高い。
- 進捗:
  - 2026-03-08 Phase 4として実施済み（`10/11` は移行案内のみ保持）。

### E. 置換済み（継続）
- 対象:
  - `15_Roadmap_Backlog_v3.xlsx` -> `15_Roadmap_Backlog_v3.md`
- 理由:
  - AIが直接参照・差分管理しやすいフォーマットへ統一。

## 3. 分離維持（統合しない）
- `07_DB_Schema_v3.sql`（契約/実装ソース）
- `08_OpenAPI_v3.yaml`（API契約ソース）
- `20_API_Error_Contract_v1.md`（共通エラー契約）
- `19_Auth_Authorization_RLS_v1.md`（認可契約）
- `23_API_Implementation_Standard_v1.md`（実装標準）

## 4. 実施優先順
1. B（UX/Disclaimer）: 低リスクで即効性が高い
2. C（運用1冊化）: AI実装の参照効率に最も効く
3. A（Product/PRD）: 重複を整理して戦略理解を安定化
4. D（抽出・栄養付録化）: Q-013完了後に適用

## 5. 成果指標（KPI）
- 1タスクあたり初期参照ファイル数を `<= 5` に抑える。
- docs更新時の必須同期漏れを 0 件にする。
- AI実装時の「参照先確認」往復回数を半減する。

## 6. 運用ルール（統合時）
- 統合後は旧ファイルを即削除せず、1リリース分は「移行案内」だけ残す。
- `02_Document_Sync_Matrix.md` を同時更新する。
- Queue/Deliveryの参照先リンクを同時更新する。
