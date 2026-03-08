# 15 API実装規約 v1

作成日: 2026-03-05

## 15.1 目的
- Route Handler実装のゆらぎをなくし、AIでも一貫したAPI品質を維持する。

## 15.2 対象
- `apps/web/app/api/**/route.ts`

## 15.3 必須原則
- 入力検証はZodを必須化し、失敗時は `bad_request` を返す。
- エラー形式は `13_API_Error_Contract_v1.md` に統一する。
- 更新系は認可を必須化（JWT owner または匿名edit token）。
- 外部API連携には timeout/retry を設定する。

## 15.4 標準レスポンス
- 成功: `NextResponse.json(payload, { status: 200 })`
- 失敗: 共通エラーJSON

```json
{
  "error": {
    "code": "bad_request",
    "message": "Invalid request payload",
    "request_id": "req_123",
    "retryable": false,
    "details": {"field": "url"}
  }
}
```

## 15.5 Route Handlerテンプレ
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const raw = await req.json();
    const parsed = requestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Invalid request payload",
            request_id: requestId,
            retryable: false,
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // 1) 認可判定
    // 2) ドメイン処理
    // 3) DB更新

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: "Unexpected server error",
          request_id: requestId,
          retryable: false,
        },
      },
      { status: 500 },
    );
  }
}
```

## 15.6 認可判定手順（必須）
1. `Authorization: Bearer` のJWTを確認。
2. JWTが有効なら `owner_user_id == auth.uid()` を確認。
3. JWTがない場合は `X-Recipe-Edit-Token` を検証。
4. 共有公開readのみ `public_slug` ベースで許可。
5. 失敗時は `401` または `403` を返す。

## 15.7 エラー生成ルール
- 400: Zod検証失敗、パラメータ不正
- 401: 認証情報不足
- 403: 認可NG
- 404: レコード不存在
- 409: 競合（slug衝突/楽観ロック）
- 429: レート制限
- 503: 外部依存障害
- 500: 予期しない障害

## 15.8 再試行ルール
- `retryable=true`: 429, 503, 一部409
- `retryable=false`: 400, 401, 403, 404, 500

## 15.9 ログ要件
- 全リクエストで `request_id` を採番。
- エラーログには `code`, `message`, `request_id`, `actor_type` を含める。



