import React, { useState, useRef, useCallback, useEffect } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  Configure,
  InstantSearch,
  useSearchBox,
  useInstantSearch,
  InfiniteHits,
  Hits,
  Highlight,
  useHits,
} from "react-instantsearch";

import { ChatWidget } from "./chat-widget";
import { SparklesIcon, SearchIcon, ArrowLeftIcon, AlgoliaLogo, CloseIcon } from "./icons";

import "./index.css";

const searchClient = algoliasearch(
  "betaHAXPMHIMMC",
  "8b00405cba281a7d800ccec393e9af24"
);

const future = { preserveSharedStateOnUnmount: true };

interface SearchBoxProps {
  query?: string;
  className?: string;
  placeholder?: string;
  showChat: boolean;
  refine: (query: string) => void;
  setShowChat: (show: boolean) => void;
  setInitialQuestion: (question: string) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => boolean;
}

function useSearchInput(initialQuery?: string, refine?: (query: string) => void) {
  const [inputValue, setInputValue] = useState(initialQuery || '');

  const setQuery = useCallback((newQuery: string) => {
    setInputValue(newQuery);
    refine?.(newQuery);
  }, [refine]);

  return { inputValue, setQuery };
}

function SearchBox(props: SearchBoxProps) {
  const { status } = useInstantSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const { inputValue, setQuery } = useSearchInput(props.query, props.refine);
  const isSearchStalled = status === 'stalled';

  return (
    <div>
      <form
        action=""
        role="search"
        className={props.className}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const trimmed = inputValue.trim();
          if (trimmed) {
            props.setShowChat(true);
            props.setInitialQuestion(trimmed);
          }
        }}
        onReset={(event) => {
          event.preventDefault();
          event.stopPropagation();

          setQuery('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <SearchLeftButton showChat={props.showChat} setShowChat={props.setShowChat} />
        <input
          ref={inputRef}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={props.placeholder}
          spellCheck={false}
          maxLength={512}
          type="search"
          value={inputValue}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              props.onArrowDown?.();
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              props.onArrowUp?.();
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (props.onEnter?.()) {
                return;
              }
              const trimmed = inputValue.trim();
              if (trimmed) {
                props.setShowChat(true);
                props.setInitialQuestion(trimmed);
              }
            }
          }}
          autoFocus
        />
        <div className="qs-search-action-buttons-container">
          <button
            type="reset"
            className="qs-search-clear-button"
            hidden={!inputValue || inputValue.length === 0 || isSearchStalled}
          >
            Clear
          </button>
          <button hidden={true} className="qs-search-clear-button">
            X
          </button>
          <button className="qs-search-close-button">
            <CloseIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

interface SearchLeftButtonProps {
  query: string;
  showChat: boolean;
  setShowChat: (showChat: boolean) => void;
}

function SearchLeftButton({ showChat, setShowChat }: Omit<SearchLeftButtonProps, 'query'>) {
  if (showChat) {
    return (
      <>
        <button
          onClick={() => setShowChat(false)}
          className="qs-search-left-button"
          aria-label="Back to search"
          title="Back to search"
        >
          <ArrowLeftIcon />
        </button>
      </>
    );
  }

  return (
    <>
      <div
        tabIndex={-1}
        className="qs-search-left-button"
        aria-label="Search"
        title="Search"
      >
        <SearchIcon />
      </div>
    </>
  );
}

interface HitsActionsProps {
  query: string;
  isSelected: boolean;
  onAskAI: () => void;
}

function HitsActions({ query, isSelected, onAskAI }: HitsActionsProps) {
  return (
    <div className="qs-infinite-hits-list">
      <article
        onClick={onAskAI}
        className="qs-infinite-hits-item qs-ask-ai-btn"
        aria-label="Ask AI"
        title="Ask AI"
        role="option"
        aria-selected={isSelected}
      >
        <SparklesIcon />
        <p className="qs-infinite-hits-item-title">Ask AI: <span className="ais-Highlight-highlighted">"{query}"</span></p>
      </article>
    </div>
  );
}

interface NoResultsProps {
  query: string;
  onAskAI: () => void;
  onClear: () => void;
}

function NoResults({ query, onAskAI, onClear }: NoResultsProps) {
  return (
    <div className="qs-no-results">
      <div className="qs-no-results-icon"><SearchIcon /></div>
      <p className="qs-no-results-title">No results for "{query}"</p>
      <p className="qs-no-results-subtitle">Try a different query or ask AI to help.</p>
      <div className="qs-no-results-actions">
        <button className="qs-no-results-btn" onClick={onAskAI}>
          <SparklesIcon />
          Ask AI
        </button>
        <button className="qs-no-results-btn" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

interface ResultsPanelProps {
  showChat: boolean;
  setShowChat: (showChat: boolean) => void;
  query: string;
  initialQuestion?: string;
  selectedIndex: number;
  refine: (query: string) => void;
}

function ResultsPanel({ showChat, setShowChat, query, initialQuestion, selectedIndex, refine }: ResultsPanelProps) {
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
    return <ChatWidget initialQuestion={initialQuestion} refine={refine} query={query} />;
  }

  return (
    <div ref={containerRef} className="qs-hits-container" role="listbox">
      <HitsActions query={query} isSelected={selectedIndex === 0} onAskAI={() => { setShowChat(true); }} />
      {items.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx + 1;
        return (
          <a
            key={hit.objectID}
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="qs-infinite-hits-item qs-infinite-hits-anchor"
            role="option"
            aria-selected={isSel}
          >
            <p className="qs-infinite-hits-item-title"><Highlight attribute="title" hit={hit} /></p>
            <p className="qs-infinite-hits-item-description"><Highlight attribute="text" hit={hit} /></p>
          </a>
        );
      })}
    </div>
  );
}



export default function App() {
  return (
    <div style={{
      backgroundColor: '#faeeea',
    }} className="qs-exp-pop">
      <div className="container">
        <InstantSearch
          searchClient={searchClient}
          indexName="crawler_markdown-index"
          future={future}
          insights
        >
          <QuickSearch />
        </InstantSearch>
        <Footer />
      </div>
    </div>
  );
}


function useKeyboardNavigation(showChat: boolean, totalItems: number, hits: any[], query: string) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const moveDown = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev + 1) % totalItems);
  }, [showChat, totalItems]);

  const moveUp = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [showChat, totalItems]);

  const activateSelection = useCallback((): boolean => {
    if (showChat) return false;
    if (selectedIndex === 0) {
      return true; // Let parent handle AI activation
    }
    if (selectedIndex > 0) {
      const hit = hits[selectedIndex - 1];
      if (hit && hit.url) {
        window.open(hit.url, '_blank', 'noopener,noreferrer');
        return true;
      }
    }
    return false;
  }, [showChat, selectedIndex, hits]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, showChat]);

  return { selectedIndex, moveDown, moveUp, activateSelection };
}

function useChatState() {
  const [showChat, setShowChat] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(undefined);

  const handleShowChat = useCallback((show: boolean, question?: string) => {
    setShowChat(show);
    if (show && question) {
      setInitialQuestion(question);
    }
  }, []);

  return { showChat, initialQuestion, setShowChat, setInitialQuestion, handleShowChat };
}

export function QuickSearch() {
  const { query, refine } = useSearchBox();
  const results = useInstantSearch();
  const { items } = useHits();
  const { showChat, initialQuestion, setShowChat, setInitialQuestion, handleShowChat } = useChatState();

  const noResults = results.results?.nbHits === 0;
  const totalItems = items.length + 1; // +1 for Ask AI
  const { selectedIndex, moveDown, moveUp, activateSelection } = useKeyboardNavigation(showChat, totalItems, items, query);

  const handleActivateSelection = useCallback((): boolean => {
    if (activateSelection()) {
      if (selectedIndex === 0) {
        handleShowChat(true, query);
      }
      return true;
    }
    return false;
  }, [activateSelection, selectedIndex, query, handleShowChat]);

  const showResultsPanel = (!noResults && query) || showChat;

  return (
    <>
      <Configure hitsPerPage={8} />
      <div className="search-panel">
        <SearchBox
          query={query}
          placeholder="Search for products"
          className="qs-searchbox-form"
          refine={refine}
          showChat={showChat}
          setShowChat={setShowChat}
          setInitialQuestion={setInitialQuestion}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          onEnter={handleActivateSelection}
        />
        {showResultsPanel && (
          <ResultsPanel
            showChat={showChat}
            setShowChat={(v) => {
              setShowChat(v);
              if (v) setInitialQuestion(query);
            }}
            query={query}
            initialQuestion={initialQuestion}
            selectedIndex={selectedIndex}
            refine={refine}
          />
        )}
        {noResults && query && (
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
    </>
  );
}

function Footer() {
  return (
    <div className="qs-footer">
      <div className="qs-footer-left">
        <div className="qs-footer-kbd-group">
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z" /></svg></kbd>
          <span>Open</span>
        </div>

        <div className="qs-footer-kbd-group">
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m11 7.825l-4.9 4.9q-.3.3-.7.288t-.7-.313q-.275-.3-.288-.7t.288-.7l6.6-6.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l6.6 6.6q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3L13 7.825V19q0 .425-.288.713T12 20t-.712-.288T11 19z" /></svg></kbd>
          <kbd className="qs-kbd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 16.175V5q0-.425.288-.712T12 4t.713.288T13 5v11.175l4.9-4.9q.3-.3.7-.288t.7.313q.275.3.287.7t-.287.7l-6.6 6.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213l-6.6-6.6q-.275-.275-.275-.687T4.7 11.3q.3-.3.713-.3t.712.3z" /></svg></kbd>
          <span>Navigate</span>
        </div>

        <div className="qs-footer-kbd-group">
          <kbd className="qs-kbd">ESC</kbd>
          <span>Close</span>
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
}