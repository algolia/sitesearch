/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/a11y/useSemanticElements: . */
/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */

import { memo, useState } from "react";
import { Highlight } from "react-instantsearch";
import { SearchIcon } from "./icons";

interface HitsListProps {
  hits: any[];
  query: string;
  selectedIndex: number;
}

export const HitsList = memo(function HitsList({
  hits,
  selectedIndex,
}: HitsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  return (
    <>
      {hits.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx;
        const hasImage = Boolean(hit.imageUrl);
        const isImageFailed = failedImages[hit.objectID] || !hasImage;
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
            <div className="ss-infinite-hits-item-image-container">
              {!isImageFailed ? (
                <img
                  src={hit.imageUrl}
                  alt={hit.title}
                  className="ss-infinite-hits-item-image"
                  onError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [hit.objectID]: true,
                    }))
                  }
                />
              ) : (
                <div
                  className="ss-infinite-hits-item-placeholder"
                  aria-hidden="true"
                >
                  <SearchIcon />
                </div>
              )}
            </div>
            <div className="ss-infinite-hits-item-content">
              <p className="ss-infinite-hits-item-title">
                <Highlight attribute="title" hit={hit} />
              </p>
              <p className="ss-infinite-hits-item-description">
                <Highlight attribute="description" hit={hit} />
              </p>
            </div>
          </a>
        );
      })}
    </>
  );
});
