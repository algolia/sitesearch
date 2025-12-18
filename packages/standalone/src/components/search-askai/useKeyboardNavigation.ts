import { useCallback, useEffect, useMemo, useState } from "react";

interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  moveDown: () => void;
  moveUp: () => void;
  activateSelection: () => boolean;
  hoverIndex: (index: number) => void;
  selectionOrigin: "keyboard" | "pointer" | "init";
}

export function useKeyboardNavigation(
  showChat: boolean,
  hits: Array<Record<string, unknown>>,
  query: string,
  openResultsInNewTab = true,
): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectionOrigin, setSelectionOrigin] = useState<
    "keyboard" | "pointer" | "init"
  >("init");

  const totalItems = useMemo(() => hits.length + 1, [hits.length]); // +1 for Ask AI

  const moveDown = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev + 1) % totalItems);
    setSelectionOrigin("keyboard");
  }, [showChat, totalItems]);

  const moveUp = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setSelectionOrigin("keyboard");
  }, [showChat, totalItems]);

  const hoverIndex = useCallback(
    (index: number) => {
      if (showChat || index < 0 || index >= totalItems) return;
      setSelectedIndex(index);
      setSelectionOrigin("pointer");
    },
    [showChat, totalItems],
  );

  const activateSelection = useCallback((): boolean => {
    if (showChat) return false;
    if (selectedIndex === 0) {
      return true; // Let parent handle AI activation
    }
    if (selectedIndex > 0) {
      const hit = hits[selectedIndex - 1];
      const url = typeof hit?.url === "string" ? hit.url : undefined;
      if (url) {
        if (openResultsInNewTab) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(url);
        }
        return true;
      }
    }
    return false;
  }, [showChat, selectedIndex, hits, openResultsInNewTab]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    setSelectedIndex(0);
    setSelectionOrigin("init");
  }, [query, showChat]);

  return {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  };
}
