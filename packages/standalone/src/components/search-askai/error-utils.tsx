/**
 * Utility functions and components for handling AI errors
 * (aligned with DocSearch `utils/ai` thread-depth handling for Agent Studio JSON bodies)
 */

function threadDepthFromPlainText(message: string): boolean {
  if (!message) return false;
  if (message.toUpperCase().includes("AI-217")) return true;
  return /thread\s+depth/i.test(message);
}

function messageLooksLikeThreadDepth(message: string): boolean {
  if (threadDepthFromPlainText(message)) return true;

  try {
    const parsed = JSON.parse(message) as {
      code?: string;
      errorCode?: string;
      message?: string;
    };
    const code = parsed.code ?? parsed.errorCode;
    if (typeof code === "string" && code.toUpperCase() === "AI-217") {
      return true;
    }
    const nested = typeof parsed.message === "string" ? parsed.message : "";
    return threadDepthFromPlainText(nested);
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  if (error == null) return "";
  if (error instanceof Error) return error.message ?? "";
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

/**
 * Whether the error is thread depth exceeded (AI-217), including JSON-shaped Agent Studio payloads in `message`.
 */
export function isThreadDepthError(error?: unknown): boolean {
  return messageLooksLikeThreadDepth(errorMessage(error));
}

/**
 * Human-readable thread-depth text from the API (plain `Error.message` or JSON `{"message":"…"}`).
 */
export function threadDepthErrorDetail(error?: unknown): string | undefined {
  if (!isThreadDepthError(error)) return undefined;
  const raw = errorMessage(error).trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // `message` is not JSON — use as-is below
  }
  return raw;
}

/**
 * Props for ThreadDepthErrorBanner component
 */
export interface ThreadDepthErrorBannerProps {
  onNewChat?: () => void;
  detailMessage?: string;
}

/**
 * ThreadDepthErrorBanner component
 * Displays a user-friendly message when the conversation reaches the thread depth limit
 */
export const ThreadDepthErrorBanner = ({
  onNewChat,
  detailMessage,
}: ThreadDepthErrorBannerProps) => (
  <div className="ss-thread-depth-error-banner">
    {detailMessage ? (
      <p className="ss-thread-depth-error-detail">{detailMessage}</p>
    ) : null}
    <p className="ss-thread-depth-error-main">
      This conversation is now closed to keep responses accurate.{" "}
      {onNewChat ? (
        <button
          type="button"
          className="ss-thread-depth-error-link"
          onClick={onNewChat}
        >
          Start a new conversation
        </button>
      ) : (
        <span className="ss-thread-depth-error-cta">
          Start a new conversation
        </span>
      )}{" "}
      to continue.
    </p>
  </div>
);
