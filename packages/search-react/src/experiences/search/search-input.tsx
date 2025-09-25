import type React from "react";
import { memo, useState } from "react";
import { useInstantSearch, useSearchBox } from "react-instantsearch";
import { CloseIcon, SearchIcon } from "./icons";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
}

export const SearchInput = memo(function SearchInput(props: SearchInputProps) {
  const { status } = useInstantSearch();
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query || "");

  const isSearchStalled = status === "stalled";

  function setQuery(newQuery: string) {
    setInputValue(newQuery);
    refine(newQuery);
  }

  const placeholder = props.placeholder;

  return (
    <search
      className={props.className}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onReset={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setQuery("");
        if (props.inputRef.current) {
          props.inputRef.current.focus();
        }
      }}
    >
      <div
        // biome-ignore lint/a11y/useSemanticElements: hand crafted
        role="button"
        tabIndex={-1}
        className="ss-search-left-button"
        aria-label="Search"
        title="Search"
      >
        <SearchIcon />
      </div>
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
          if (e.key === "ArrowDown") {
            e.preventDefault();
            props.onArrowDown?.();
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            props.onArrowUp?.();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            props.onEnter?.();
          }
        }}
        // biome-ignore lint/a11y/noAutofocus: expected
        autoFocus
      />
      <div className="ss-search-action-buttons-container">
        <button
          type="reset"
          className="ss-search-clear-button"
          hidden={!inputValue || inputValue.length === 0 || isSearchStalled}
          onClick={() => {
            setQuery("");
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="ss-search-close-button"
          onClick={props.onClose}
        >
          <CloseIcon />
        </button>
      </div>
    </search>
  );
});
