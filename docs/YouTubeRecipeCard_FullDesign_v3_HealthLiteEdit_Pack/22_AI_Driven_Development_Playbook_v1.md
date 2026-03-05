# 22 AI駆動開発プレイブック v1

作成日: 2026-03-05

## 22.1 目的
- 開発者の介入を最小化し、AI主体で実装を継続できる運用ルールを定義する。

## 22.2 標準フロー（1機能単位）
1. 仕様確認: PRD / UX / OpenAPI / DB Schema を読み合わせ
2. 実装: Route Handler + UI + domain lib を同時更新
3. 検証: lint / typecheck / 該当テスト
4. 仕様同期: docs更新（仕様変更があった場合）
5. PR作成: 目的、変更点、リスク、テスト結果を明記

## 22.3 AIへの依頼テンプレ
- 目的
- 変更対象ファイル
- 受け入れ基準
- 失敗時の挙動
- テスト観点

## 22.4 Agent Skills運用
- `architecture`: API/DB/構成変更
- `backend-integration`: 外部API連携
- `ui-design`: 画面実装
- `state-management`: 状態管理
- `coding-standards`: 品質維持
- `testing`: テスト整備

## 22.5 MCP活用方針（推奨）
- GitHub MCP:
  - Issue起票、PR作成、レビューコメント整備を自動化
- Playwright MCP:
  - E2Eシナリオの実行、失敗スクリーンショット収集
- Figma MCP (利用時):
  - デザイン差分抽出と実装差分の突合
- Notion MCP (利用時):
  - 仕様決定ログ、リリースノート管理

## 22.6 ガードレール
- 重大仕様変更時は必ず docs 更新を先行
- OpenAPI未更新でAPI実装を変更しない
- 栄養値を断定しない（confidence/coverage必須）
- YouTubeデータ利用規約逸脱の実装をしない
