import React, { memo, useState } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { SearchIcon, ArrowLeftIcon, CloseIcon } from './icons';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  showChat: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  setShowChat: (show: boolean) => void;
  setInitialQuestion: (question: string) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => boolean;
}

const SearchLeftButton = memo(function SearchLeftButton({
  showChat,
  setShowChat
}: {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}) {
  if (showChat) {
    return (
      <button
        onClick={() => setShowChat(false)}
        className="ss-search-left-button"
        aria-label="Back to search"
        title="Back to search"
      >
        <ArrowLeftIcon />
      </button>
    );
  }

  return (
    <div
      tabIndex={-1}
      className="ss-search-left-button"
      aria-label="Search"
      title="Search"
    >
      <SearchIcon />
    </div>
  );
});

export const SearchInput = memo(function SearchInput(props: SearchInputProps) {
  const { status } = useInstantSearch();
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query || '');

  const isSearchStalled = status === 'stalled';

  function setQuery(newQuery: string) {
    setInputValue(newQuery);
    if (!props.showChat) {
      refine(newQuery);
    }
  }

  // if showChat is true, change placeholder to "Ask AI"
  const placeholder = props.showChat ? "Ask AI anything about Algolia" : props.placeholder;

  return (
    <form
      role="search"
      className={props.className}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onReset={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setQuery('');
        if (props.inputRef.current) {
          props.inputRef.current.focus();
        }
      }}
    >
      <SearchLeftButton showChat={props.showChat} setShowChat={props.setShowChat} />
      <input
        ref={props.inputRef}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={placeholder}
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
      <div className="ss-search-action-buttons-container">
        <button
          type="reset"
          className="ss-search-clear-button"
          hidden={!inputValue || inputValue.length === 0 || isSearchStalled}
        >
          Clear
        </button>
        <button className="ss-search-close-button" onClick={props.onClose}>
          <CloseIcon />
        </button>
      </div>
    </form>
  );
});