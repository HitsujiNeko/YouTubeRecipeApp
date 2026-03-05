export type ImportErrorCode =
  | "bad_request"
  | "too_many_requests"
  | "upstream_unavailable"
  | "internal_error";

export type ApiErrorResponse<TCode extends string = string> = {
  error: {
    code: TCode;
    message: string;
    request_id: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};

export type ImportRecipeRequest = {
  url: string;
  language: string;
  options: {
    allow_ai_infer_steps: boolean;
    compute_nutrition: boolean;
  };
};

export type ImportRecipeResponse = {
  recipe_id: string;
  extraction_confidence: number;
  nutrition: null;
};

export type ImportApiErrorResponse = ApiErrorResponse<ImportErrorCode>;
