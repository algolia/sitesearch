import type { Hit, LiteClient, SearchResponse } from "algoliasearch/lite";
import { useEffect, useRef, useState } from "react";

export const SUGGESTED_QUETIONS_INDEX_NAME =
  "algolia_ask_ai_suggested_questions";

type SuggestedQuestion = {
  appId: string;
  assistantId: string;
  question: string;
  locale?: string;
  state: "published";
  source: string;
  order: number;
};

export type SuggestedQuestionHit = Hit<SuggestedQuestion>;

type UseSuggestedQuestionsProps = {
  assistantId: string | null;
  suggestedQuestionsEnabled?: boolean;
  searchClient: LiteClient;
  isOpen?: boolean;
};

export const useSuggestedQuestions = ({
  assistantId,
  suggestedQuestionsEnabled = false,
  searchClient,
  isOpen = false,
}: UseSuggestedQuestionsProps): SuggestedQuestionHit[] => {
  const [suggestedQuestions, setSuggestedQuestions] = useState<
    SuggestedQuestionHit[]
  >([]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current || !isOpen) {
      return;
    }

    const getSuggestedQuestions = async (): Promise<void> => {
      if (!suggestedQuestionsEnabled || !assistantId || assistantId === "") {
        return;
      }

      try {
        const { results } = await searchClient.search<SuggestedQuestion>({
          requests: [
            {
              indexName: SUGGESTED_QUETIONS_INDEX_NAME,
              filters: `state:published AND assistantId:${assistantId}`,
              hitsPerPage: 3,
            },
          ],
        });

        const result = results[0] as SearchResponse<SuggestedQuestion>;
        setSuggestedQuestions(result.hits);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Failed to fetch suggested questions:", error);
      }
    };

    getSuggestedQuestions();
  }, [suggestedQuestionsEnabled, assistantId, isOpen, searchClient]);

  return suggestedQuestions;
};
