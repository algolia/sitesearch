/**
 * Utility functions and components for handling AI errors
 */

/**
 * Checks if an error is a thread depth error (AI-217)
 * Thread depth errors occur when a conversation has reached its maximum depth limit
 * 
 * @param error - The error to check
 * @returns true if the error is a thread depth error (AI-217)
 */
export function isThreadDepthError(error?: Error | null): boolean {
  if (!error) return false;
  
  // Check if error has a code property
  const errorWithCode = error as Error & { code?: string };
  if (errorWithCode.code === 'AI-217') return true;
  
  // Check message content for AI-217 or thread depth references
  const message = error.message?.toLowerCase() || '';
  return message.includes('ai-217') || message.includes('thread depth');
}

/**
 * Props for ThreadDepthErrorBanner component
 */
export interface ThreadDepthErrorBannerProps {
  onNewChat: () => void;
}

/**
 * ThreadDepthErrorBanner component
 * Displays a user-friendly message when the conversation reaches the thread depth limit
 */
export const ThreadDepthErrorBanner = ({ onNewChat }: ThreadDepthErrorBannerProps) => (
  <div className="ss-thread-depth-error-banner">
    This conversation is now closed to keep responses accurate.{" "}
    <button
      type="button"
      className="ss-thread-depth-error-link"
      onClick={onNewChat}
    >
      Start a new conversation
    </button>{" "}
    to continue.
  </div>
);

