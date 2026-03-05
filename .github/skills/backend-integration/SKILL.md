---
name: backend-integration
description: "バックエンド実装時に使用 / Use when implementing route handlers, integrations, retries, and error handling"
---

# Backend Integration Skill（API/外部連携）

## フォーカス
- `app/api/**` 配下のRoute Handler実装。
- YouTubeメタデータ取得と抽出パイプライン。
- 栄養計算と `unresolved` 返却契約。

## チェックリスト
1. 入力をZodで検証する。
2. `20_API_Error_Contract_v1.md` に準拠したエラーを返す。
3. 外部APIにタイムアウト/リトライを実装する。
4. `18_Analytics_Event_Schema.json` のイベントを送信する。
