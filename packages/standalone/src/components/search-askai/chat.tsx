import type { UIMessage } from "@ai-sdk/react";
import type { UIDataTypes, UIMessagePart } from "ai";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postFeedback } from "./askai";
import { isThreadDepthError, ThreadDepthErrorBanner } from "./error-utils";
import {
  BrainIcon,
  CheckIcon,
  CopyIcon,
  DislikeIcon,
  LikeIcon,
  SearchIcon,
} from "./icons";
import { MemoizedMarkdown } from "./markdown";
import type { SuggestedQuestionHit } from "./use-suggested-questions";

function useClipboard() {
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently fail - clipboard access might be blocked
    }
  }, []);

  return { copyText };
}

// keyboard listener not needed: input handled in parent

interface ChatWidgetProps {
  messages: Message[];
  error: Error | null;
  isGenerating: boolean;
  onCopy?: (text: string) => Promise<void> | void;
  onThumbsUp?: (userMessageId: string) => Promise<void> | void;
  onThumbsDown?: (userMessageId: string) => Promise<void> | void;
  applicationId: string;
  assistantId: string;
  suggestedQuestions?: SuggestedQuestionHit[];
  onSuggestedQuestionClick?: (question: string) => void;
  onNewChat?: () => void;
  hasThreadDepthError?: boolean;
}

export interface SearchIndexTool {
  input: {
    query: string;
  };
  output: {
    query: string;
    // biome-ignore lint/suspicious/noExplicitAny: too ambiguous
    hits: any[];
  };
}

export type Message = UIMessage<
  unknown,
  UIDataTypes,
  {
    searchIndex: SearchIndexTool;
  }
>;

export type AIMessagePart = UIMessagePart<
  UIDataTypes,
  {
    searchIndex: SearchIndexTool;
  }
>;

interface Exchange {
  id: string;
  userMessage: Message;
  assistantMessage: Message | null;
}

export const ChatWidget = memo(function ChatWidget({
  messages,
  error,
  isGenerating,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  applicationId,
  assistantId,
  suggestedQuestions,
  onSuggestedQuestionClick,
  onNewChat,
  hasThreadDepthError,
}: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const [copiedExchangeId, setCopiedExchangeId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [acknowledgedExchangeIds, setAcknowledgedExchangeIds] = useState<
    Set<string>
  >(new Set());
  const [submittingExchangeId, setSubmittingExchangeId] = useState<
    string | null
  >(null);

  // Group messages into exchanges (user + assistant pairs)
  const exchanges = useMemo(() => {
    const grouped: Exchange[] = [];
    let skipLastUserMessage = false;

    // If there's a thread depth error, don't show the last user message
    if (hasThreadDepthError && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        skipLastUserMessage = true;
      }
    }

    for (let i = 0; i < messages.length; i++) {
      // Skip the last user message if it caused a thread depth error
      if (skipLastUserMessage && i === messages.length - 1) {
        continue;
      }

      const current = messages[i];
      if (current.role === "user") {
        const userMessage = current as Message;
        const nextMessage = messages[i + 1];
        if (nextMessage?.role === "assistant") {
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: nextMessage as Message,
          });
          i++; // Skip the assistant message since we've already processed it
        } else {
          // No assistant yet – show a pending exchange immediately
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: null,
          });
        }
      }
    }
    return grouped;
  }, [messages, hasThreadDepthError]);

  // Cleanup any pending reset timers on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="ss-chat-root">
      <div className="ss-qa-list">
        {exchanges.length === 0 ? (
          <>
            <div className="ss-chat-welcome">
              <h2 className="ss-chat-welcome-title">
                How can I help you today?
              </h2>
              <p className="ss-chat-welcome-subtitle">
                I search through your content to help you find answers to your
                questions, fast.
              </p>
              {suggestedQuestions && suggestedQuestions.length > 0 ? (
                <div className="ss-suggested-questions">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question.objectID}
                      type="button"
                      className="ss-suggested-question-btn"
                      disabled={isGenerating}
                      onClick={() => {
                        if (isGenerating) return;
                        onSuggestedQuestionClick?.(question.question);
                      }}
                    >
                      {question.question}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {/* thread depth error banner */}
        {hasThreadDepthError && onNewChat && (
          <ThreadDepthErrorBanner onNewChat={onNewChat} />
        )}
        <p className="ss-hint">
          Answers are generated using AI and may make mistakes.
        </p>
        {/* other errors - never show AI-217 errors here */}
        {error && !hasThreadDepthError && !isThreadDepthError(error) && (
          <div className="ss-error-banner">{error.message}</div>
        )}

        {/* exchanges */}
        {exchanges
          .slice()
          .reverse()
          .map((exchange, index) => {
            const isLastExchange = index === 0;

            return (
              <article key={exchange.id} className="ss-qa-card">
                <div className="ss-qa-header">
                  <div className="ss-qa-question">
                    {exchange.userMessage.parts.map((part, index) =>
                      part.type === "text" ? (
                        // biome-ignore lint/suspicious/noArrayIndexKey: better
                        <span key={index}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="ss-qa-answer">
                  <div className="ss-qa-answer-content">
                    {exchange.assistantMessage ? (
                      <div className="ss-qa-markdown">
                        {exchange.assistantMessage.parts.map((part, index) => {
                          if (typeof part === "string") {
                            // biome-ignore lint/suspicious/noArrayIndexKey: better
                            return <p key={`${index}`}>{part}</p>;
                          }
                          if (part.type === "text") {
                            return (
                              // biome-ignore lint/suspicious/noArrayIndexKey: better
                              <MemoizedMarkdown key={`${index}`}>
                                {part.text}
                              </MemoizedMarkdown>
                            );
                          } else if (
                            part.type === "reasoning" &&
                            part.state === "streaming"
                          ) {
                            return (
                              // biome-ignore lint/suspicious/noArrayIndexKey: better
                              <p className="ss-tool-info" key={`${index}`}>
                                <BrainIcon />{" "}
                                <span className="ss-shimmer-text">
                                  Reasoning...
                                </span>
                              </p>
                            );
                          } else if (part.type === "tool-searchIndex") {
                            if (part.state === "input-streaming") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="ss-tool-info" key={`${index}`}>
                                  <SearchIcon size={18} />{" "}
                                  <span className="ss-shimmer-text">
                                    Searching...
                                  </span>
                                </p>
                              );
                            } else if (part.state === "input-available") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="ss-tool-info" key={`${index}`}>
                                  <SearchIcon size={18} />{" "}
                                  <span className="ss-shimmer-text">
                                    Looking for{" "}
                                    <mark>
                                      &quot;{part.input?.query || ""}&quot;
                                    </mark>
                                  </span>
                                </p>
                              );
                            } else if (part.state === "output-available") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="ss-tool-info" key={`${index}`}>
                                  <SearchIcon size={18} />{" "}
                                  <span>
                                    Searched for{" "}
                                    <mark>
                                      &quot;{part.output?.query}&quot;
                                    </mark>{" "}
                                    found {part.output?.hits.length || "no"}{" "}
                                    results
                                  </span>
                                </p>
                              );
                            } else if (part.state === "output-error") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="ss-tool-info" key={`${index}`}>
                                  {part.errorText}
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else {
                            return null;
                          }
                        })}
                      </div>
                    ) : (
                      <div className="ss-qa-markdown ss-qa-generating ss-shimmer-text">
                        {isGenerating && isLastExchange ? "Thinking..." : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ss-qa-actions">
                  {exchange.assistantMessage && !isGenerating ? (
                    acknowledgedExchangeIds.has(exchange.id) ? (
                      <span className="ss-qa-feedback-ack ss-fade">
                        Thanks for your feedback!
                      </span>
                    ) : submittingExchangeId === exchange.id ? (
                      <span className="ss-qa-feedback-ack ss-shimmer-text">
                        Submitting...
                      </span>
                    ) : (
                      <div className="ss-qa-actions-group">
                        <button
                          type="button"
                          title="Like"
                          aria-label="Like"
                          className="ss-qa-action-btn"
                          disabled={
                            !exchange.assistantMessage ||
                            submittingExchangeId === exchange.id
                          }
                          onClick={async () => {
                            if (!exchange.assistantMessage) return;
                            try {
                              setSubmittingExchangeId(exchange.id);
                              if (onThumbsUp) {
                                await onThumbsUp(exchange.userMessage.id);
                              } else {
                                await postFeedback({
                                  assistantId,
                                  appId: applicationId,
                                  messageId: exchange.userMessage.id,
                                  thumbs: 1,
                                });
                              }
                              setAcknowledgedExchangeIds((prev) => {
                                const next = new Set(prev);
                                next.add(exchange.id);
                                return next;
                              });
                            } catch {
                              // ignore errors
                            } finally {
                              setSubmittingExchangeId(null);
                            }
                          }}
                        >
                          <LikeIcon size={18} />
                        </button>
                        <button
                          type="button"
                          title="Dislike"
                          aria-label="Dislike"
                          className="ss-qa-action-btn"
                          disabled={
                            !exchange.assistantMessage ||
                            submittingExchangeId === exchange.id
                          }
                          onClick={async () => {
                            if (!exchange.assistantMessage) return;
                            try {
                              setSubmittingExchangeId(exchange.id);
                              if (onThumbsDown) {
                                await onThumbsDown(exchange.userMessage.id);
                              } else {
                                await postFeedback({
                                  assistantId,
                                  appId: applicationId,
                                  messageId: exchange.userMessage.id,
                                  thumbs: 0,
                                });
                              }
                              setAcknowledgedExchangeIds((prev) => {
                                const next = new Set(prev);
                                next.add(exchange.id);
                                return next;
                              });
                            } catch {
                              // ignore errors
                            } finally {
                              setSubmittingExchangeId(null);
                            }
                          }}
                        >
                          <DislikeIcon size={18} />
                        </button>
                      </div>
                    )
                  ) : null}
                  <button
                    type="button"
                    className={`ss-qa-action-btn ${
                      copiedExchangeId === exchange.id ? "is-copied" : ""
                    }`}
                    aria-label={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    title={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    disabled={
                      !exchange.assistantMessage ||
                      copiedExchangeId === exchange.id
                    }
                    onClick={async () => {
                      const parts = exchange.assistantMessage?.parts ?? [];
                      const textContent = parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")
                        .trim();
                      if (!textContent) return;
                      try {
                        if (onCopy) {
                          await onCopy(textContent);
                        } else {
                          await copyText(textContent);
                        }
                        setCopiedExchangeId(exchange.id);
                        if (copyResetTimeoutRef.current) {
                          window.clearTimeout(copyResetTimeoutRef.current);
                        }
                        copyResetTimeoutRef.current = window.setTimeout(() => {
                          setCopiedExchangeId(null);
                        }, 1500);
                      } catch {
                        // noop – copy may fail silently
                      }
                    }}
                  >
                    {copiedExchangeId === exchange.id ? (
                      <CheckIcon size={18} />
                    ) : (
                      <CopyIcon size={18} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
});
