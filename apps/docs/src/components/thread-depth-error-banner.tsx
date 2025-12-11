/**
 * ThreadDepthErrorBanner component
 * Displays a user-friendly message when the conversation reaches the thread depth limit
 */

export interface ThreadDepthErrorBannerProps {
  onNewChat: () => void;
}

export const ThreadDepthErrorBanner = ({ onNewChat }: ThreadDepthErrorBannerProps) => (
  <div className="text-gray-900 text-sm leading-normal">
    This conversation is now closed to keep responses accurate.{" "}
    <button
      type="button"
      className="text-blue-600 underline font-normal cursor-pointer bg-transparent border-none p-0 hover:text-blue-800 focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 focus:rounded-sm"
      onClick={onNewChat}
    >
      Start a new conversation
    </button>{" "}
    to continue.
  </div>
);

