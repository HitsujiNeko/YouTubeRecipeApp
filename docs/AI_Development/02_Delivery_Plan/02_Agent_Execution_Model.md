# 02 Agent Execution Model

## 目的
- ユーザーが毎回タスク詳細を書かなくても、AIが連続実装できる運用を定義する。

## 実行手順（毎サイクル）
1. `docs/AI_Development/01_Product_Backlog/02_Task_Queue.md` の先頭 `todo` を選択。
2. 対応する仕様を参照（PRD, OpenAPI, DB, UX詳細）。
3. 実装 + テスト + docs更新を1セットで完了。
4. キューのstatusを `done` へ更新。
5. 次タスクに進む。

## スキル選定ルール
- API/外部連携: `backend-integration`
- UI: `ui-design`
- 設計変更: `architecture`
- 状態管理: `state-management`
- 品質改善/リファクタ: `coding-standards`
- テスト追加: `testing`

## ブロック時のルール
- `blocked` へ変更し、欠けている仕様を1行で追記。
- 代替タスクがあれば次の `todo` を処理する。
