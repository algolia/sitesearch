/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/a11y/useSemanticElements: . */
/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */

import { memo, useMemo } from "react";
import { Highlight } from "react-instantsearch";
import type { HitsAttributesMapping, SearchHit } from "../types";
import { toAttributePath } from "../types";
import { SparklesIcon } from "./icons";

interface HitsActionsProps {
  query: string;
  isSelected: boolean;
  onAskAI: () => void;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
}

const HitsActions = memo(function HitsActions({
  query,
  isSelected,
  onAskAI,
  onHoverIndex,
  hoverEnabled,
}: HitsActionsProps) {
  return (
    <div className="ss-infinite-hits-list">
      <article
        onClick={onAskAI}
        className="ss-infinite-hits-item ss-ask-ai-btn"
        aria-label="Ask AI"
        title="Ask AI"
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: hand crafted
        role="option"
        aria-selected={isSelected}
        onMouseEnter={() => {
          if (!hoverEnabled) return;
          onHoverIndex?.(0);
        }}
        onMouseMove={() => {
          if (!hoverEnabled) return;
          onHoverIndex?.(0);
        }}
      >
        <SparklesIcon />
        <p className="ss-infinite-hits-item-title">
          Ask AI: <span className="ais-Highlight-highlighted">"{query}"</span>
        </p>
      </article>
    </div>
  );
});

interface HitsListProps {
  hits: SearchHit[];
  query: string;
  selectedIndex: number;
  onAskAI: () => void;
  attributes?: HitsAttributesMapping;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
  sendEvent?: (eventType: "click", hit: SearchHit, eventName: string) => void;
  openResultsInNewTab?: boolean;
}

export const HitsList = memo(function HitsList({
  hits,
  query,
  selectedIndex,
  onAskAI,
  attributes,
  onHoverIndex,
  hoverEnabled,
  sendEvent,
  openResultsInNewTab = true,
}: HitsListProps) {
  const mapping: Required<Pick<HitsAttributesMapping, "primaryText">> &
    Partial<HitsAttributesMapping> = useMemo(
    () => ({
      primaryText: attributes?.primaryText || "title",
      secondaryText: attributes?.secondaryText || "description",
      tertiaryText: attributes?.tertiaryText,
    }),
    [attributes],
  );
  return (
    <>
      <HitsActions
        query={query}
        isSelected={selectedIndex === 0}
        onAskAI={onAskAI}
        onHoverIndex={onHoverIndex}
        hoverEnabled={hoverEnabled}
      />
      {hits.map((hit: SearchHit, idx: number) => {
        const isSel = selectedIndex === idx + 1;
        return (
          <a
            key={hit.objectID}
            href={hit.url}
            target={openResultsInNewTab ? "_blank" : undefined}
            rel={openResultsInNewTab ? "noopener noreferrer" : undefined}
            className="ss-infinite-hits-item ss-infinite-hits-anchor"
            role="option"
            aria-selected={isSel}
            onClick={() => {
              sendEvent?.("click", hit, "Hit Clicked");
            }}
            onMouseEnter={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx + 1);
            }}
            onMouseMove={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx + 1);
            }}
          >
            <p className="ss-infinite-hits-item-title">
              <Highlight
                attribute={toAttributePath(mapping.primaryText)}
                hit={hit}
              />
            </p>
            <p className="ss-infinite-hits-item-description">
              {mapping.secondaryText ? (
                <Highlight
                  attribute={toAttributePath(mapping.secondaryText)}
                  hit={hit}
                />
              ) : null}
            </p>
            {mapping.tertiaryText ? (
              <p className="ss-infinite-hits-item-description">
                <Highlight
                  attribute={toAttributePath(mapping.tertiaryText)}
                  hit={hit}
                />
              </p>
            ) : null}
          </a>
        );
      })}
    </>
  );
});
