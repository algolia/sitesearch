import { liteClient as algoliasearch } from "algoliasearch/lite";
import type { FC } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAskai } from "../search-askai/askai";
import { ChatWidget, type Message } from "../search-askai/chat";
import { ThreadDepthErrorBanner } from "../search-askai/error-utils";
import {
  AlgoliaLogo,
  ChatSubmitIcon,
  CloseIcon,
  SparklesIcon,
  SquarePenIcon,
} from "../search-askai/icons";
import { useSuggestedQuestions } from "../search-askai/use-suggested-questions";
import useEffectiveDarkMode from "../search-askai/useEffectiveDarkMode";
import "../search-askai/styles.css";
import "./sidepanel.css";

export interface SidepanelAskAIConfig {
  applicationId: string;
  apiKey: string;
  indexName: string;
  assistantId: string;
  suggestedQuestionsEnabled?: boolean;
  placeholder?: string;
  buttonText?: string;
  agentStudio?: boolean;
  darkMode?: boolean;
  triggerPosition?: "fixed" | "inline";
}

interface SidepanelInnerProps {
  config: SidepanelAskAIConfig;
  onClose: () => void;
}

const basePoweredByUrl =
  "https://www.algolia.com/?utm_medium=website&utm_source=sitesearch&utm_campaign=poweredby";

const SidepanelInner: FC<SidepanelInnerProps> = memo(function SidepanelInner({
  config,
  onClose,
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [input, setInput] = useState("");

  const poweredByHref = useMemo(
    () =>
      typeof window !== "undefined"
        ? `${basePoweredByUrl}&utm_source=${encodeURIComponent(
            window.location.hostname,
          )}`
        : basePoweredByUrl,
    [],
  );

  const {
    messages,
    error,
    isGenerating,
    sendMessage,
    startNewConversation,
    threadDepthError,
    showThreadDepthError,
  } = useAskai({
    applicationId: config.applicationId,
    apiKey: config.apiKey,
    indexName: config.indexName,
    assistantId: config.assistantId,
    agentStudio: config.agentStudio,
  });

  const suggestedQuestionsClient = useMemo(() => {
    const client = algoliasearch(config.applicationId, config.apiKey);
    client.addAlgoliaAgent("algolia-sitesearch");
    return client;
  }, [config.applicationId, config.apiKey]);

  const suggestedQuestions = useSuggestedQuestions({
    searchClient: suggestedQuestionsClient,
    assistantId: config.assistantId,
    suggestedQuestionsEnabled: config.suggestedQuestionsEnabled ?? false,
    isOpen: true,
  });

  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isGenerating) return;
      sendMessage({ text: trimmed });
    },
    [isGenerating, sendMessage],
  );

  const handleNewChat = useCallback(() => {
    startNewConversation();
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [startNewConversation]);

  const placeholder = showThreadDepthError
    ? "Conversation limit reached"
    : isGenerating
      ? "Answering..."
      : (config.placeholder ?? "Ask AI anything");

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || showThreadDepthError) return;
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isGenerating, showThreadDepthError, sendMessage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  return (
    <div className="ss-sidepanel-inner">
      <header className="ss-sidepanel-header">
        <div className="ss-sidepanel-title-group">
          <SparklesIcon
            size={20}
            gradientIdSuffix="-sp-hdr"
            className="ss-sidepanel-title-sparkle"
          />
          <h2 className="ss-sidepanel-title">Ask AI</h2>
        </div>
        <div className="ss-sidepanel-header-actions">
          <button
            type="button"
            className="ss-search-new-chat-button"
            disabled={isGenerating && !showThreadDepthError}
            title={
              showThreadDepthError
                ? "Start a new conversation"
                : "New conversation"
            }
            aria-label={
              showThreadDepthError
                ? "Start a new conversation"
                : "New conversation"
            }
            onClick={handleNewChat}
          >
            <SquarePenIcon size={18} />
          </button>
          <button
            type="button"
            className="ss-search-close-button"
            onClick={onClose}
            aria-label="Close panel"
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="ss-sidepanel-body">
        <ChatWidget
          messages={messages as Message[]}
          error={error as Error | null}
          isGenerating={isGenerating}
          applicationId={config.applicationId}
          apiKey={config.apiKey}
          assistantId={config.assistantId}
          agentStudio={config.agentStudio}
          suggestedQuestions={suggestedQuestions}
          onSuggestedQuestionClick={handleSuggestedQuestionClick}
          onNewChat={handleNewChat}
          threadDepthError={threadDepthError}
          showThreadDepthError={showThreadDepthError}
          threadDepthBannerInChat={false}
          showAiDisclaimer={false}
          newestExchangeFirst={false}
        />
      </div>

      <div className="ss-sidepanel-compose-stack">
        {showThreadDepthError ? (
          <div className="ss-sidepanel-thread-depth-banner">
            <ThreadDepthErrorBanner onNewChat={handleNewChat} />
          </div>
        ) : null}
        <footer className="ss-sidepanel-footer">
          <search
            className="ss-searchbox-form ss-searchbox-form--chat ss-sidepanel-compose-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={512}
              type="search"
              placeholder={placeholder}
              value={input}
              disabled={isGenerating || showThreadDepthError}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="submit"
              className="ss-search-submit-chat-button"
              disabled={isGenerating || showThreadDepthError || !input.trim()}
              title="Send message"
              aria-label="Send message"
            >
              <ChatSubmitIcon size={22} />
            </button>
          </search>
          <div className="ss-sidepanel-ai-notice">
            <p className="ss-sidepanel-ai-notice-text">
              Answers are generated with AI which can make mistakes.
            </p>
          </div>
          <div className="ss-sidepanel-powered-by">
            <a
              className="ss-sidepanel-powered-by-link"
              href={poweredByHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ss-sidepanel-powered-by-label">Powered by </span>
              <AlgoliaLogo size={80} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default function SidepanelAskAIExperience(config: SidepanelAskAIConfig) {
  const [open, setOpen] = useState(false);
  const isDark = useEffectiveDarkMode(config.darkMode);
  const triggerPosition = config.triggerPosition ?? "fixed";

  return (
    <div
      className={`ssask-exp ss-sidepanel-root ss-sidepanel-root--${triggerPosition}${isDark ? " dark" : ""}`}
    >
      <button
        type="button"
        className="ss-sidepanel-trigger"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SparklesIcon size={18} />
        <span>{config.buttonText ?? "Ask AI"}</span>
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              className="ss-sidepanel-backdrop"
              aria-label="Close panel"
              onClick={() => setOpen(false)}
            />
            <div
              className={`ss-sidepanel-panel ssask-exp${isDark ? " dark" : ""}`}
              role="dialog"
              aria-modal="true"
            >
              <SidepanelInner config={config} onClose={() => setOpen(false)} />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
