# 02 Task Queue (Agent Autopilot)

このキューは、AIが次の実装対象を自動選定するための単一ソース。

## Rules
- AIは `status=todo` の先頭から1件を選ぶ。
- 実装後は「この内容でPRを作成しますか？」とユーザーに確認し、OKならPRを作成する。
- ユーザーがNOの場合は、指示に従い内容を修正・分割・統合する。
- PR作成後に `done` へ更新し、次の1件へ進む。
- 仕様不足でブロックした場合のみ `blocked` にして理由を書く。

## Queue
| id | area | task | status | acceptance | spec_sync |
|---|---|---|---|---|---|
| UX-001 | ux | Home詳細UX定義（状態/エラー/遷移） | done | 画面仕様が03_UX_Detailに追記される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-002 | ux | RecipeDetail詳細UX定義 | done | 栄養/未確定/失敗時UIが定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-003 | ux | NutritionFix詳細UX定義 | done | 候補選択/g入力/保存導線が定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| UX-004 | ux | CookMode詳細UX定義 | done | ステップ遷移/タイマー/中断復帰が定義される | `03_UX_Detail/01_MVP_Screen_Spec.md` |
| Q-001 | import | URL parser unit test実装 | done | watch/shorts/youtu.be が通る | `11_Test_Plan_v3.md` |
| Q-002 | import | YouTube metadata client実装 | done | timeout/retry付きでtitle取得 | `24_NFR_SLO_v1.md` |
| Q-003 | api | POST /api/recipes/import 実装 | done | OpenAPI準拠で200/400/429/503を返す | `08_OpenAPI_v3.yaml`, `20_API_Error_Contract_v1.md`, `28_OpenAPI_Examples_v1.md` |
| Q-004 | ui | Home 画面のimport導線実装 | todo | 入力/エラー/loading状態あり + レシピカード基盤 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `03_UX_Detail/05_Component_Spec.md` |
| Q-005 | ui | RecipeDetail 栄養カード実装 | todo | confidence/coverage/unresolved表示 + CookMode導線 + サムネイル | `03_UX_Detail/01_MVP_Screen_Spec.md`, `17_UI_Copy_Disclaimer.md` |
| Q-006 | nutrition | POST /api/recipes/{id}/nutrition 実装 | todo | cache更新とunresolved返却 | `08_OpenAPI_v3.yaml`, `20_API_Error_Contract_v1.md` |
| Q-007 | ui | NutritionFix 画面実装 | todo | 候補選択 + g入力 + 保存 + 低confidence理由表示 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `17_UI_Copy_Disclaimer.md` |
| Q-008 | share | POST /api/recipes/{id}/share 実装 | todo | slug作成/rotate | `08_OpenAPI_v3.yaml`, `19_Auth_Authorization_RLS_v1.md` |
| Q-009 | ui | SharePage 実装 | todo | 元動画埋め込み + クレジット表示 + レシピカード再利用 | `03_UX_Detail/01_MVP_Screen_Spec.md`, `13_Legal_Compliance_v3.md` |
| Q-010 | test | import->detail->cook E2E追加 | todo | Playwrightで主要導線が通る | `11_Test_Plan_v3.md` |
