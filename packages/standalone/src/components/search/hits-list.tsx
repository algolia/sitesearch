/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/a11y/useSemanticElements: . */
/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */

import { memo, useMemo, useState } from "react";
import { Highlight } from "react-instantsearch";
import type { HitsAttributesMapping, SearchHit } from "../types";
import { getByPath, toAttributePath } from "../types";
import { SearchIcon } from "./icons";

interface HitsListProps {
  hits: SearchHit[];
  query: string;
  selectedIndex: number;
  attributes?: HitsAttributesMapping;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
  sendEvent?: (eventType: "click", hit: SearchHit, eventName: string) => void;
  openResultsInNewTab?: boolean;
}

export const HitsList = memo(function HitsList({
  hits,
  selectedIndex,
  attributes,
  onHoverIndex,
  hoverEnabled,
  sendEvent,
  openResultsInNewTab = true,
}: HitsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const mapping = useMemo(
    () => ({
      primaryText: attributes?.primaryText as string,
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
      {hits.map((hit: SearchHit, idx: number) => {
        const isSel = selectedIndex === idx;
        const imageUrl = getByPath<string>(hit, mapping.image);
        const primaryVal = getByPath<string>(hit, mapping.primaryText);
        const url = getByPath<string>(hit, mapping.url);
        const hasImage = Boolean(imageUrl);
        const isImageFailed = failedImages[hit.objectID] || !hasImage;
        return (
          <a
            key={hit.objectID}
            href={url ?? "#"}
            target={openResultsInNewTab && url ? "_blank" : undefined}
            rel={openResultsInNewTab && url ? "noopener noreferrer" : undefined}
            className="ss-infinite-hits-item ss-infinite-hits-anchor"
            role="option"
            aria-selected={isSel}
            onClick={() => {
              sendEvent?.("click", hit, "Hit Clicked");
            }}
            onMouseEnter={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx);
            }}
            onMouseMove={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx);
            }}
          >
            {imageUrl ? (
              <div className="ss-infinite-hits-item-image-container">
                {!isImageFailed ? (
                  <img
                    src={imageUrl as string}
                    alt={primaryVal || ""}
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
            ) : null}
            <div className="ss-infinite-hits-item-content">
              <p className="ss-infinite-hits-item-title">
                <Highlight
                  attribute={toAttributePath(mapping.primaryText)}
                  hit={hit}
                />
              </p>
              {mapping.secondaryText ? (
                <p className="ss-infinite-hits-item-description">
                  <Highlight
                    attribute={toAttributePath(mapping.secondaryText)}
                    hit={hit}
                  />
                </p>
              ) : null}
              {mapping.tertiaryText ? (
                <p className="ss-infinite-hits-item-tertiary">
                  <Highlight
                    attribute={toAttributePath(mapping.tertiaryText)}
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
