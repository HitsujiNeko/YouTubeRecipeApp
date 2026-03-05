# 27 CI/CD定義 v1

作成日: 2026-03-05

## 27.1 目的
- 変更品質を自動ゲートで担保し、壊れた状態のmain反映を防止する。

## 27.2 ブランチ戦略
- `main`: 本番反映
- `release`: リリース候補
- `feature/*`: 機能開発
- 原則: 直接push禁止、PR必須

## 27.3 必須CIゲート
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- ユニット/統合テスト（追加時）
- `npm run test:e2e`（重要フロー変更時）

## 27.4 PRテンプレート（必須項目）
- 目的
- 変更内容
- 仕様変更の有無（docs更新リンク）
- テスト結果
- リスクとロールバック手順

## 27.5 マージ条件
- CI全通過
- レビュー1名以上承認
- OpenAPI変更時は実装差分確認

## 27.6 デプロイ
- `release` マージでStagingデプロイ
- `main` マージでProductionデプロイ
- 失敗時は直近安定版へ即時ロールバック

## 27.7 AI開発向け補足
- 1PR 1機能を厳守
- 大規模変更は先にdocsを更新してから実装
- 生成コードは必ず差分レビューを通す

## 27.8 実装済みテンプレート
- CI Workflow: `.github/workflows/ci.yml`
- PR Template: `.github/pull_request_template.md`
