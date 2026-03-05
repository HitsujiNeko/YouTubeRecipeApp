# YouTubeレシピURL → レシピカード + 推定栄養（PFC等）アプリ：完全設計 v3（ちょい編集B）
作成日: 2026-03-05

## 目的
- YouTubeのレシピ動画URLを入力するだけで、
  1) 材料・手順が整理された「レシピカード」
  2) 推定栄養（kcal / PFC / 食塩相当量 など）
  を生成し、調理中・健康意思決定の両方を支援する。
- 本設計は **AI（Copilot/Codex）が自走して実装できる**粒度で、要件/UX/データ/API/プロンプト/テスト/運用/マーケまで含む。

## コンセプト（不変）
- 入力：YouTube URL
- 出力：レシピカード（材料/手順/クックモード）+ 推定栄養（健康の“選べる”）
- 体験：
  - 調理中：クックモード（1ステップ表示・チェック・タイマー）
  - 作る前：栄養サマリーで選べる（「P/100kcal」など）

## 成功確率を上げるための設計判断（重要）
### ちょい編集（B）を採用
- 「URLだけ」で8割自動生成
- ただし推定栄養は誤差が出るため、
  - **未確定材料のハイライト**
  - **候補選択（上位3）**
  - **g換算の最小入力**
  により“残り2割”だけ直して精度を上げる。

### 差別化軸（ヨウリレシピ等との差別化）
- 競合：材料/手順/時間/分量の構造化、調理モード
- 当アプリ：上記に加え、**推定栄養（PFC・kcal・食塩等）**で「作る前に選べる」を強化
- さらに：SNSで拡散しやすい（「このバズレシピのPFC」）

## 制約（YouTube/規約リスク低減）
- 動画/音声のダウンロード・保存は行わない
- 字幕（captions）を任意動画から自動取得する前提は置かない（YouTube API制約）
- 抽出ソースは基本的に title + description + 章（概要欄タイムスタンプ）
- 生成は“推定”であることを明示し、医療助言ではない注意を表示

## 推奨スタック（低コスト・AI実装向き）
- Frontend: Next.js (TypeScript) + PWA（MVPはWebモバイル。ネイティブアプリは拡張フェーズでReact Native/Expoを検討）
- Backend: Next.js Route Handlers（/api）
- DB/Auth: Supabase Postgres（AuthはMVPで任意。ただし更新APIは owner または edit token で制御）
- LLM: OpenAI API（抽出JSON・材料正規化・g換算補助）
- Hosting: Vercel + Supabase

## 認可・共有のMVP方針（追補）
- レシピの更新系APIは、`Bearer JWT`（ログインユーザー所有）または `X-Recipe-Edit-Token`（匿名オーナー）で認可する。
- `public_slug` はレシピ作成時に必須ではなく、共有作成時に初回発行する。
- 共有ON時のみ `public_slug` を持ち、必要に応じて rotate できる。

## 成果物（このフォルダのファイル）
- 01_Market_Research_v3.md
- 02_Personas_JTBD_v3.md
- 03_Problem_Solution_Priority_v3.md
- 04_PRD_MVP_v3.md
- 05_UX_Spec_v3.md
- 06_Tech_Architecture_v3.md
- 07_DB_Schema_v3.sql
- 08_OpenAPI_v3.yaml
- 09_Extraction_and_Nutrition_Pipeline_v3.md
- 10_Prompt_Library_v3.md
- 11_Test_Plan_v3.md
- 12_Marketing_Strategy_v3.md
- 13_Legal_Compliance_v3.md
- 14_AI_Dev_Runbook_v3.md
- 15_Roadmap_Backlog_v3.xlsx
- 16_Data_Ingestion_MEXT_Runbook.md
- 17_UI_Copy_Disclaimer.md
- 18_Analytics_Event_Schema.json
- 19_Auth_Authorization_RLS_v1.md
- 20_API_Error_Contract_v1.md
- 21_Dev_Environment_Setup_v1.md
- 22_AI_Driven_Development_Playbook_v1.md
- 23_API_Implementation_Standard_v1.md
- 24_NFR_SLO_v1.md
- 25_Data_Retention_Deletion_Policy_v1.md
- 26_Operations_Runbook_v1.md
- 27_CI_CD_Definition_v1.md
- 28_OpenAPI_Examples_v1.md
