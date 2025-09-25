import { useCallback, useEffect, useMemo, useState } from "react";

interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  moveDown: () => void;
  moveUp: () => void;
  activateSelection: () => boolean;
}

export function useKeyboardNavigation(
  hits: any[],
  query: string,
): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const totalItems = useMemo(() => hits.length, [hits.length]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const activateSelection = useCallback((): boolean => {
    const hit = hits[selectedIndex];
    if (hit?.url) {
      window.open(hit.url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  }, [selectedIndex, hits]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  return { selectedIndex, moveDown, moveUp, activateSelection };
}
