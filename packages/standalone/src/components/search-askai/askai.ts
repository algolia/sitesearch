import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useMemo } from "react";
import { isThreadDepthError } from "./error-utils";

export interface AskAIConfig {
  applicationId: string;
  apiKey: string;
  indexName: string;
  assistantId: string;
  /** Demo mode: Simulate thread depth error after N exchanges (for testing only) */
  _demoThreadDepthLimit?: number;
}

export function useAskai(config: AskAIConfig) {
  if (!config) {
    throw new Error("config is required for useAskai");
  }

  const baseUrl = "https://askai.algolia.com";

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${baseUrl}/chat`,
      headers: async () => {
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
  ]);

  const chat = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
    },
  });

  const isGenerating =
    chat.status === "submitted" || chat.status === "streaming";

  // Check if there's a thread depth error (AI-217)
  // Only show error if there are messages (conversation is active)
  const hasThreadDepthError = useMemo(() => {
    const isError = chat.status === 'error' && isThreadDepthError(chat.error as Error | null);
    const hasMessages = chat.messages.length > 0;
    // Clear error if conversation was reset (no messages)
    return isError && hasMessages;
  }, [chat.status, chat.error, chat.messages.length]);

  return {
    ...chat,
    isGenerating,
    hasThreadDepthError,
  };
}

const BASE_ASKAI_URL = "https://askai.algolia.com";
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