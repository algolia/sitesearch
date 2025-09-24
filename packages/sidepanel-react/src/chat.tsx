import type { UIMessage } from "@ai-sdk/react";
import type { UIDataTypes, UIMessagePart } from "ai";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrainIcon,
  CheckIcon,
  CopyIcon,
  DislikeIcon,
  LikeIcon,
  SearchIcon,
} from "./icons";
import { MemoizedMarkdown } from "./markdown";

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

export interface SearchIndexTool {
  input: {
    query: string;
  };
  output: {
    query: string;
    hits: unknown[];
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

export interface ChatWidgetProps {
  messages: Message[];
  error: Error | null;
  isGenerating: boolean;
}

export const ChatWidget = memo(function ChatWidget({
  messages,
  error,
  isGenerating,
}: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const [copiedExchangeId, setCopiedExchangeId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);

  // Group messages into exchanges (user + assistant pairs)
  const exchanges = useMemo(() => {
    const grouped: Exchange[] = [];
    for (let i = 0; i < messages.length; i++) {
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
  }, [messages]);

  // isGenerating is provided by parent

  // Cleanup any pending reset timers on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="sp-chat-root">
      <div className="sp-qa-list">
        {/* errors */}
        {error && <div className="sp-error-banner">{error.message}</div>}

        {/* exchanges */}
        {exchanges
          .slice()
          .reverse()
          .map((exchange, index) => {
            const isLastExchange = index === 0;

            return (
              <article key={exchange.id} className="sp-qa-card">
                <div className="sp-qa-header">
                  <div className="sp-qa-question">
                    {exchange.userMessage.parts.map((part, index) =>
                      part.type === "text" ? (
                        // biome-ignore lint/suspicious/noArrayIndexKey: better
                        <span key={index}>{part.text}</span>
                      ) : null,
                    )}
                  </div>
                </div>

                <section className="sp-qa-answer">
                  <div className="sp-qa-answer-content">
                    {exchange.assistantMessage ? (
                      <div className="sp-qa-markdown">
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
                              <p className="sp-tool-info" key={`${index}`}>
                                <BrainIcon />{" "}
                                <span className="sp-shimmer-text">
                                  Reasoning...
                                </span>
                              </p>
                            );
                          } else if (part.type === "tool-searchIndex") {
                            if (part.state === "input-streaming") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="sp-tool-info" key={`${index}`}>
                                  <SearchIcon size={18} />{" "}
                                  <span className="sp-shimmer-text">
                                    Searching...
                                  </span>
                                </p>
                              );
                            } else if (part.state === "input-available") {
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: better
                                <p className="sp-tool-info" key={`${index}`}>
                                  <SearchIcon size={18} />{" "}
                                  <span className="sp-shimmer-text">
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
                                <p className="sp-tool-info" key={`${index}`}>
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
                                <p className="sp-tool-info" key={`${index}`}>
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
                      <div className="sp-qa-markdown sp-qa-generating sp-shimmer-text">
                        {isGenerating && isLastExchange ? "Thinking..." : ""}
                      </div>
                    )}
                  </div>
                </section>

                <footer className="sp-qa-actions">
                  <button type="button" className="sp-qa-action-btn">
                    <LikeIcon size={18} />
                  </button>
                  <button type="button" className="sp-qa-action-btn">
                    <DislikeIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className={`sp-qa-action-btn ${
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
                        .join("");
                      if (!textContent) return;
                      try {
                        await copyText(textContent);
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
                </footer>
              </article>
            );
          })}
      </div>
    </div>
  );
});
