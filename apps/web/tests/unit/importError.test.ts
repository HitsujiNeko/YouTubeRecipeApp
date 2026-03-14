import { describe, expect, it } from "vitest";

import { mapImportApiError } from "@/lib/home/importError";

describe("mapImportApiError", () => {
  it("maps known code to spec message", () => {
    const mapped = mapImportApiError({
      error: {
        code: "too_many_requests",
        message: "rate limited",
        request_id: "req_1",
        retryable: true,
      },
    });

    expect(mapped).toEqual({
      code: "too_many_requests",
      message: "混み合っています。少し待って再試行してください",
      retryable: true,
    });
  });

  it("falls back when payload shape is invalid", () => {
    const mapped = mapImportApiError("bad payload");

    expect(mapped).toEqual({
      code: "internal_error",
      message: "予期しないエラーが発生しました",
      retryable: false,
    });
  });
});
