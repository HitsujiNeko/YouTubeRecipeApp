# 13 API Error Contract v1

作成日: 2026-03-05

## 13.1 目的
- フロント実装と再試行制御のため、エラー形式を統一する。

## 13.2 共通レスポンス
```json
{
  "error": {
    "code": "too_many_requests",
    "message": "YouTube API quota exceeded",
    "request_id": "req_...",
    "retryable": true,
    "details": {}
  }
}
```

## 13.3 エラーコード一覧
- `bad_request` (400): 入力不正、バリデーション失敗
- `unauthorized` (401): 認証/トークン不足
- `forbidden` (403): 認可失敗
- `not_found` (404): 対象なし
- `conflict` (409): slug衝突、更新競合
- `too_many_requests` (429): レート制限
- `upstream_unavailable` (503): YouTube/LLMなど外部依存障害
- `internal_error` (500): 予期しない障害

## 13.4 再試行方針
- 即時再試行しない: 400/401/403/404/409
- バックオフ再試行: 429/503（最大3回）
- UIは `retryable` を優先して制御

## 13.5 監視
- すべてのエラーで `request_id` をログ出力
- 429/503の発生率をダッシュボード監視


