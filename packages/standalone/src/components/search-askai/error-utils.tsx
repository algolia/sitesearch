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

type MessageWithRole = { role: string };

/**
 * When thread depth is exceeded, the last user turn has no assistant reply — omit it so the UI
 * only shows successful exchanges (same behavior as DocSearch modal / sidepanel).
 */
export function filterMessagesForThreadDepthError<T extends MessageWithRole>(
  messages: T[],
  threadDepthError: boolean,
): T[] {
  if (!threadDepthError || messages.length === 0) {
    return messages;
  }

  const last = messages[messages.length - 1];
  if (last.role === "user") {
    return messages.slice(0, -1);
  }

  return messages;
}

/**
 * Props for ThreadDepthErrorBanner component
 */
export interface ThreadDepthErrorBannerProps {
  onNewChat?: () => void;
}

/**
 * ThreadDepthErrorBanner component
 * Displays a user-friendly message when the conversation reaches the thread depth limit
 */
export const ThreadDepthErrorBanner = ({
  onNewChat,
}: ThreadDepthErrorBannerProps) => (
  <div className="ss-thread-depth-error-banner">
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
  </div>
);
