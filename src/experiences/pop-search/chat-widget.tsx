import React, { useCallback, useEffect, useState, useMemo, useRef, memo } from "react";
import { useSearchBox } from "react-instantsearch";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import {
  API_KEY,
  APPLICATION_ID,
  ASSISTANT_ID,
  BASE_ASKAI_URL,
  INDEX_NAME,
} from "./constants";
import { getValidToken } from "./askai";
import { Streamdown } from "streamdown";

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
  dependencies: React.DependencyList
) {
  useEffect(() => {
    document.addEventListener("keydown", callback);
    return () => document.removeEventListener("keydown", callback);
  }, dependencies);
}

interface ChatWidgetProps {
  initialQuestion?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

interface MessagePart {
  type: string;
  text: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

interface Exchange {
  id: string;
  userMessage: Message;
  assistantMessage: Message | null;
}

export const ChatWidget = memo(function ChatWidget({ initialQuestion, inputRef }: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const { refine } = useSearchBox();

  const transport = new DefaultChatTransport({
    api: `${BASE_ASKAI_URL}/chat`,
    headers: async () => {
      const token = await getValidToken({ assistantId: ASSISTANT_ID });
      return {
        "x-algolia-api-key": API_KEY,
        "x-algolia-application-id": APPLICATION_ID,
        "x-algolia-index-name": INDEX_NAME,
        "x-algolia-assistant-id": ASSISTANT_ID,
        "x-ai-sdk-version": "v5",
        authorization: `TOKEN ${token}`,
      };
    },
  });

  const { messages, sendMessage, status, error } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const [lastSentQuery, setLastSentQuery] = useState("");
  const hasAutoSent = useRef(false);

  // Group messages into exchanges (user + assistant pairs)
  const exchanges = useMemo(() => {
    const grouped: Exchange[] = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "user") {
        const userMessage = messages[i] as Message;
        const assistantMessage =
          messages[i + 1]?.role === "assistant" ? (messages[i + 1] as Message) : null;
        if (assistantMessage) {
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage,
          });
          i++; // Skip the assistant message since we've already processed it
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
    [lastSentQuery, sendMessage, refine]
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
      [inputRef, lastSentQuery, handleSendMessage]
    ),
    [inputRef, lastSentQuery, handleSendMessage]
  );

  const isGenerating = status === "submitted" || status === "streaming";

  return (
    <div className="qs-chat-root">
      <div className="qs-qa-list">
        <p className="qs-hint">
          Answers are generated with AI which can make mistakes. Verify
          responses.
        </p>
        {/* errors */}
        {error && <div className="qs-error-banner">{error.message}</div>}

        {/* exchanges */}
        {exchanges
          .slice()
          .reverse()
          .map((exchange, index) => {
            const isLastExchange = index === 0;

            return (
              <article key={exchange.id} className="qs-qa-card">
                <header className="qs-qa-header">
                  <div className="qs-qa-question">
                    {exchange.userMessage.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                </header>

                <section className="qs-qa-answer">
                  <div className="qs-qa-answer-content">
                    {exchange.assistantMessage ? (
                      <div className="qs-qa-markdown">
                        {exchange.assistantMessage.parts.map((part, index) =>
                          part.type === "text" ? (
                            <Streamdown key={index}>{part.text}</Streamdown>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <div className="qs-qa-generating">
                        {isGenerating && isLastExchange ? "…" : ""}
                      </div>
                    )}
                  </div>
                </section>

                <footer className="qs-qa-actions">
                  <button
                    className="qs-qa-action-btn"
                    onClick={() => {
                      const textContent = exchange.assistantMessage!.parts
                        .filter(part => part.type === "text")
                        .map(part => part.text)
                        .join("");
                      copyText(textContent);
                    }}
                  >
                    Copy
                  </button>
                  <button className="qs-qa-action-btn" disabled>
                    Like
                  </button>
                  <button className="qs-qa-action-btn" disabled>
                    Dislike
                  </button>
                </footer>
              </article>
            );
          })}
      </div>
    </div>
  );
});
