import React, { useState, useRef } from "react";
import algoliasearch from "algoliasearch/lite";
import {
  Configure,
  InstantSearch,
  useSearchBox,
  useInstantSearch,
  InfiniteHits,
} from "react-instantsearch";

import { ChatWidget } from "./components/ChatWidget";
import { SparklesIcon, SearchIcon, ArrowLeftIcon } from "./components/Icons";

import "./index.css";

const searchClient = algoliasearch(
  "latency",
  "6be0576ff61c053d5f9a3225e2a90f76"
);

const future = { preserveSharedStateOnUnmount: true };

function SearchBox(props) {
  const { status } = useInstantSearch();
  const [inputValue, setInputValue] = useState(props.query);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchStalled = status === 'stalled';

  function setQuery(newQuery) {
    setInputValue(newQuery);
    props.refine(newQuery);
  }

  return (
    <div className="qs-searchbox-form-container">
      <form
        action=""
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
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <SearchLeftButton query={inputValue} showChat={props.showChat} setShowChat={props.setShowChat} />
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
          autoFocus
        />
        <button
          type="reset"
          hidden={!inputValue || inputValue.length === 0 || isSearchStalled}
        >
          Clear
        </button>
      </form>

      <button
        className="qs-ask-ai-btn"
        onClick={() => props.setShowChat(true)}
      >
        <SparklesIcon />
      </button>
    </div>
  );
}

function SearchLeftButton({ query, showChat, setShowChat }: { query: string, showChat: boolean, setShowChat: (showChat: boolean) => void }) {
  if (showChat) {
    return (
      <>
        <button
          onClick={() => setShowChat(false)}
          className="qs-search-left-button"
        >
          <ArrowLeftIcon />
        </button>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowChat(!showChat)}
        className="qs-search-left-button"
      >
        <SearchIcon />
      </button>
    </>
  );
}


// helper component to choose between showing hits/pagination or chat widget
function HitsOrChat({ showChat, setShowChat, query }: { showChat: boolean, setShowChat: (showChat: boolean) => void, query: string }) {
  if (showChat) {
    return <ChatWidget />;
  }

  return (
    <>
      <InfiniteHits classNames={{
        root: "qs-infinite-hits-root",
        emptyRoot: "qs-infinite-hits-empty",
        list: "qs-infinite-hits-list",
        item: "qs-infinite-hits-item",
      }} hitComponent={HitComponent} showPrevious={false} />
    </>
  );
}

type HitProps = {
  hit: any;
};

function HitComponent({ hit }: HitProps) {
  return (
    <a href={hit.url} target="_blank" className="qs-infinite-hits-anchor">
      <img src={hit.image} alt={hit.name} />
      <div>
        <p className="qs-infinite-hits-item-name">{hit.name}</p>
        <p className="qs-infinite-hits-item-description">{hit.description}</p>
      </div>
    </a>
  );
}


export default function App() {
  return (
    <div className="qs-exp-search">
      <div className="container">
        <InstantSearch
          searchClient={searchClient}
          indexName="instant_search"
          future={future}
          insights
        >
          <QuickSearch />
        </InstantSearch>
      </div>
    </div>
  );
}


export function QuickSearch() {
  const [showChat, setShowChat] = React.useState(false);
  const { query, refine } = useSearchBox();

  return (
    <>
      <Configure hitsPerPage={8} />
      <div className="search-panel">
        <div className="search-panel__results">
          <SearchBox placeholder="Search for products" className="qs-searchbox-form" refine={refine} showChat={showChat} setShowChat={setShowChat} />
          <HitsOrChat showChat={showChat} setShowChat={setShowChat} query={query} />
        </div>
      </div>
    </>
  );
}