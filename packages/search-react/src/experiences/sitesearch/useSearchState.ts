import { useState, useCallback } from 'react';

interface UseSearchStateReturn {
  showChat: boolean;
  initialQuestion: string | undefined;
  setShowChat: (show: boolean) => void;
  setInitialQuestion: (question: string | undefined) => void;
  handleShowChat: (show: boolean, question?: string) => void;
}

export function useSearchState(): UseSearchStateReturn {
  const [showChat, setShowChat] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(undefined);

  const handleShowChat = useCallback((show: boolean, question?: string) => {
    setShowChat(show);
    if (show && question) {
      setInitialQuestion(question);
    }
  }, []);

  return {
    showChat,
    initialQuestion,
    setShowChat,
    setInitialQuestion,
    handleShowChat,
  };
}