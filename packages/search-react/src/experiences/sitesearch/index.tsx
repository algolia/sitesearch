import React, { useRef, useCallback, memo, useEffect, useState } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  Configure,
  InstantSearch,
  useSearchBox,
  useInstantSearch,
  useHits,
  PoweredBy,
  RefinementList,
} from "react-instantsearch";

import { ChatWidget } from "./chat";
import { useSearchState } from "./useSearchState";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { SearchInput } from "./search-input";
import { HitsList } from "./hits-list";
import { SparklesIcon, SearchIcon, AlgoliaLogo } from "./icons";

import "./index.css";
import { Modal } from "./search-modal";
import { SearchButton } from "./search-button";

export interface SearchExperienceConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** AI Assistant ID (required for chat functionality) */
  assistantId: string;
  /** Base URL for AI chat API (optional, defaults to beta endpoint) */
  baseAskaiUrl?: string;
  /** Placeholder text for search input (optional, defaults to "What are you looking for?") */
  placeholder?: string;
  /** Number of hits per page (optional, defaults to 8) */
  hitsPerPage?: number;
  /** Keyboard shortcut to open search (optional, defaults to "cmd+k") */
  keyboardShortcut?: string;
  /** Custom search button text (optional) */
  buttonText?: string;
  /** Custom search button props (optional) */
  buttonProps?: React.ComponentProps<typeof SearchButton>;
}

interface SearchBoxProps {
  query?: string;
  className?: string;
  placeholder?: string;
  showChat: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  refine: (query: string) => void;
  setShowChat: (show: boolean) => void;
  setInitialQuestion: (question: string) => void;
  onClose?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => boolean;
}

const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
  return (
    <SearchInput
      className={props.className}
      placeholder={props.placeholder}
      showChat={props.showChat}
      inputRef={props.inputRef}
      setShowChat={props.setShowChat}
      setInitialQuestion={props.setInitialQuestion}
      onClose={props.onClose || (() => { })}
      onArrowDown={props.onArrowDown}
      onArrowUp={props.onArrowUp}
      onEnter={props.onEnter}
    />
  );
});



interface NoResultsProps {
  query: string;
  onAskAI: () => void;
  onClear: () => void;
}

const NoResults = memo(function NoResults({ query, onAskAI, onClear }: NoResultsProps) {
  return (
    <div className="qs-no-results">
      <div className="qs-no-results-icon"><SearchIcon /></div>
      <p className="qs-no-results-title">No results for "{query}"</p>
      <p className="qs-no-results-subtitle">Try a different query or ask AI to help.</p>
      <div className="qs-no-results-actions">
        <button className="qs-no-results-btn" onClick={onAskAI}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z" /></svg>
          Ask AI
        </button>
        <button className="qs-no-results-btn" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
});

interface ResultsPanelProps {
  showChat: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setShowChat: (showChat: boolean) => void;
  query: string;
  initialQuestion?: string;
  selectedIndex: number;
  refine: (query: string) => void;
  config: SearchExperienceConfig;
}

const ResultsPanel = memo(function ResultsPanel({ showChat, inputRef, setShowChat, query, initialQuestion, selectedIndex, refine, config }: ResultsPanelProps) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat) return;
    const container = containerRef.current;
    if (!container) return;
    const selectedEl = container.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (!selectedEl) return;

    const padding = 8;
    const cRect = container.getBoundingClientRect();
    const iRect = selectedEl.getBoundingClientRect();

    if (iRect.top < cRect.top + padding) {
      container.scrollTop -= (cRect.top + padding - iRect.top);
    } else if (iRect.bottom > cRect.bottom - padding) {
      container.scrollTop += (iRect.bottom - (cRect.bottom - padding));
    }
  }, [selectedIndex, showChat, items.length]);

  if (showChat) {
    return <ChatWidget initialQuestion={initialQuestion} inputRef={inputRef} config={config} />;
  }

  return (
    <>
      <div ref={containerRef} className="qs-hits-container" role="listbox">
        <HitsList
          hits={items as any[]}
          query={query}
          selectedIndex={selectedIndex}
          onAskAI={() => setShowChat(true)}
        />
      </div>
    </>
  );
});



interface SearchModalProps {
  onClose?: () => void;
  config: SearchExperienceConfig;
}

export function SearchModal({ onClose, config }: SearchModalProps) {
  const { query, refine } = useSearchBox();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useInstantSearch();
  const { items } = useHits();
  const { showChat, initialQuestion, setShowChat, setInitialQuestion, handleShowChat } = useSearchState();

  const noResults = results.results?.nbHits === 0;
  const { selectedIndex, moveDown, moveUp, activateSelection } = useKeyboardNavigation(showChat, items, query);

  const handleActivateSelection = useCallback((): boolean => {
    if (activateSelection()) {
      if (selectedIndex === 0) {
        handleShowChat(true, query);
      }
      return true;
    }
    return false;
  }, [activateSelection, selectedIndex, query, handleShowChat]);

  const showResultsPanel = (!noResults && !!query) || showChat;

  return (
    <>
      <Configure hitsPerPage={config.hitsPerPage || 8} />
      <div className="search-panel">
        <SearchBox
          query={query}
          placeholder={config.placeholder || "What are you looking for?"}
          className="qs-searchbox-form"
          refine={refine}
          showChat={showChat}
          setShowChat={setShowChat}
          setInitialQuestion={setInitialQuestion}
          onClose={onClose}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          onEnter={handleActivateSelection}
          inputRef={inputRef}
        />
        {showResultsPanel && (
          <ResultsPanel
            showChat={showChat}
            inputRef={inputRef}
            setShowChat={(v) => {
              setShowChat(v);
              if (v) setInitialQuestion(query);
            }}
            query={query}
            initialQuestion={initialQuestion}
            selectedIndex={selectedIndex}
            refine={refine}
            config={config}
          />
        )}
        {noResults && query && !showChat && (
          <NoResults
            query={query}
            onAskAI={() => {
              setShowChat(true);
              setInitialQuestion(query);
            }}
            onClear={() => refine("")}
          />
        )}
      </div>
      <Footer showResultsPanel={showResultsPanel} showChat={showChat} />
    </>
  );
}

const Footer = memo(function Footer({ showResultsPanel, showChat }: { showResultsPanel: boolean, showChat: boolean }) {
  return (
    <div className="qs-footer">
      <div className="qs-footer-left">
        <div className="qs-footer-kbd-group">
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z" /></svg></kbd>
          <span>{showChat ? "Ask question" : "Open"}</span>
        </div>

        <div className="qs-footer-kbd-group">
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m11 7.825l-4.9 4.9q-.3.3-.7.288t-.7-.313q-.275-.3-.288-.7t.288-.7l6.6-6.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l6.6 6.6q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3L13 7.825V19q0 .425-.288.713T12 20t-.712-.288T11 19z" /></svg></kbd>
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 16.175V5q0-.425.288-.712T12 4t.713.288T13 5v11.175l4.9-4.9q.3-.3.7-.288t.7.313q.275.3.287.7t-.287.7l-6.6 6.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213l-6.6-6.6q-.275-.275-.275-.687T4.7 11.3q.3-.3.713-.3t.712.3z" /></svg></kbd>
          <span>Navigate</span>
        </div>
      </div>
      <div className="qs-footer-right">
        {/* 🚧 DO NOT REMOVE the logo if you are on a Free plan 
        * https://support.algolia.com/hc/en-us/articles/17226079853073-Is-displaying-the-Algolia-logo-required
        */}
        <a className="qs-footer-powered-by" href="https://www.algolia.com" target="_blank" rel="quicksearch">
          <span>Powered by </span>
          <AlgoliaLogo />
        </a>
      </div>
    </div>

  );
});


export default function SearchExperience(config: SearchExperienceConfig) {
  const searchClient = algoliasearch(config.applicationId, config.apiKey);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Parse keyboard shortcut (defaults to cmd+k)
  const shortcut = config.keyboardShortcut || "cmd+k";
  const [modifierKey, key] = shortcut.toLowerCase().split("+");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = modifierKey === "cmd"
        ? (event.metaKey || event.ctrlKey)
        : event.getModifierState(modifierKey.charAt(0).toUpperCase() + modifierKey.slice(1));

      if (isModifierPressed && event.key.toLowerCase() === key) {
        event.preventDefault();
        openModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modifierKey, key]);

  const buttonProps = {
    ...config.buttonProps,
    onClick: openModal,
  };

  return (
    <>
      <SearchButton {...buttonProps}>
        {config.buttonText}
      </SearchButton>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <InstantSearch
          searchClient={searchClient}
          indexName={config.indexName}
          future={{ preserveSharedStateOnUnmount: true }}
          insights
        >
          <SearchModal onClose={closeModal} config={config} />
        </InstantSearch>
      </Modal>
    </>
  );
}