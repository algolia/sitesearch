"use client";

import { DocSearchModal } from "@docsearch/react/modal";
import type { SharedProps } from "fumadocs-ui/components/dialog/search";
import { useEffect, useState } from "react";

// Replace these with your actual Algolia credentials
const appId = "GCH2YM3XGA";
const apiKey = "00f6062a9978e5a3ca3203b4c3797fcc";
const indexName = "Sitesearch [prod]";

export default function AlgoliaSearch(props: SharedProps) {
  // get theme from localstorage
  const theme =
    typeof window !== "undefined"
      ? localStorage?.getItem("theme") || "light"
      : "light";
  const isDark = theme === "dark";

  const [isAskAiActive, setIsAskAiActive] = useState(false);

  // Add ESC key listener with two-step behavior: clear input first, then close
  useEffect(() => {
    if (!props.open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Find the search input in the DocSearch modal
        const searchInput = document.querySelector(
          ".DocSearch-Input",
        ) as HTMLInputElement;

        if (searchInput?.value) {
          // If there's text in the input, let DocSearch handle clearing it
          // (Don't close the modal yet)
          return;
        }

        // If input is empty, close the modal
        event.preventDefault();
        event.stopPropagation();
        props.onOpenChange(false);
      }
    };

    // Use capture phase to intercept before DocSearch's handler
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [props.open, props.onOpenChange]);

  if (!props.open) {
    return null;
  }

  const handleClose = () => {
    props.onOpenChange(false);
  };

  const handleAskAiToggle = (toggle: boolean) => {
    setIsAskAiActive(toggle);
  };

  return (
    <DocSearchModal
      appId={appId}
      apiKey={apiKey}
      indices={[indexName]}
      askAi="iZKY9ihQQPcz"
      theme={isDark ? "dark" : "light"}
      placeholder="Search documentation..."
      initialScrollY={0}
      onAskAiToggle={handleAskAiToggle}
      isAskAiActive={isAskAiActive}
      onClose={handleClose}
    />
  );
}
