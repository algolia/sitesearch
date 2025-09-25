/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/a11y/useSemanticElements: . */
/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */

import { memo } from "react";
import { Highlight } from "react-instantsearch";
import { SparklesIcon } from "./icons";

interface HitsActionsProps {
  query: string;
  isSelected: boolean;
  onAskAI: () => void;
}

const HitsActions = memo(function HitsActions({
  query,
  isSelected,
  onAskAI,
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
  hits: any[];
  query: string;
  selectedIndex: number;
  onAskAI: () => void;
}

export const HitsList = memo(function HitsList({
  hits,
  query,
  selectedIndex,
  onAskAI,
}: HitsListProps) {
  return (
    <>
      <HitsActions
        query={query}
        isSelected={selectedIndex === 0}
        onAskAI={onAskAI}
      />
      {hits.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx + 1;
        return (
          <a
            key={hit.objectID}
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ss-infinite-hits-item ss-infinite-hits-anchor"
            role="option"
            aria-selected={isSel}
          >
            <p className="ss-infinite-hits-item-title">
              <Highlight attribute="title" hit={hit} />
            </p>
            <p className="ss-infinite-hits-item-description">
              <Highlight attribute="description" hit={hit} />
            </p>
          </a>
        );
      })}
    </>
  );
});
