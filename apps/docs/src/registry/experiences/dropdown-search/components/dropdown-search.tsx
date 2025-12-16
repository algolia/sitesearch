/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */
/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/suspicious/noExplicitAny: too ambiguous */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: hand crafted interactions */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: hand crafted interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as Popover from "@radix-ui/react-popover";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { SearchIcon } from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Configure,
  Highlight,
  InstantSearch,
  useHits,
  useSearchBox,
} from "react-instantsearch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/registry/experiences/dropdown-search/hooks/use-keyboard-navigation";

export interface DropdownSearchConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** Placeholder text for search input (optional, defaults to "Search...") */
  placeholder?: string;
  /** Number of hits per page (optional, defaults to 5) */
  hitsPerPage?: number;
  /** Map which hit attributes to render (supports dotted paths) */
  attributes?: HitsAttributesMapping;
  /** Custom className for the root container */
  className?: string;
  /** Max height for dropdown (optional, defaults to "300px") */
  maxHeight?: string;
  /** Enable Algolia Insights (optional, defaults to true) */
  insights?: boolean;
  /** Additional Algolia search parameters (optional) - e.g., analytics, filters, distinct, etc. */
  searchParameters?: Record<string, unknown>;
}

// =========================================================================
// Attribute Mapping
// =========================================================================

type HitsAttributesMapping = {
  primaryText: string;
  secondaryText?: string;
  tertiaryText?: string;
  url?: string;
  image?: string;
};

function toAttributePath(attribute?: string): string | string[] | undefined {
  if (!attribute) return undefined;
  return attribute.includes(".") ? attribute.split(".") : attribute;
}

function getByPath<T = unknown>(obj: unknown, path?: string): T | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as T | undefined;
}

// ============================================================================
// Internal Components
// ============================================================================

interface HitsListProps {
  hits: any[];
  query: string;
  selectedIndex: number;
  attributes?: HitsAttributesMapping;
  onItemClick?: () => void;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
}

const HitsList = memo(function HitsList({
  hits,
  selectedIndex,
  attributes,
  onItemClick,
  onHoverIndex,
  hoverEnabled,
  sendEvent,
}: HitsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const mapping = useMemo(
    () => ({
      primaryText: attributes?.primaryText,
      secondaryText: attributes?.secondaryText,
      tertiaryText: attributes?.tertiaryText,
      url: attributes?.url,
      image: attributes?.image,
    }),
    [attributes],
  );

  if (!attributes || !mapping.primaryText) {
    throw new Error("At least a primaryText is required to display results");
  }

  return (
    <>
      {hits.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx;
        const imageUrl = getByPath<string>(hit, mapping.image);
        const url = getByPath<string>(hit, mapping.url);
        const hasImage = Boolean(imageUrl);
        const isImageFailed = failedImages[hit.objectID] || !hasImage;
        const primaryVal = getByPath<string>(hit, mapping.primaryText);
        return (
          <a
            key={hit.objectID}
            href={url ?? "#"}
            target={url ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={() => {
              sendEvent?.("click", hit, "Hit Clicked");
              onItemClick?.();
            }}
            className="flex flex-row items-center gap-3 cursor-pointer text-decoration-none text-foreground bg-background rounded-sm p-3 aria-selected:bg-accent transition-colors"
            role="option"
            aria-selected={isSel}
            onMouseEnter={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx);
            }}
            onMouseMove={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx);
            }}
          >
            {hasImage ? (
              <div className="w-12 h-12 self-start flex-[0_0_48px] items-center justify-center overflow-hidden rounded-sm bg-muted">
                {!isImageFailed ? (
                  <img
                    src={imageUrl as string}
                    alt={primaryVal || ""}
                    className="w-full h-full object-contain rounded-sm"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [hit.objectID]: true,
                      }))
                    }
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-full h-full text-muted-foreground"
                    aria-hidden="true"
                  >
                    <SearchIcon size={16} />
                  </div>
                )}
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm [&_mark]:bg-transparent [&_mark]:text-primary [&_mark]:font-semibold truncate">
                <Highlight
                  attribute={toAttributePath(mapping.primaryText) as any}
                  hit={hit}
                />
              </p>
              {mapping.secondaryText ? (
                <p className="text-xs mt-1 text-muted-foreground [&_mark]:bg-transparent [&_mark]:text-foreground [&_mark]:font-medium line-clamp-1">
                  <Highlight
                    attribute={toAttributePath(mapping.secondaryText) as any}
                    hit={hit}
                  />
                </p>
              ) : null}
              {mapping.tertiaryText ? (
                <p className="text-xs text-muted-foreground [&_mark]:bg-transparent [&_mark]:text-foreground [&_mark]:font-medium mt-1 line-clamp-1">
                  <Highlight
                    attribute={toAttributePath(mapping.tertiaryText) as any}
                    hit={hit}
                  />
                </p>
              ) : null}
            </div>
          </a>
        );
      })}
    </>
  );
});

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
}

const SearchInput = memo(function SearchInput(props: SearchInputProps) {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query || "");

  function setQuery(newQuery: string) {
    setInputValue(newQuery);
    refine(newQuery);
  }

  return (
    <div className={cn("relative flex items-center", props.className)}>
      <SearchIcon
        className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
        strokeWidth={1.5}
      />
      <Input
        ref={props.inputRef}
        className="pl-9 pr-3"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={props.placeholder || "Search..."}
        spellCheck={false}
        inputMode="search"
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
      />
    </div>
  );
});

interface DropdownContentProps {
  query: string;
  selectedIndex: number;
  config: DropdownSearchConfig;
  onItemClick?: () => void;
  onHoverIndex?: (index: number) => void;
  scrollOnSelectionChange?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
}

const DropdownContent = memo(function DropdownContent({
  query,
  selectedIndex,
  config,
  onItemClick,
  onHoverIndex,
  scrollOnSelectionChange = true,
  sendEvent,
}: DropdownContentProps) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);
  const noResults = items.length === 0;
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

  // Scroll selected item into view
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

  const maxHeight = config.maxHeight || "300px";

  if (noResults) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No results for &quot;{query}&quot;
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ maxHeight }}
      role="listbox"
    >
      <HitsList
        hits={items as unknown[]}
        query={query}
        selectedIndex={selectedIndex}
        attributes={config.attributes}
        onItemClick={onItemClick}
        onHoverIndex={onHoverIndex}
        hoverEnabled={hoverEnabled}
        sendEvent={sendEvent}
      />
    </div>
  );
});

interface DropdownSearchInnerProps {
  config: DropdownSearchConfig;
}

function DropdownSearchInner({ config }: DropdownSearchInnerProps) {
  const { query, refine } = useSearchBox();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { items, sendEvent } = useHits();
  const [open, setOpen] = useState(false);

  const {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  } = useKeyboardNavigation(items, query);

  // Control popover open state based on query
  useEffect(() => {
    setOpen(!!query && query.length > 0);
  }, [query]);

  const handleActivateSelection = useCallback((): boolean => {
    // Send click event for keyboard navigation before activating
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const hit = items[selectedIndex];
      if (hit) {
        sendEvent?.("click", hit, "Hit Clicked");
      }
    }

    if (activateSelection()) {
      setOpen(false);
      refine("");
      return true;
    }
    return false;
  }, [activateSelection, refine, selectedIndex, items, sendEvent]);

  const handleItemClick = useCallback(() => {
    setOpen(false);
    refine("");
  }, [refine]);

  return (
    <>
      <Configure
        hitsPerPage={config.hitsPerPage || 5}
        {...(config.searchParameters || {})}
      />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div className="w-full">
            <SearchInput
              placeholder={config.placeholder}
              className="w-full"
              inputRef={inputRef}
              onArrowDown={moveDown}
              onArrowUp={moveUp}
              onEnter={handleActivateSelection}
            />
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 w-[var(--radix-popover-trigger-width)] mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            side="bottom"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => {
              // Prevent auto-focusing the popover content, keep focus on input
              e.preventDefault();
            }}
          >
            {query ? (
              <DropdownContent
                query={query}
                selectedIndex={selectedIndex}
                config={config}
                onItemClick={handleItemClick}
                onHoverIndex={hoverIndex}
                scrollOnSelectionChange={selectionOrigin !== "pointer"}
                sendEvent={sendEvent}
              />
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Start typing to search
              </div>
            )}
            <div className="px-2 py-1 border-t border-text-muted-foreground text-right text-xs text-muted-foreground">
              Powered by Algolia
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

export default function DropdownSearchExperience(config: DropdownSearchConfig) {
  const searchClient = algoliasearch(config.applicationId, config.apiKey);
  searchClient.addAlgoliaAgent("algolia-sitesearch");

  return (
    <div className={cn("relative w-full", config.className)}>
      <InstantSearch
        searchClient={searchClient}
        indexName={config.indexName}
        future={{ preserveSharedStateOnUnmount: true }}
        insights={config.insights ?? true}
      >
        <DropdownSearchInner config={config} />
      </InstantSearch>
    </div>
  );
}
