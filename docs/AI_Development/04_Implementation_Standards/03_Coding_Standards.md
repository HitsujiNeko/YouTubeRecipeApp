# 03 Coding Standards

## 目的
- 実装品質のばらつきを減らし、AI/人間の両方で安全に変更できる基準を明確化する。

## 適用範囲
- `apps/web/**` の TypeScript/Next.js 実装
- `app/api/**/route.ts` の Route Handler 実装
- テスト (`tests/unit`, `tests/e2e`) と関連ドキュメント更新

## 共通ルール
- TypeScript strict を前提とする。
- `any` は原則禁止。やむを得ず型回避する場合は `@ts-expect-error` に理由を明記する。
- `unknown` は型ガードで必ず絞り込んでから使う。
- 例外を握りつぶさない。ユーザー向け文言とログ/詳細情報を分離する。
- 入力値は信頼せず、境界で Zod 検証する。
- 1ファイル1責務を意識し、重複処理は共通関数/共通コンポーネントへ集約する。

## TypeScript 規約
- 関数の入出力は可能な限り明示型を付ける。
- 型定義は実装から分離し、再利用可能な型は集約する。
- 型の標準配置（新規導入時）:
	- Supabase テーブル型: `apps/web/types/database.ts`
	- API request/response 型: `apps/web/types/api.ts`
	- ドメインモデル型: `apps/web/types/models.ts`
- `@ts-ignore` の使用は禁止。型回避が必要な場合は `@ts-expect-error: 理由` を使う。

## React 規約
- Class Component は使用せず、Functional Component のみ使用する。
- Hooks ルールを守る（条件分岐内でHookを呼ばない）。
- `useState`, `useEffect`, `useMemo`, `useCallback` は責務に応じて適切に使う。
- Custom Hook は `apps/web/hooks/` に配置する（新規導入時）。
- Client Component (`"use client"`) は最小化し、可能な限り Server Component を優先する。

## CSS / Styling 規約
- UIスタイリングは Tailwind CSS を標準とする。
- CSS Modules の新規導入は原則禁止。例外が必要な場合は理由をPR本文に記載する。
- レスポンシブはモバイルファーストで実装し、`sm/md/lg` を段階的に適用する。
- UI文言・注意書きは仕様ドキュメントの定義を優先する。

## Import 順序
- import は次の順序で記述する:
	1. React
	2. Next.js
	3. 外部ライブラリ
	4. 内部モジュール（`@/` 絶対パス）
	5. 相対パス（同一ディレクトリ周辺のみ）
- `import type` を適切に使い、型importと値importを必要に応じて分離する。

## フロントエンド規約 (Next.js App Router)
- 画面は `app/**/page.tsx`、再利用UIは `components/**`、純粋ロジックは `lib/**` に配置する。
- UI状態は仕様の状態遷移に合わせて明示的に定義する（例: `idle`, `loading`, `error`）。
- 画像は `next/image` を優先し、外部画像は `next.config.ts` の `images.remotePatterns` で許可する。
- ユーザー向けエラーメッセージは UX仕様の文言に合わせる。

## API/サーバー規約
- `app/api/**/route.ts` では `NextRequest` / `NextResponse` を使う。
- リクエスト/レスポンスの型とバリデーションを明示する。
- エラー応答は `20_API_Error_Contract_v1.md` と整合させる。
- OpenAPI変更がある場合は `08_OpenAPI_v3.yaml` を同時更新する。

## テスト規約
- ロジック追加時は最低1つのユニットテストを追加/更新する。
- 仕様の受け入れ条件に対応する観点をテストまたはPR本文に明記する。
- E2E未実施の場合は理由とフォローアップTaskをPRに記載する。

## PR品質ゲート
- 提出前に `npm run format`, `npm run lint`, `npm run typecheck` を実行する。
- 必要な範囲で `npm run test:unit` / `npm run test:e2e` を実行する。
- PR本文で `実装済み` / `検証済み` / `未実施` を区別して記載する。

## 既存実装への適用方針（遡及ポリシー）
- 規約策定前の既存コードを一括で全面改修することは必須としない。
- 今後は「触った箇所を規約準拠へ近づける（Boy Scout Rule）」を基本方針とする。
- 大規模な規約違反が見つかった場合は、別Taskとして分離し段階的に改善する。
- 規約逸脱を残す場合は、PR本文に理由とフォローアップTaskを明記する。

## ドキュメント同期
- 仕様/契約に影響する変更は `02_Document_Sync_Matrix.md` を基準に必須ドキュメントを更新する。

## 参考
- 参考資料: `docs/参考資料/CodingGuide.ja.md`
- 本ドキュメントと矛盾がある場合は、本リポジトリの実装実態と契約ドキュメントを優先する。
