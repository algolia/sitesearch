import type { RefObject } from "react";
import { memo, useEffect, useState } from "react";
import { useInstantSearch, useSearchBox } from "react-instantsearch";
import { ArrowLeftIcon, CloseIcon, SearchIcon, SquarePenIcon } from "./icons";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  showChat: boolean;
  isGenerating?: boolean;
  isThreadDepthError?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  setShowChat: (show: boolean) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: (value: string) => boolean;
  onNewChat?: () => void;
}

const SearchLeftButton = memo(function SearchLeftButton({
  showChat,
  setShowChat,
}: {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}) {
  if (showChat) {
    return (
      <button
        type="button"
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
      // biome-ignore lint/a11y/useSemanticElements: hand crafted
      role="button"
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
  const [chatInput, setChatInput] = useState("");

  const isSearchStalled = status === "stalled";

  function setQuery(newQuery: string) {
    if (props.showChat) {
      setChatInput(newQuery);
    } else {
      refine(newQuery);
    }
  }

  // Clear the input when entering chat mode
  useEffect(() => {
    if (props.showChat) {
      setChatInput("");
    }
  }, [props.showChat]);

  // Placeholder logic:
  // - if thread depth error, show "Conversation limit reached"
  // - else if generating, show "Answering..."
  // - else if showChat, show AI prompt placeholder
  // - else show provided placeholder
  const placeholder = props.isThreadDepthError
    ? "Conversation limit reached"
    : props.isGenerating
    ? "Answering..."
    : props.showChat
    ? "Ask AI anything about Algolia"
    : props.placeholder;

  const currentValue = props.showChat ? chatInput : query || "";
  const isInputDisabled = props.isGenerating || props.isThreadDepthError;

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
      <SearchLeftButton
        showChat={props.showChat}
        setShowChat={props.setShowChat}
      />
      <input
        ref={props.inputRef}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={placeholder}
        spellCheck={false}
        maxLength={512}
        type="search"
        value={currentValue}
        disabled={isInputDisabled}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (isInputDisabled) {
            // while answering or thread depth error, block interactions
            e.preventDefault();
            return;
          }
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
            const valueAtEnter = props.showChat ? chatInput : query || "";
            if (props.onEnter?.(valueAtEnter)) {
              // If handled by parent (e.g., send in chat), clear the input
              if (props.showChat) {
                setChatInput("");
              } else {
                setQuery("");
              }
              return;
            }
            const trimmed = valueAtEnter.trim();
            if (trimmed) {
              // Open chat; parent will send the query
              props.setShowChat(true);
            }
          }
        }}
      />
      <div className="ss-search-action-buttons-container">
        <button
          type="reset"
          className="ss-search-clear-button"
          hidden={!currentValue || currentValue.length === 0 || isSearchStalled}
          onClick={() => {
            setQuery("");
            if (props.inputRef.current) {
              props.inputRef.current.focus();
            }
          }}
        >
          Clear
        </button>
        {props.showChat ? (
          <button
            type="button"
            className="ss-search-new-chat-button"
            disabled={props.isGenerating}
            onClick={() => {
              setChatInput("");
              props.onNewChat?.();
            }}
          >
            <SquarePenIcon size={18} />
          </button>
        ) : null}
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
