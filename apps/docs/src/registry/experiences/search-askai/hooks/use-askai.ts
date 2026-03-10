import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useMemo } from "react";

export interface AskAIConfig {
  applicationId: string;
  apiKey: string;
  indexName: string;
  assistantId: string;
  /**
   * When true, route to Agent Studio endpoints and schemas.
   * When false or unset, use existing Ask AI endpoints (default).
   */
  agentStudio?: boolean;
}

/**
 * Checks if an error is a thread depth error (AI-217)
 * Thread depth errors occur when a conversation has reached its maximum depth limit
 */
export function isThreadDepthError(error?: Error | null): boolean {
  if (!error) return false;

  // Check if error has a code property
  const errorWithCode = error as Error & { code?: string };
  if (errorWithCode.code === "AI-217") return true;

  // Check message content for AI-217 or thread depth references
  const message = error.message?.toLowerCase() || "";
  return message.includes("ai-217") || message.includes("thread depth");
}

const BASE_ASKAI_URL = "https://askai.algolia.com";

function getChatApiUrl(config: AskAIConfig): string {
  if (config.agentStudio) {
    const base = `https://${config.applicationId}.algolia.net/agent-studio`;
    return `${base}/1/agents/${config.assistantId}/completions?stream=true&compatibilityMode=ai-sdk-5`;
  }
  return `${BASE_ASKAI_URL}/chat`;
}

export function useAskai(config: AskAIConfig) {
  if (!config) {
    throw new Error("config is required for useAskai");
  }

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
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const isGenerating =
    chat.status === "submitted" || chat.status === "streaming";

  // Check if there's a thread depth error (AI-217)
  const hasThreadDepthError = useMemo(() => {
    return (
      chat.status === "error" && isThreadDepthError(chat.error as Error | null)
    );
  }, [chat.status, chat.error]);

  return {
    ...chat,
    isGenerating,
    hasThreadDepthError,
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

// call /token once, cache the promise while it’s running
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
