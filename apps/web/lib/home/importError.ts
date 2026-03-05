import type { ImportErrorCode } from "@/types/api";

export type ImportUiError = {
  code: ImportErrorCode;
  message: string;
  retryable: boolean;
};

const FALLBACK_MESSAGE = "予期しないエラーが発生しました";

const ERROR_MESSAGE_BY_CODE: Record<ImportErrorCode, string> = {
  bad_request: "YouTube URL形式を確認してください",
  too_many_requests: "混み合っています。少し待って再試行してください",
  upstream_unavailable: "外部サービス応答待ちです。再試行してください",
  internal_error: "予期しないエラーが発生しました",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function mapImportApiError(payload: unknown): ImportUiError {
  if (!isObject(payload)) {
    return {
      code: "internal_error",
      message: FALLBACK_MESSAGE,
      retryable: false,
    };
  }

  const error = payload.error;

  if (!isObject(error)) {
    return {
      code: "internal_error",
      message: FALLBACK_MESSAGE,
      retryable: false,
    };
  }

  const rawCode = error.code;
  const retryable = error.retryable === true;

  if (
    rawCode === "bad_request" ||
    rawCode === "too_many_requests" ||
    rawCode === "upstream_unavailable" ||
    rawCode === "internal_error"
  ) {
    return {
      code: rawCode,
      message: ERROR_MESSAGE_BY_CODE[rawCode],
      retryable,
    };
  }

  return {
    code: "internal_error",
    message: FALLBACK_MESSAGE,
    retryable: false,
  };
}
