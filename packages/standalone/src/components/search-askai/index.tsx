import { liteClient as algoliasearch } from "algoliasearch/lite";
import type { ComponentProps, FC, RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch";
import { useAskai } from "./askai";
import { ChatWidget, type Message } from "./chat";
import { HitsList } from "./hits-list";
import { AlgoliaLogo, SearchIcon } from "./icons";
import { SearchInput } from "./search-input";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useSearchState } from "./useSearchState";

import "./styles.css";
import type { HitsAttributesMapping } from "../types";
import { SearchButton } from "./search-button";
import { Modal } from "./search-modal";
import {
  type SuggestedQuestionHit,
  useSuggestedQuestions,
} from "./use-suggested-questions";
import useEffectiveDarkMode from "./useEffectiveDarkMode";

export interface SearchWithAskAIConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** AI Assistant ID (required for chat functionality) */
  assistantId: string;
  /** Placeholder text for search input (optional, defaults to "What are you looking for?") */
  placeholder?: string;
  /** Number of hits per page (optional, defaults to 8) */
  hitsPerPage?: number;
  /** Custom search button text (optional) */
  buttonText?: string;
  /** Custom search button props (optional) */
  buttonProps?: ComponentProps<typeof SearchButton>;
  /** Enable dark mode (optional) */
  darkMode?: boolean;
  /** Map which hit attributes to render (supports dotted paths) */
  attributes?: HitsAttributesMapping;
  /** Enable Algolia Insights (optional, defaults to true) */
  insights?: boolean;
  /** Additional Algolia search parameters (optional) - e.g., analytics, filters, distinct, etc. */
  searchParameters?: Record<string, unknown>;
  /** Suggested Questions Enabled (optional, defaults to false) */
  suggestedQuestionsEnabled?: boolean;
  /** Open hit URLs in a new tab (optional, defaults to true) */
  openResultsInNewTab?: boolean;
}

interface SearchBoxProps {
  query?: string;
  className?: string;
  placeholder?: string;
  showChat: boolean;
  isGenerating?: boolean;
  isThreadDepthError?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  refine: (query: string) => void;
  setShowChat: (show: boolean) => void;
  onClose?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: (value: string) => boolean;
  onNewChat?: () => void;
}

const SearchBox: FC<SearchBoxProps> = memo(function SearchBox(props) {
  return (
    <SearchInput
      className={props.className}
      placeholder={props.placeholder}
      showChat={props.showChat}
      isGenerating={props.isGenerating}
      isThreadDepthError={props.isThreadDepthError}
      inputRef={props.inputRef}
      setShowChat={props.setShowChat}
      onClose={props.onClose || (() => {})}
      onArrowDown={props.onArrowDown}
      onArrowUp={props.onArrowUp}
      onEnter={props.onEnter}
      onNewChat={props.onNewChat}
    />
  );
});

interface NoResultsProps {
  query: string;
  onAskAI: () => void;
  onClear: () => void;
}

const NoResults: FC<NoResultsProps> = memo(function NoResults({
  query,
  onAskAI,
  onClear,
}) {
  return (
    <div className="ss-no-results">
      <div className="ss-no-results-icon">
        <SearchIcon />
      </div>
      <p className="ss-no-results-title">No results for &quot;{query}&quot;</p>
      <p className="ss-no-results-subtitle">
        Try a different query or ask AI to help.
      </p>
      <div className="ss-no-results-actions">
        <button type="button" className="ss-no-results-btn" onClick={onAskAI}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <title>Ask AI</title>
            <path
              fill="currentColor"
              d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z"
            />
          </svg>
          Ask AI
        </button>
        <button type="button" className="ss-no-results-btn" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
});

interface ResultsPanelProps {
  showChat: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  setShowChat: (showChat: boolean) => void;
  query: string;
  selectedIndex: number;
  refine: (query: string) => void;
  config: SearchWithAskAIConfig;
  messages: unknown[];
  error: Error | null;
  isGenerating: boolean;
  sendMessage: (options: { text: string }) => void | Promise<void>;
  onHoverIndex?: (index: number) => void;
  scrollOnSelectionChange?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
  suggestedQuestions?: SuggestedQuestionHit[];
  onNewChat?: () => void;
  hasThreadDepthError?: boolean;
  openResultsInNewTab?: boolean;
}

const ResultsPanel: FC<ResultsPanelProps> = memo(function ResultsPanel({
  showChat,
  inputRef,
  setShowChat,
  query,
  selectedIndex,
  refine,
  config,
  messages,
  error,
  isGenerating,
  sendMessage,
  onHoverIndex,
  scrollOnSelectionChange = true,
  sendEvent,
  suggestedQuestions,
  onNewChat,
  hasThreadDepthError,
  openResultsInNewTab = true,
}) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  // Enable hover selection only after the user moves the pointer inside the list
  useEffect(() => {
    if (showChat) return;
    const container = containerRef.current;
    if (!container) return;
    setHoverEnabled(false);
    const enable = () => setHoverEnabled(true);
    container.addEventListener("pointermove", enable, { once: true } as any);
    return () => {
      container.removeEventListener("pointermove", enable as any);
    };
  }, [showChat]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    if (showChat || !scrollOnSelectionChange) return;
    const container = containerRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      '[aria-selected="true"]'
    ) as HTMLElement | null;
    if (!selectedEl) return;

    const padding = 8;
    const cRect = container.getBoundingClientRect();
    const iRect = selectedEl.getBoundingClientRect();

    if (iRect.top < cRect.top + padding) {
      container.scrollTop -= cRect.top + padding - iRect.top;
    } else if (iRect.bottom > cRect.bottom - padding) {
      container.scrollTop += iRect.bottom - (cRect.bottom - padding);
    }
  }, [selectedIndex, showChat, items.length, scrollOnSelectionChange]);

  const lastSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showChat) return;
    const trimmed = (query ?? "").trim();
    if (!trimmed) return;
    if (lastSentRef.current === trimmed) return;
    refine("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
    sendMessage({ text: trimmed });
    lastSentRef.current = trimmed;
  }, [showChat, query, inputRef, sendMessage, refine]);

  useEffect(() => {
    if ((messages as Message[]).length === 0) {
      lastSentRef.current = null;
    }
  }, [messages]);

  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isGenerating) return;
      sendMessage({ text: trimmed });
    },
    [isGenerating, sendMessage]
  );

  if (showChat) {
    return (
      <ChatWidget
        messages={messages as unknown as Message[]}
        error={error as Error | null}
        isGenerating={isGenerating}
        applicationId={config.applicationId}
        assistantId={config.assistantId}
        suggestedQuestions={suggestedQuestions}
        onSuggestedQuestionClick={handleSuggestedQuestionClick}
        onNewChat={onNewChat}
        hasThreadDepthError={hasThreadDepthError}
      />
    );
  }

  return (
    <>
      {/** biome-ignore lint/a11y/useSemanticElements: . */}
      <div ref={containerRef} className="ss-hits-container" role="listbox">
        <HitsList
          hits={items as unknown[]}
          query={query}
          selectedIndex={selectedIndex}
          onAskAI={() => setShowChat(true)}
          attributes={config.attributes}
          onHoverIndex={onHoverIndex}
          hoverEnabled={hoverEnabled}
          sendEvent={sendEvent}
          openResultsInNewTab={openResultsInNewTab}
        />
      </div>
    </>
  );
});

interface SearchModalProps {
  onClose?: () => void;
  config: SearchWithAskAIConfig;
}

export function SearchModal({ onClose, config }: SearchModalProps) {
  const { query, refine } = useSearchBox();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useInstantSearch();
  const { items, sendEvent } = useHits();
  const { showChat, setShowChat, handleShowChat } = useSearchState();

  // Focus input when modal opens
  useEffect(() => {
    // Use requestAnimationFrame to ensure the modal is fully rendered
    const rafId = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Lift chat state here to thread isGenerating to the SearchInput
  const {
    messages,
    setMessages,
    error,
    isGenerating,
    sendMessage,
    hasThreadDepthError,
  } = useAskai({
    applicationId: config.applicationId,
    apiKey: config.apiKey,
    indexName: config.indexName,
    assistantId: config.assistantId,
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
    isOpen: showChat,
  });

  const noResults = results.results?.nbHits === 0;
  const {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  } = useKeyboardNavigation(showChat, items, query, config.openResultsInNewTab ?? true);

  const handleActivateSelection = useCallback((): boolean => {
    // Send click event for keyboard navigation before activating
    if (selectedIndex > 0) {
      const hit = items[selectedIndex - 1];
      if (hit) {
        sendEvent?.("click", hit, "Hit Clicked");
      }
    }

    if (activateSelection()) {
      if (selectedIndex === 0) {
        handleShowChat(true);
      }
      return true;
    }
    return false;
  }, [activateSelection, selectedIndex, handleShowChat, items, sendEvent]);

  const showResultsPanel = (!noResults && !!query) || showChat;

  const handleNewChat = useCallback(() => {
    // Clear messages to start a fresh conversation
    setMessages([]);
    setShowChat(true);
    refine("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [setMessages, setShowChat, refine]);

  return (
    <>
      <Configure
        hitsPerPage={config.hitsPerPage || 8}
        {...(config.searchParameters || {})}
      />
      <div className="search-panel">
        <SearchBox
          query={query}
          placeholder={config.placeholder || "What are you looking for?"}
          className="ss-searchbox-form"
          refine={refine}
          showChat={showChat}
          isGenerating={isGenerating}
          isThreadDepthError={hasThreadDepthError}
          setShowChat={setShowChat}
          onClose={onClose}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          onEnter={(value) => {
            const trimmed = (value ?? "").trim();
            if (showChat && trimmed) {
              // Trigger send via ResultsPanel effect
              refine(trimmed);
              return true;
            }
            return handleActivateSelection();
          }}
          inputRef={inputRef}
          onNewChat={handleNewChat}
        />
        {showResultsPanel && (
          <ResultsPanel
            showChat={showChat}
            inputRef={inputRef}
            setShowChat={(v) => {
              setShowChat(v);
            }}
            query={query}
            selectedIndex={selectedIndex}
            refine={refine}
            config={config}
            messages={messages as unknown[]}
            error={error as Error | null}
            isGenerating={isGenerating}
            sendMessage={sendMessage}
            onHoverIndex={hoverIndex}
            scrollOnSelectionChange={selectionOrigin !== "pointer"}
            sendEvent={sendEvent}
            suggestedQuestions={suggestedQuestions}
            onNewChat={handleNewChat}
            hasThreadDepthError={hasThreadDepthError}
            openResultsInNewTab={config.openResultsInNewTab}
          />
        )}
        {noResults && query && !showChat && (
          <NoResults
            query={query}
            onAskAI={() => {
              setShowChat(true);
            }}
            onClear={() => {
              refine("");
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        )}
      </div>
      <Footer showChat={showChat} />
    </>
  );
}

const Footer = memo(function Footer({ showChat }: { showChat: boolean }) {
  const basePoweredByUrl =
    "https://www.algolia.com/developers?utm_medium=referral&utm_content=powered_by&utm_campaign=sitesearch";
  const poweredByHref =
    typeof window !== "undefined"
      ? `${basePoweredByUrl}&utm_source=${encodeURIComponent(
          window.location.hostname
        )}`
      : basePoweredByUrl;
  return (
    <div className="ss-footer">
      <div className="ss-footer-left">
        <div className="ss-footer-kbd-group">
          <kbd className="ss-kbd">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z"
              />
            </svg>
          </kbd>
          <span>{showChat ? "Ask question" : "Open"}</span>
        </div>

        <div className="ss-footer-kbd-group">
          <kbd className="ss-kbd">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m11 7.825l-4.9 4.9q-.3.3-.7.288t-.7-.313q-.275-.3-.288-.7t.288-.7l6.6-6.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l6.6 6.6q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3L13 7.825V19q0 .425-.288.713T12 20t-.712-.288T11 19z"
              />
            </svg>
          </kbd>
          <kbd className="ss-kbd">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M11 16.175V5q0-.425.288-.712T12 4t.713.288T13 5v11.175l4.9-4.9q.3-.3.7-.288t.7.313q.275.3.287.7t-.287.7l-6.6 6.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213l-6.6-6.6q-.275-.275-.275-.687T4.7 11.3q.3-.3.713-.3t.712.3z"
              />
            </svg>
          </kbd>
          <span>Navigate</span>
        </div>
      </div>
      <div className="ss-footer-right">
        {/* 🚧 DO NOT REMOVE the logo if you are on a Free plan
         * https://support.algolia.com/hc/en-us/articles/17226079853073-Is-displaying-the-Algolia-logo-required
         */}
        <a
          className="ss-footer-powered-by"
          href={poweredByHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Powered by </span>
          <AlgoliaLogo />
        </a>
      </div>
    </div>
  );
});

export default function SearchExperience(config: SearchWithAskAIConfig) {
  const searchClient = algoliasearch(config.applicationId, config.apiKey);
  searchClient.addAlgoliaAgent("algolia-sitesearch");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isDark = useEffectiveDarkMode(config.darkMode);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const buttonProps = {
    ...config.buttonProps,
    onClick: openModal,
  };

  return (
    <>
      <SearchButton {...buttonProps} darkMode={isDark}>
        {config.buttonText}
      </SearchButton>
      <Modal isOpen={isModalOpen} onClose={closeModal} isDark={isDark}>
        <InstantSearch
          searchClient={searchClient}
          indexName={config.indexName}
          future={{ preserveSharedStateOnUnmount: true }}
          insights={config.insights || true}
        >
          <SearchModal onClose={closeModal} config={config} />
        </InstantSearch>
      </Modal>
    </>
  );
}
