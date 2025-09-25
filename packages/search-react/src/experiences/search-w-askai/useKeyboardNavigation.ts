import { useCallback, useEffect, useMemo, useState } from "react";

interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  moveDown: () => void;
  moveUp: () => void;
  activateSelection: () => boolean;
}

export function useKeyboardNavigation(
  showChat: boolean,
  hits: any[],
  query: string,
): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const totalItems = useMemo(() => hits.length + 1, [hits.length]); // +1 for Ask AI

  const moveDown = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev + 1) % totalItems);
  }, [showChat, totalItems]);

  const moveUp = useCallback(() => {
    if (showChat || totalItems === 0) return;
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [showChat, totalItems]);

  const activateSelection = useCallback((): boolean => {
    if (showChat) return false;
    if (selectedIndex === 0) {
      return true; // Let parent handle AI activation
    }
    if (selectedIndex > 0) {
      const hit = hits[selectedIndex - 1];
      if (hit?.url) {
        window.open(hit.url, "_blank", "noopener,noreferrer");
        return true;
      }
    }
    return false;
  }, [showChat, selectedIndex, hits]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, showChat]);

  return { selectedIndex, moveDown, moveUp, activateSelection };
}
