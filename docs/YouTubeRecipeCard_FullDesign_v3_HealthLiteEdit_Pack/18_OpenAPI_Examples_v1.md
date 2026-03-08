# 18 OpenAPI実例集 v1

作成日: 2026-03-05

## 18.1 目的
- フロント実装者向けに成功/失敗レスポンスの実例を提供する。

## 18.2 `POST /api/recipes/import` 成功例
```json
{
  "recipe_id": "0f4f31f5-87bd-4c90-b4dd-8d4e48c7e0fe",
  "extraction_confidence": 0.78,
  "nutrition": {
    "totals": {
      "kcal": 520,
      "protein_g": 34.1,
      "fat_g": 18.2,
      "carbs_g": 49.8,
      "salt_g": 1.9
    },
    "confidence": 0.67,
    "coverage": 0.72,
    "unresolved": [
      {
        "ingredient_id": "54ef5ec8-35c8-4eb6-a024-e6eff2f55f53",
        "name": "油",
        "reason": "quantity_text is ambiguous"
      }
    ]
  }
}
```

## 18.3 `POST /api/recipes/import` 失敗例（429）
```json
{
  "error": {
    "code": "too_many_requests",
    "message": "YouTube API quota exceeded",
    "request_id": "req_7xk3...",
    "retryable": true,
    "details": {
      "provider": "youtube"
    }
  }
}
```

## 18.4 `PATCH /api/recipes/{id}` 失敗例（403）
```json
{
  "error": {
    "code": "forbidden",
    "message": "You are not the owner of this recipe",
    "request_id": "req_09af...",
    "retryable": false
  }
}
```

## 18.5 `POST /api/recipes/{id}/share` 成功例
```json
{
  "public_slug": "r_6u4k2ajw",
  "share_enabled_at": "2026-03-05T10:11:12.000Z",
  "share_slug_rotated_at": "2026-03-05T10:11:12.000Z"
}
```

## 18.6 `POST /api/recipes/{id}/nutrition` 失敗例（503）
```json
{
  "error": {
    "code": "upstream_unavailable",
    "message": "OpenAI temporary unavailable",
    "request_id": "req_76af...",
    "retryable": true,
    "details": {
      "provider": "openai"
    }
  }
}
```

## 18.7 フロント実装ガイド（最小）
- `retryable=true` の場合のみ再試行UIを表示する。
- `request_id` をエラー通知に表示し、問い合わせ時に活用する。
- 403/404は再試行せず、画面導線（戻る/再ログイン）を優先する。


