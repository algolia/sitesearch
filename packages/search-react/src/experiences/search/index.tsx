import algoliasearch from "algoliasearch/lite";
import type React from "react";
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
import { SearchButton } from "./search-button";
import { Modal } from "./search-modal";

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
  inputRef: React.RefObject<HTMLInputElement | null>;
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

const NoResults = memo(function NoResults({ query, onClear }: NoResultsProps) {
  return (
    <div className="ss-no-results">
      <div className="ss-no-results-icon">
        <SearchIcon />
      </div>
      <p className="ss-no-results-title">No results for "{query}"</p>
      <p className="ss-no-results-subtitle">
        Try a different query or ask AI to help.
      </p>
      <div className="ss-no-results-actions">
        <button type="button" className="ss-no-results-btn" onClick={onClear}>
          Clear query
        </button>
      </div>
    </div>
  );
});

interface ResultsPanelProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  selectedIndex: number;
  refine: (query: string) => void;
  config: SearchConfig;
}

const ResultsPanel = memo(function ResultsPanel({
  query,
  selectedIndex,
}: ResultsPanelProps) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
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
  }, [selectedIndex, items.length]);

  return (
    <>
      {/** biome-ignore lint/a11y/useSemanticElements: . */}
      <div ref={containerRef} className="ss-hits-container" role="listbox">
        <HitsList
          hits={items as unknown[]}
          query={query}
          selectedIndex={selectedIndex}
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
  const { items } = useHits();

  const noResults = results.results?.nbHits === 0;
  const { selectedIndex, moveDown, moveUp, activateSelection } =
    useKeyboardNavigation(items, query);

  const handleActivateSelection = useCallback((): boolean => {
    if (activateSelection()) {
      return true;
    }
    return false;
  }, [activateSelection]);

  const showResultsPanel = !noResults && !!query;

  return (
    <>
      <Configure hitsPerPage={config.hitsPerPage || 8} />
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
          />
        )}
        {noResults && query && (
          <NoResults query={query} onClear={() => refine("")} />
        )}
      </div>
      <Footer />
    </>
  );
}

const Footer = memo(function Footer() {
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
          href="https://www.algolia.com"
          target="_blank"
          rel="noopener quicksearch"
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Parse keyboard shortcut (defaults to cmd+k)
  const shortcut = config.keyboardShortcut || "cmd+k";
  const [modifierKey, key] = shortcut.toLowerCase().split("+");

  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't to rerun
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed =
        modifierKey === "cmd"
          ? event.metaKey || event.ctrlKey
          : event.getModifierState(
              modifierKey.charAt(0).toUpperCase() + modifierKey.slice(1),
            );

      if (isModifierPressed && event.key.toLowerCase() === key) {
        event.preventDefault();
        openModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modifierKey, key]);

  const buttonProps = {
    ...config.buttonProps,
    onClick: openModal,
  };

  return (
    <>
      <SearchButton {...buttonProps}>{config.buttonText}</SearchButton>
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
