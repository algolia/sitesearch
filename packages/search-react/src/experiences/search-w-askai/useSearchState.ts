import { useCallback, useState } from "react";

interface UseSearchStateReturn {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  handleShowChat: (show: boolean) => void;
}

export function useSearchState(): UseSearchStateReturn {
  const [showChat, setShowChat] = useState(false);

  const handleShowChat = useCallback((show: boolean) => {
    setShowChat(show);
  }, []);

  return {
    showChat,
    setShowChat,
    handleShowChat,
  };
}
