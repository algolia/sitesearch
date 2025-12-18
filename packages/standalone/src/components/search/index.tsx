import { liteClient as algoliasearch } from "algoliasearch/lite";
import type { ComponentProps, FC, RefObject } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch";
import { HitsList } from "./hits-list";
import { AlgoliaLogo, SearchIcon } from "./icons";
import { SearchInput } from "./search-input";
import { useKeyboardNavigation } from "./useKeyboardNavigation";

import "./styles.css";
import type { HitsAttributesMapping } from "../types";
import { SearchButton } from "./search-button";
import { Modal } from "./search-modal";
import useEffectiveDarkMode from "./useEffectiveDarkMode";

export interface SearchConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
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
  /** Open hit URLs in a new tab (optional, defaults to true) */
  openResultsInNewTab?: boolean;
}

interface SearchBoxProps {
  query?: string;
  className?: string;
  placeholder?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  refine: (query: string) => void;
  onClose?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => void;
}

const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
  return (
    <SearchInput
      className={props.className}
      placeholder={props.placeholder}
      inputRef={props.inputRef}
      onClose={props.onClose || (() => {})}
      onEnter={props.onEnter}
      onArrowDown={props.onArrowDown}
      onArrowUp={props.onArrowUp}
    />
  );
});

interface NoResultsProps {
  query: string;
  onClear: () => void;
}

const NoResults: FC<NoResultsProps> = memo(function NoResults({
  query,
  onClear,
}) {
  return (
    <div className="ss-no-results">
      <div className="ss-no-results-icon">
        <SearchIcon />
      </div>
      <p className="ss-no-results-title">No results for "{query}"</p>
      <p className="ss-no-results-subtitle">Try a different query</p>
      <div className="ss-no-results-actions">
        <button type="button" className="ss-no-results-btn" onClick={onClear}>
          Clear query
        </button>
      </div>
    </div>
  );
});

interface ResultsPanelProps {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  selectedIndex: number;
  refine: (query: string) => void;
  config: SearchConfig;
  onHoverIndex?: (index: number) => void;
  scrollOnSelectionChange?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
  openResultsInNewTab?: boolean;
}

const ResultsPanel: FC<ResultsPanelProps> = memo(function ResultsPanel({
  query,
  selectedIndex,
  config,
  onHoverIndex,
  scrollOnSelectionChange = true,
  sendEvent,
  openResultsInNewTab = true,
}) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  // Enable hover selection only after the user moves the pointer inside the list
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setHoverEnabled(false);
    const enable = () => setHoverEnabled(true);
    container.addEventListener("pointermove", enable, { once: true } as any);
    return () => {
      container.removeEventListener("pointermove", enable as any);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    if (!scrollOnSelectionChange) return;
    const container = containerRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      '[aria-selected="true"]',
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
  }, [selectedIndex, items.length, scrollOnSelectionChange]);

  return (
    <>
      {/** biome-ignore lint/a11y/useSemanticElements: . */}
      <div ref={containerRef} className="ss-hits-container" role="listbox">
        <HitsList
          hits={items as any[]}
          query={query}
          selectedIndex={selectedIndex}
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
  config: SearchConfig;
}

export function SearchModal({ onClose, config }: SearchModalProps) {
  const { query, refine } = useSearchBox();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useInstantSearch();
  const { items, sendEvent } = useHits();

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

  const noResults = results.results?.nbHits === 0;
  const {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  } = useKeyboardNavigation(items, query, config.openResultsInNewTab ?? true);

  const handleActivateSelection = useCallback((): boolean => {
    // Send click event for keyboard navigation before activating
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const hit = items[selectedIndex];
      if (hit) {
        sendEvent?.("click", hit, "Hit Clicked");
      }
    }

    if (activateSelection()) {
      return true;
    }
    return false;
  }, [activateSelection, selectedIndex, items, sendEvent]);

  const showResultsPanel = !noResults && !!query;

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
          onClose={onClose}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          inputRef={inputRef}
          onEnter={handleActivateSelection}
        />
        {showResultsPanel && (
          <ResultsPanel
            inputRef={inputRef}
            query={query}
            selectedIndex={selectedIndex}
            refine={refine}
            config={config}
            onHoverIndex={hoverIndex}
            scrollOnSelectionChange={selectionOrigin !== "pointer"}
            sendEvent={sendEvent}
            openResultsInNewTab={config.openResultsInNewTab}
          />
        )}
        {noResults && query && (
          <NoResults
            query={query}
            onClear={() => {
              refine("");
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
}

const Footer = memo(function Footer() {
  const basePoweredByUrl =
    "https://www.algolia.com/developers?utm_medium=referral&utm_content=powered_by&utm_campaign=sitesearch";
  const poweredByHref =
    typeof window !== "undefined"
      ? `${basePoweredByUrl}&utm_source=${encodeURIComponent(window.location.hostname)}`
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
          <span>Open</span>
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

export default function SearchExperience(config: SearchConfig) {
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
