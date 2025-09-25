import { type UIMessage, useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIDataTypes,
  type UIMessagePart,
} from "ai";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchBox } from "react-instantsearch";
import { getValidToken } from "./askai";
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

function useKeyboardListener(
  callback: (e: KeyboardEvent) => void,
  dependencies: React.DependencyList,
) {
  useEffect(() => {
    document.addEventListener("keydown", callback);
    return () => document.removeEventListener("keydown", callback);
    // biome-ignore lint/correctness/useExhaustiveDependencies: passed by param
  }, dependencies);
}

interface ChatWidgetProps {
  initialQuestion?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  config: {
    applicationId: string;
    apiKey: string;
    indexName: string;
    assistantId: string;
    baseAskaiUrl?: string;
  };
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
  initialQuestion,
  inputRef,
  config,
}: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const { refine } = useSearchBox();
  const [copiedExchangeId, setCopiedExchangeId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const baseUrl = config.baseAskaiUrl || "https://beta-askai.algolia.com";
  const transport = new DefaultChatTransport({
    api: `${baseUrl}/chat`,
    headers: async () => {
      const token = await getValidToken({ assistantId: config.assistantId });
      return {
        "x-algolia-api-key": config.apiKey,
        "x-algolia-application-id": config.applicationId,
        "x-algolia-index-name": config.indexName,
        "x-algolia-assistant-id": config.assistantId,
        "x-ai-sdk-version": "v5",
        authorization: `TOKEN ${token}`,
      };
    },
  });

  const { messages, sendMessage, status, error } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }
    },
  });

  const [lastSentQuery, setLastSentQuery] = useState("");
  const hasAutoSent = useRef(false);

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

  const handleSendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed && trimmed !== lastSentQuery) {
        sendMessage({ text: trimmed });
        setLastSentQuery(trimmed);
      }
    },
    [lastSentQuery, sendMessage],
  );

  // Auto-send initial question
  useEffect(() => {
    const trimmed = (initialQuestion ?? "").trim();
    if (trimmed && !hasAutoSent.current && trimmed !== lastSentQuery) {
      handleSendMessage(trimmed);
      hasAutoSent.current = true;
      refine("");
      inputRef.current?.focus();
      inputRef.current!.value = "";
    }
  }, [initialQuestion, handleSendMessage, refine, inputRef, lastSentQuery]);

  // Listen for Enter key presses
  useKeyboardListener(
    useCallback(
      (e: KeyboardEvent) => {
        if (
          e.key === "Enter" &&
          inputRef.current?.value &&
          inputRef.current.value.trim() !== lastSentQuery
        ) {
          handleSendMessage(inputRef.current.value);
          inputRef.current!.value = "";
        }
      },
      [inputRef, lastSentQuery, handleSendMessage],
    ),
    [inputRef, lastSentQuery, handleSendMessage],
  );

  const isGenerating = status === "submitted" || status === "streaming";

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
        <p className="ss-hint">
          Answers are generated using AI and may make mistakes.
        </p>
        {/* errors */}
        {error && <div className="ss-error-banner">{error.message}</div>}

        {/* exchanges */}
        {exchanges
          .slice()
          .reverse()
          .map((exchange, index) => {
            const isLastExchange = index === 0;

            return (
              <article key={exchange.id} className="ss-qa-card">
                <header className="ss-qa-header">
                  <div className="ss-qa-question">
                    {exchange.userMessage.parts.map((part, index) =>
                      part.type === "text" ? (
                        // biome-ignore lint/suspicious/noArrayIndexKey: better
                        <span key={index}>{part.text}</span>
                      ) : null,
                    )}
                  </div>
                </header>

                <section className="ss-qa-answer">
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
                </section>

                <footer className="ss-qa-actions">
                  <button
                    type="button"
                    title="Like"
                    aria-label="Like"
                    className="ss-qa-action-btn"
                  >
                    <LikeIcon size={18} />
                  </button>
                  <button
                    type="button"
                    title="Dislike"
                    aria-label="Dislike"
                    className="ss-qa-action-btn"
                  >
                    <DislikeIcon size={18} />
                  </button>
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
                    disabled={copiedExchangeId === exchange.id}
                    onClick={async () => {
                      const textContent = exchange
                        .assistantMessage!.parts.filter(
                          (part) => part.type === "text",
                        )
                        .map((part) => part.text)
                        .join("");
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
