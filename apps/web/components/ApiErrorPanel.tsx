import type { ImportErrorCode } from "@/types/api";

type ApiErrorPanelProps = {
  code: ImportErrorCode;
  message: string;
  retryable: boolean;
  onRetry: () => void;
};

export function ApiErrorPanel({ code, message, retryable, onRetry }: ApiErrorPanelProps) {
  return (
    <section
      className="rounded-xl border border-rose-300 bg-rose-50 p-4"
      role="alert"
      aria-live="polite"
      data-testid="api-error-panel"
    >
      <p className="text-sm font-semibold text-rose-900">{message}</p>
      <p className="mt-1 text-xs text-rose-700">error code: {code}</p>
      {retryable ? (
        <button
          type="button"
          className="mt-3 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
          onClick={onRetry}
        >
          再試行する
        </button>
      ) : null}
    </section>
  );
}
