import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  generateId,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useCallback, useMemo, useRef, useState } from "react";
import { isAskAiPromptBlockingError, isThreadDepthError } from "./error-utils";

export interface AskAIConfig {
  applicationId: string;
  apiKey: string;
  indexName: string;
  assistantId: string;
  agentStudio?: boolean;
}

const BASE_ASKAI_URL = "https://askai.algolia.com";

const agentStudioBaseUrl = (appId: string): string =>
  `https://${appId}.algolia.net/agent-studio/1`;

/**
 * Resolves the chat API URL for the given config.
 * When agentStudio is true, uses Agent Studio completions endpoint.
 */
function getChatApiUrl(config: AskAIConfig): string {
  if (config.agentStudio) {
    return `${agentStudioBaseUrl(config.applicationId)}/agents/${config.assistantId}/completions?stream=true&compatibilityMode=ai-sdk-5`;
  }
  return `${BASE_ASKAI_URL}/chat`;
}

export function useAskai(config: AskAIConfig) {
  if (!config) {
    throw new Error("config is required for useAskai");
  }

  const [chatId, setChatId] = useState(() => generateId());

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: getChatApiUrl(config),
      headers: async () => {
        if (config.agentStudio) {
          return {
            "x-algolia-api-key": config.apiKey,
            "x-algolia-application-id": config.applicationId,
          } as Record<string, string>;
        }
        const token = await getValidToken({ assistantId: config.assistantId });
        return {
          "x-algolia-api-key": config.apiKey,
          "x-algolia-application-id": config.applicationId,
          "x-algolia-index-name": config.indexName,
          "x-algolia-assistant-id": config.assistantId,
          "x-ai-sdk-version": "v5",
          authorization: `TOKEN ${token}`,
        } as Record<string, string>;
      },
    });
  }, [
    config.apiKey,
    config.applicationId,
    config.indexName,
    config.assistantId,
    config.agentStudio,
    config,
  ]);

  const chat = useChat({
    id: chatId,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const chatRef = useRef(chat);
  chatRef.current = chat;

  const startNewConversation = useCallback(() => {
    chatRef.current.stop();
    chatRef.current.clearError();
    setChatId(generateId());
  }, []);

  const isGenerating =
    chat.status === "submitted" || chat.status === "streaming";

  const agentStudioEnabled = Boolean(config.agentStudio);

  /** Agent Studio cost controls (tokens, steps, rate limit, domain). */
  const promptBlockingError = useMemo(
    () =>
      chat.status === "error" &&
      isAskAiPromptBlockingError(chat.error, agentStudioEnabled),
    [chat.status, chat.error, agentStudioEnabled],
  );

  /**
   * Banner and input lock: thread depth only after at least one assistant reply;
   * other blocks (e.g. rate limit on first turn) show immediately.
   */
  const showPromptBlockingError = useMemo(
    () =>
      promptBlockingError &&
      (isThreadDepthError(chat.error)
        ? chat.messages.some((m) => m.role === "assistant")
        : true),
    [promptBlockingError, chat.error, chat.messages],
  );

  return {
    ...chat,
    startNewConversation,
    isGenerating,
    promptBlockingError,
    showPromptBlockingError,
  };
}

const TOKEN_KEY = "askai_token";

type TokenPayload = { exp: number };

const decode = (token: string): TokenPayload => {
  const [b64] = token.split(".");
  return JSON.parse(atob(b64));
};

const isExpired = (token?: string | null): boolean => {
  if (!token) return true;
  try {
    const { exp } = decode(token);
    // refresh 30 s before the backend rejects it
    return Date.now() / 1000 > exp - 30;
  } catch {
    return true;
  }
};

let inflight: Promise<string> | null = null;

// call /token once, cache the promise while it's running
// eslint-disable-next-line require-await
export const getValidToken = async ({
  assistantId,
}: {
  assistantId: string;
}): Promise<string> => {
  const cached = sessionStorage.getItem(TOKEN_KEY);
  if (!isExpired(cached)) return cached as string;

  if (!inflight) {
    inflight = fetch(`${BASE_ASKAI_URL}/chat/token`, {
      method: "POST",
      headers: {
        "x-algolia-assistant-id": assistantId,
        "content-type": "application/json",
      },
    })
      .then((r) => r.json())
      .then(({ token }) => {
        sessionStorage.setItem(TOKEN_KEY, token);
        return token;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
};

export const postAgentStudioFeedback = ({
  agentId,
  vote,
  messageId,
  appId,
  apiKey,
}: {
  agentId: string;
  vote: 0 | 1;
  messageId: string;
  appId: string;
  apiKey: string;
}): Promise<Response> => {
  const headers = new Headers();
  headers.set("x-algolia-application-id", appId);
  headers.set("x-algolia-api-key", apiKey);
  headers.set("content-type", "application/json");

  const baseUrl = `${agentStudioBaseUrl(appId)}/feedback`;

  return fetch(baseUrl, {
    method: "POST",
    body: JSON.stringify({
      messageId,
      agentId,
      vote,
    }),
    headers,
  });
};

export const postFeedback = async ({
  assistantId,
  thumbs,
  messageId,
  appId,
}: {
  assistantId: string;
  thumbs: 0 | 1;
  messageId: string;
  appId: string;
}): Promise<Response> => {
  const headers = new Headers();
  headers.set("x-algolia-assistant-id", assistantId);
  headers.set("content-type", "application/json");

  const token = await getValidToken({ assistantId });
  headers.set("authorization", `TOKEN ${token}`);

  return fetch(`${BASE_ASKAI_URL}/chat/feedback`, {
    method: "POST",
    body: JSON.stringify({
      appId,
      messageId,
      thumbs,
    }),
    headers,
  });
};
