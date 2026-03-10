import type { BaseHit, Hit } from "instantsearch.js";
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
  hits: Hit<BaseHit>[],
  query: string,
): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectionOrigin, setSelectionOrigin] = useState<
    "keyboard" | "pointer" | "init"
  >("init");

  const totalItems = useMemo(() => hits.length, [hits.length]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalItems);
    setSelectionOrigin("keyboard");
  }, [totalItems]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setSelectionOrigin("keyboard");
  }, [totalItems]);

  const hoverIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalItems) return;
      setSelectedIndex(index);
      setSelectionOrigin("pointer");
    },
    [totalItems],
  );

  const activateSelection = useCallback((): boolean => {
    const hit = hits[selectedIndex];
    const url = typeof hit?.url === "string" ? hit.url : undefined;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  }, [selectedIndex, hits]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    setSelectedIndex(0);
    setSelectionOrigin("init");
  }, [query]);

  return {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  };
}
