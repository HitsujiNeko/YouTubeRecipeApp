# 01 API Handler Template

## 目的
- Route Handler実装の最低テンプレを統一する。

## テンプレ
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Invalid request",
            request_id: requestId,
            retryable: false,
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
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
