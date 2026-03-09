# YouTube Recipe Card - Copilot 指示

## プロダクト範囲
- `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack` に定義されたMVPを実装する。
- `01_Product_and_PRD_Handbook_v3.md` の非ゴールを守る。

## ドキュメント参照優先順位
- 全体設計の正本は `docs/YouTubeRecipeCard_FullDesign_v3_HealthLiteEdit_Pack` とする。
- AI実装時の運用・実装手順・詳細画面仕様は `docs/AI_Development` を優先参照する。
- 仕様差分がある場合は、実装前にドキュメント間の不整合を解消する。

## Skill運用
- `SKILL.md` は自動選択される前提で運用する。
- ただし確実に適用したい場合は、タスク指示内にスキル名（例: `backend-integration`）を明示する。
- 各 `SKILL.md` の `description` は日本語 + 英語キーワード併記とし、発火精度を高める。

## 自走モード運用
- ユーザーが「続けて」「次を進めて」と指示した場合、
	`docs/AI_Development/01_Product_Backlog/02_Task_Queue.md` の先頭 `todo` を自動選択して着手する。
- 実装完了後はキューのstatusを `done` に更新し、次の `todo` を提案する。
- ブロック時のみ `blocked` と理由を記録し、必要最小限の確認質問を行う。

## 事前チェック（実装前）
- 対象画面の詳細仕様が `docs/AI_Development/03_UX_Detail` に存在しない場合、先にUX詳細設計を追加する。
- 画面遷移、状態、エラー時UI、主要コンポーネントが定義されるまで本実装を開始しない。

## 技術スタック
- Frontend/Backend: Next.js App Router + Route Handlers
- DB/Auth: Supabase Postgres
- LLM: OpenAI API
- Deploy: Vercel + Supabase

## 実装ルール
- 変更は小さく保つ（1 PR = 1 機能）。
- LLM出力は永続化前に必ずZodで検証する。
- 栄養値を断定値として返さない。常に `confidence` / `coverage` を含める。
- APIエラーは `13_API_Error_Contract_v1.md` の契約に従う。
- OpenAPI（`05_OpenAPI_v3.yaml`）とRoute Handler実装を同期する。

### PR作成ルール
- PR作成時は必ず `.github/pull_request_template.md` の形式を厳守し、全項目を埋めて提出すること。
- テンプレートに沿わないPRは差し戻し対象とする。
- PR提出前に、PR本文の事実整合レビュー（過大表現チェック）を必ず実施し、`実装済み` / `検証済み` / `未実施` を明確に区別して記載すること。
- PR提出前に、`03_Coding_Standards.md` 準拠のセルフレビューを実施し、逸脱がある場合は理由とフォローアップをPR本文に記載すること。

### フォーマットチェック対策
- CIで `format:check` がfailした場合は、`npm run format` → 再コミット・再pushで必ず修正すること。
- VSCode利用者は「保存時に自動整形」拡張の利用を推奨。

## セキュリティルール
- YouTubeの動画/音声バイナリをダウンロード・保存しない。
- YouTube Data API v3（APIキー認証）でメタデータ・埋め込みリンクを取得する。
- 字幕テキスト（timedtext）の取得は許可する。ただしテキストのみを対象とし、動画/音声バイナリは取得しない。
  - 取得した字幕テキストはユーザー操作に紐づく形でのみDBに永続化する。
  - 取得ライブラリは `youtube-transcript` 等のテキスト取得専用のものを使用し、動画ストリームを取得するものは禁止。
- 更新系APIは owner認可（JWT）または匿名edit tokenで制御する。
- service role keyをクライアントへ公開しない。

## テストルール
- パーサと栄養ロジックのユニットテストを追加/更新する。
- 主要ハッピーパスと失敗時UXをE2Eで担保する。

## 完了条件
- 挙動変更時に要件ドキュメントを更新している。
- lint/typecheckが通る。
- 関連テストが通る。
- APIレスポンス形状がOpenAPIと一致する。

