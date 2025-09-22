import { memo } from 'react';
import { Highlight } from 'react-instantsearch';
import { SparklesIcon } from './icons';

interface HitsActionsProps {
  query: string;
  isSelected: boolean;
  onAskAI: () => void;
}

const HitsActions = memo(function HitsActions({ query, isSelected, onAskAI }: HitsActionsProps) {
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
        <p className="qs-infinite-hits-item-title">
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
  onAskAI
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
            className="qs-infinite-hits-item qs-infinite-hits-anchor"
            role="option"
            aria-selected={isSel}
          >
            <p className="qs-infinite-hits-item-title">
              <Highlight attribute="title" hit={hit} />
            </p>
            <p className="qs-infinite-hits-item-description">
              <Highlight attribute="description" hit={hit} />
            </p>
          </a>
        );
      })}
    </>
  );
});