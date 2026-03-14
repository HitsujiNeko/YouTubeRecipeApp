# 03 Coding Standards

## 目的
- 実装品質のばらつきを減らし、AI/人間の両方で安全に変更できる基準を明確化する。
- 規約と実運用コマンドを一致させ、PR時の差し戻し（特に Format Check）を最小化する。

## 適用範囲
- `apps/web/**` の TypeScript/Next.js 実装
- `app/api/**/route.ts` の Route Handler 実装
- テスト (`tests/unit`, `tests/e2e`) と関連ドキュメント更新
- CI（`.github/workflows/ci.yml`）の `web-checks`

## 規約レベル
- MUST: 例外なく守る。違反は修正する。
- SHOULD: 原則守る。逸脱時は PR に理由を書く。

## 共通ルール
- MUST: TypeScript strict を前提とする。
- MUST: `any` は禁止。やむを得ず型回避する場合は `unknown` + 型ガード、または `@ts-expect-error: 理由` を使う。
- MUST: `@ts-ignore` は禁止する。
- MUST: `unknown` は型ガードで絞り込んでから使う。
- MUST: 例外を握りつぶさない。ユーザー向け文言とログ/詳細情報を分離する。
- MUST: 入力値は信頼せず、境界で Zod 検証する。
- SHOULD: 1ファイル1責務を意識し、重複処理は共通関数/共通コンポーネントへ集約する。

## TypeScript 規約
- SHOULD: 関数の入出力は可能な限り明示型を付ける。
- SHOULD: 型定義は実装から分離し、再利用可能な型は集約する。
- 型の標準配置（新規導入時）:
  - Supabase テーブル型: `apps/web/types/database.ts`
  - API request/response 型: `apps/web/types/api.ts`
  - ドメインモデル型: `apps/web/types/models.ts`
- MUST: `@ts-expect-error` を使う場合は説明コメントを必須とする。

## React 規約
- MUST: Class Component は使用せず、Functional Component のみ使用する。
- MUST: Hooks ルールを守る（条件分岐内で Hook を呼ばない）。
- SHOULD: Custom Hook は `apps/web/hooks/` に配置する（新規導入時）。
- SHOULD: Client Component (`"use client"`) は最小化し、可能な限り Server Component を優先する。

## CSS / Styling 規約
- MUST: UIスタイリングは Tailwind CSS を標準とする。
- SHOULD: CSS Modules の新規導入は避ける。例外時は PR に理由を記載する。
- SHOULD: レスポンシブはモバイルファーストで実装し、`sm/md/lg` を段階的に適用する。
- MUST: UI文言・注意書きは仕様ドキュメントの定義を優先する。

## Import 規約
- MUST: import は次の順序で記述する。
  1. React
  2. Next.js
  3. 外部ライブラリ
  4. 内部モジュール（`@/` 絶対パス）
  5. 相対パス（同一ディレクトリ周辺のみ）
- MUST: `import type` を適切に使い、型importと値importを必要に応じて分離する。
- MUST: ESLint (`import/order`) で順序違反を検出する。
- SHOULD: 既存コードの移行期間中は warning 運用とし、変更対象ファイルでは warning を解消してから PR を作成する。

## API/サーバー規約
- MUST: `app/api/**/route.ts` では `NextRequest` / `NextResponse` を使う。
- MUST: リクエスト/レスポンスの型とバリデーションを明示する。
- MUST: エラー応答は `13_API_Error_Contract_v1.md` と整合させる。
- MUST: OpenAPI変更がある場合は `05_OpenAPI_v3.yaml` を同時更新する。

## 環境変数変更規約
- MUST: サーバー環境変数を追加・変更した場合、次の4点を同一PRで更新する。
  1. `apps/web/lib/env.ts` の Zod スキーマ
  2. `apps/web/.env.example`
  3. `apps/web/README.md` の Required environment variables
  4. 必要なら運用ドキュメント（Runbook/Handbook）
- MUST: 開発時は未設定時に fail-fast する（起動時または利用時に明確なエラーを返す）。

## テスト規約
- MUST: ロジック追加時は最低1つのユニットテストを追加/更新する。
- MUST: 仕様の受け入れ条件に対応する観点をテストまたはPR本文に明記する。
- SHOULD: E2E未実施の場合は理由とフォローアップTaskをPRに記載する。

## 品質ゲート（ローカル/CI）
- ローカル提出前（MUST）:
  1. `npm run format:check`
  2. `npm run lint`
  3. `npm run typecheck`
  4. `npm run test:unit`
- 推奨一括コマンド:
  - `npm run verify:prepr:auto`
  - 目視確認も含める場合は `npm run verify:prepr`
- CI（MUST）:
  - `web-checks` で `lint`, `typecheck`, `format:check`, `test:unit` を必須とする。

## Format Check 失敗を減らす運用（重要）
- MUST: 変更ファイルを編集した直後に対象ファイルだけ Prettier を実行する。
  - 例: `npx prettier apps/web/tests/unit/api/recipesImportRoute.test.ts --write`
- MUST: コミット前に差分ファイルへ `--check` をかける。
  - 例: `npx prettier <changed-files> --check`
- MUST: PR作成前に必ず `npm run format:check` を通す。
- SHOULD: 手動で改行位置を整えようとせず、Prettierの結果を正とする。
- SHOULD: 大きなリファクタ時は「ロジック変更」と「整形のみ変更」をコミット分離する。

## PR記載ルール
- MUST: PR本文で `実装済み` / `検証済み` / `未実施` を区別して記載する。
- MUST: 未実施項目がある場合は理由とフォローアップTaskを記載する。

## 既存実装への適用方針（遡及ポリシー）
- 規約策定前の既存コードを一括で全面改修することは必須としない。
- 今後は「触った箇所を規約準拠へ近づける（Boy Scout Rule）」を基本方針とする。
- 大規模な規約違反が見つかった場合は、別Taskとして分離し段階的に改善する。

## ドキュメント同期
- 仕様/契約に影響する変更は `02_Document_Sync_Matrix.md` を基準に必須ドキュメントを更新する。
