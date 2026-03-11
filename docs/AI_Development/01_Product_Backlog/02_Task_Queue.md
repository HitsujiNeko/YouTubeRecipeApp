# 02 Task Queue (Agent Autopilot)

このキューは、AIが次の実装対象を自動選定するための単一ソース。

## Rules
- AIは `status=todo` の先頭から1件を選ぶ。
- 実装後は「この内容でPRを作成しますか？」とユーザーに確認し、OKならPRを作成する。
- ユーザーがNOの場合は、指示に従い内容を修正・分割・統合する。
- `done` への更新タイミングは **PR作成時** とする（mainマージ待ちで止めない）。
- `blocked` は「仕様不足」だけでなく「依存タスク待ち」「外部待ち（APIキー/環境/権限）」も許可し、理由を明記する。

## Status Definition
- `todo`: 先頭候補。未着手。
- `blocked`: 着手不能。理由と解除条件が必要。
- `done`: 実装/検証完了かつPR作成済み。

## Queue
| id | area | task | status | acceptance | spec_sync |
|---|---|---|---|---|---|
| UX-001 | ux | Home詳細UX定義（状態/エラー/遷移） | done | 画面仕様が03_UX_Detailに追記される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-002 | ux | RecipeDetail詳細UX定義 | done | 栄養/未確定/失敗時UIが定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-003 | ux | NutritionFix詳細UX定義 | done | 候補選択/g入力/保存導線が定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-004 | ux | CookMode詳細UX定義 | done | ステップ遷移/タイマー/中断復帰が定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-001 | import | URL parser unit test実装 | done | watch/shorts/youtu.be が通る | `06_Extraction_and_Nutrition_Pipeline_v3.md` |
| Q-002 | import | YouTube metadata client実装 | done | timeout/retry付きでtitle取得 | `16_NFR_SLO_v1.md` |
| Q-003 | api | POST /api/recipes/import 実装 | done | OpenAPI準拠で200/400/429/503を返す | `05_OpenAPI_v3.yaml`, `13_API_Error_Contract_v1.md`, `18_OpenAPI_Examples_v1.md` |
| Q-004 | ui | Home 画面のimport導線実装 | done | 入力/エラー/loading状態あり + レシピカード基盤 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `03_UX_Detail/05_Component_Spec.md` |
| Q-005 | ui | RecipeDetail 栄養カード実装 | done | confidence/coverage/unresolved表示 + CookMode導線 + サムネイル | `03_UX_Detail/01_MVP_Screen_Spec.md`, `02_UX_Spec_v3.md` |
| Q-006 | nutrition | POST /api/recipes/{id}/nutrition 実装 | done | cache更新とunresolved返却 | `05_OpenAPI_v3.yaml`, `13_API_Error_Contract_v1.md` |
| Q-007 | ui | NutritionFix 画面実装 | done | 候補選択 + g入力 + 保存 + 低confidence理由表示 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `02_UX_Spec_v3.md` |
| Q-008 | share | POST /api/recipes/{id}/share 実装 | done | slug作成/rotate | `05_OpenAPI_v3.yaml`, `12_Auth_Authorization_RLS_v1.md` |
| Q-009 | ui | SharePage 実装 | done | 元動画埋め込み + クレジット表示 + レシピカード再利用 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `08_Legal_Compliance_v3.md` |
| Q-010 | test | import->detail->cook E2E追加 | done | Playwrightで主要導線が通る | `06_Extraction_and_Nutrition_Pipeline_v3.md` |
| Q-011 | api/ui | RecipeDetailの実データ表示導線を完成 | done | URL import後にDB保存された材料/手順がRecipeDetailに表示される | `05_OpenAPI_v3.yaml`, `04_DB_Schema_v3.sql`, `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-011A | ops | 開発運用ルール更新（PR作成時done/blocked定義拡張/roadmap連動） | done | Queue/Delivery/SyncMatrix/QualityGatesが一貫し、次タスク判断がぶれない | `02_Task_Queue.md`, `01_Implementation_Order.md`, `02_Document_Sync_Matrix.md`, `01_Quality_Gates.md`, `09_Roadmap_Backlog_v3.md` |
| Q-011B | ops | 実行用ドキュメントハブ整備 | done | AIが最短導線で参照できるハブ文書が整備され、README/Mapから到達できる | `01_Execution_Hub.md`, `README.md`, `00_Document_Map.md` |
| Q-011C | ops | FullDesign統合候補リスト作成 | done | 統合候補がファイル単位で明示され、分離維持対象と実施順が定義される | `04_Implementation_Standards/05_Document_Consolidation_Candidates.md`, `09_Roadmap_Backlog_v3.md` |
| Q-011D | ops | Phase 1（B: UX/Disclaimer統合）実施 | done | `02_UX_Spec_v3.md` にDisclaimerを統合する | `02_UX_Spec_v3.md`, `04_Implementation_Standards/02_Document_Sync_Matrix.md` |
| Q-011E | ops | Phase 2（C: 運用1冊化）実施 | done | `14_Engineering_Operations_Handbook_v1.md` に運用文書を統合する | `14_Engineering_Operations_Handbook_v1.md`, `04_Implementation_Standards/02_Document_Sync_Matrix.md` |
| Q-011F | ops | Phase 3（A: Product/PRD統合）実施 | done | `01_Product_and_PRD_Handbook_v3.md` にProduct/PRD文書を統合する | `01_Product_and_PRD_Handbook_v3.md`, `04_Implementation_Standards/02_Document_Sync_Matrix.md` |
| Q-011G | ops | Phase 4（D: 栄養/抽出運用の部分統合）実施 | done | `06_Extraction_and_Nutrition_Pipeline_v3.md` にPrompt/Testを付録統合する | `06_Extraction_and_Nutrition_Pipeline_v3.md`, `04_Implementation_Standards/02_Document_Sync_Matrix.md` |
| Q-012 | design | 食材/手順抽出ロジック詳細設計 | done | rule/LLM fallback/検証/テスト戦略まで定義される | `04_Implementation_Standards/04_Extraction_Logic_Design.md`, `06_Extraction_and_Nutrition_Pipeline_v3.md` |
| Q-013 | import | 抽出ロジック再実装（3段階パイプライン: description + timedtext字幕 + LLM構造化 + extraction_status） | done | ①DBマイグレーション（extraction_status/source_text列追加）②字幕取得クライアント③source評価関数④LLM構造化⑤import route置換⑥ユニット+統合テスト。APIレスポンスにextraction_statusが含まれ、8割カバレッジを目指す | `04_Implementation_Standards/04_Extraction_Logic_Design.md`, `06_Extraction_and_Nutrition_Pipeline_v3.md`, `05_OpenAPI_v3.yaml`, `04_DB_Schema_v3.sql`, `05_Operations_and_Quality/01_Quality_Gates.md` |
| Q-013A | ops | Supabase CLIマイグレーション運用整備（自動化基盤） | done | Q-013の目視確認完了とPR作成時に同時完了扱いにする。`apps/web/supabase/migrations` 運用に移行済み。 | `apps/web/README.md`, `apps/web/package.json`, `.github/workflows/db-migrations.yml`, `04_DB_Schema_v3.sql` |
| Q-013B | ops | PR前目視確認フェーズの標準化（manual QA gate） | done | Q-013の目視確認完了とPR作成時に同時完了扱いにする。`verify:prepr` 導線は整備済み。 | `apps/web/package.json`, `apps/web/README.md`, `05_Operations_and_Quality/01_Quality_Gates.md`, `.github/pull_request_template.md` |
| Q-013C | import | LLMプロバイダ切替（Gemini）と成功実証 | todo | ①Geminiプロバイダ実装（開発:無料枠/本番:有料）②`llm_result=success` を最低1件確認③`extraction_runs.status=success` を最低1件確認④フォールバック動作を維持 | `04_Implementation_Standards/04_Extraction_Logic_Design.md`, `05_OpenAPI_v3.yaml`, `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-018 | ui | 動画アシスト抽出モード実装（P1） | blocked | Q-013完了後。左:YouTube埋め込み、右:レシピカード、下部固定ボタン（＋材料として追加 / ＋手順として追加）。ユーザー操作をトリガーにLLMが候補を提示し、ユーザーが1タップで確定。確定後に栄養再計算。 | `04_Implementation_Standards/04_Extraction_Logic_Design.md`, `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-014 | compliance | Terms/Privacyページと免責表示の完成（Roadmap T-020） | todo | Terms/Privacy導線が追加され、YouTube利用・栄養推定免責がUI上で一貫表示される | `08_Legal_Compliance_v3.md`, `02_UX_Spec_v3.md`, `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-015 | ui | CookModeの実データ表示対応（Roadmap T-010仕上げ） | blocked | Q-013完了後、RecipeDetailと同一データソースでCookModeが動作する | `03_UX_Detail/01_MVP_Screen_Spec.md`, `03_UX_Detail/05_Component_Spec.md`, `06_Extraction_and_Nutrition_Pipeline_v3.md` |
| Q-016 | quality | チャンネル別パーサ最適化（例: リュウジ） | blocked | 代表10URLで抽出品質が改善し、回帰テストで担保される | `09_Roadmap_Backlog_v3.md`, `06_Extraction_and_Nutrition_Pipeline_v3.md`, `04_Implementation_Standards/04_Extraction_Logic_Design.md` |
| Q-017 | search | タグ + 栄養フィルタ検索 | blocked | たんぱく質密度等でフィルタ可能な検索UI/APIが動作する | `09_Roadmap_Backlog_v3.md`, `05_OpenAPI_v3.yaml`, `03_UX_Detail/01_MVP_Screen_Spec.md` |

## Roadmap Link (09_Roadmap_Backlog_v3)
- Q-013 は `T-005/T-006/T-007`（抽出再設計の中核）に対応。新設計: description + timedtext字幕 + LLM構造化 + extraction_status。
- Q-013C は `T-005/T-006/T-007` の運用安定化タスク（LLMプロバイダ切替と成功実証）に対応。
- Q-014 は `T-020`（Compliance）に対応。
- Q-015 は `T-010`（CookMode UI仕上げ）に対応。
- Q-016 は `T-018`（channel-specific parser）に対応。
- Q-017 は `T-019`（tags + nutrition filter）に対応。
- Q-018 は P1 差別化機能（動画アシスト抽出モード）。Q-013完了後に着手可能。

