/**
 * Ask AI / Agent Studio error helpers: thread depth (AI-217) and Agent Studio
 * cost controls (tokens, steps, rate limits, domain allowlisting), aligned with
 * DocSearch `utils/askAiBlockingMatchers` + `utils/ai` behavior.
 */

const AGENT_STUDIO_PROMPT_BLOCKING_CODES = new Set([
  "AI-203", // Forbidden (e.g. domain not whitelisted)
  "AI-205", // Rate limited
  "AI-224", // Context / max token length
  "AI-225", // Max agent steps
]);

const TOKEN_OUTPUT_LIMIT_FALLBACK =
  "Could not complete response due to token output limits";

function errorMessage(error: unknown): string {
  if (error == null) return "";
  if (error instanceof Error) {
    let msg = error.message ?? "";
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) {
      const c = cause.message ?? "";
      if (c && !msg.includes(c)) {
        msg = msg ? `${msg} ${c}` : c;
      }
    } else if (typeof cause === "string" && cause && !msg.includes(cause)) {
      msg = msg ? `${msg} ${cause}` : cause;
    }
    return msg;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

function readAgentStudioJsonStringField(
  o: Record<string, unknown>,
  key: string,
): string | undefined {
  for (const [k, v] of Object.entries(o)) {
    if (
      k.toLowerCase() === key.toLowerCase() &&
      typeof v === "string" &&
      v.trim() !== ""
    ) {
      return v.trim();
    }
  }
  return undefined;
}

function extractAiErrorCodeFromMessage(message: string): string | undefined {
  const direct = /\b(AI-\d{3})\b/i.exec(message);
  if (direct) return direct[1].toUpperCase();
  try {
    const parsed = JSON.parse(message) as {
      code?: string;
      errorCode?: string;
    };
    const c = parsed.code ?? parsed.errorCode;
    if (typeof c === "string" && /AI-\d{3}/i.test(c)) {
      return c.trim().toUpperCase();
    }
  } catch {
    // ignore
  }
  return undefined;
}

function threadDepthFromPlainText(message: string): boolean {
  if (!message) return false;
  if (message.toUpperCase().includes("AI-217")) return true;
  return /conversation\s+depth/i.test(message);
}

function messageLooksLikeThreadDepth(message: string): boolean {
  if (threadDepthFromPlainText(message)) return true;
  try {
    const parsed = JSON.parse(message) as {
      code?: string;
      errorCode?: string;
      message?: string;
    };
    const code = parsed.code ?? parsed.errorCode;
    if (typeof code === "string" && code.toUpperCase() === "AI-217") {
      return true;
    }
    const nested = typeof parsed.message === "string" ? parsed.message : "";
    return threadDepthFromPlainText(nested);
  } catch {
    return false;
  }
}

/**
 * Whether the error is thread depth exceeded (AI-217), including JSON-shaped Agent Studio payloads in `message`.
 */
export function isThreadDepthError(error?: unknown): boolean {
  return messageLooksLikeThreadDepth(errorMessage(error));
}

function matchesRequestBlockedForThisDomainMessage(
  normalizedMessage: string,
): boolean {
  return (
    /\brequest blocked for this domain\b/.test(normalizedMessage) ||
    /\bblocked for this domain\b/.test(normalizedMessage)
  );
}

function matchesAgentStudioMaxStepsMessage(normalizedMessage: string): boolean {
  const m = normalizedMessage;
  return (
    /\bstep limit\b/.test(m) ||
    /\bmax steps\b/.test(m) ||
    /\bmax step\b/.test(m) ||
    /\bmaximum steps\b/.test(m) ||
    /\bmaximum step\b/.test(m) ||
    /\bmax agent steps\b/.test(m) ||
    /\bmax agent step\b/.test(m) ||
    /\bmaximum agent steps\b/.test(m) ||
    /\bmaximum agent step\b/.test(m) ||
    /\bmax steps per completion\b/.test(m) ||
    /\bsteps per completion limit\b/.test(m)
  );
}

function matchesAgentStudioRateLimitMessage(
  normalizedMessage: string,
): boolean {
  return (
    /\b429\b/.test(normalizedMessage) ||
    /\brate\s*limit/i.test(normalizedMessage) ||
    /\btoo\s+many\s+attempts\b/.test(normalizedMessage) ||
    /\btoo_many_requests\b/.test(normalizedMessage)
  );
}

function matchesAgentStudioTokenOutputLimitPlainMessage(
  message: string,
): boolean {
  return /\bTokenOutputLimitError\b/i.test(message);
}

function matchesAgentStudioWhitelistOrNotAllowedDomainPlainMessage(
  normalizedMessage: string,
): boolean {
  return (
    /\bwhitelist(ed)?\b/.test(normalizedMessage) ||
    /\bnot\s+allowed\s+for\s+this\s+domain\b/.test(normalizedMessage)
  );
}

function matchesAgentStudioContextOrTokenLimitsPlainMessage(
  normalizedMessage: string,
): boolean {
  const m = normalizedMessage;
  return (
    /\bcontext\s+length\b/.test(m) ||
    /\bmax tokens\b/.test(m) ||
    /\bmax token\b/.test(m) ||
    /\bmaximum tokens\b/.test(m) ||
    /\bmaximum token\b/.test(m) ||
    /\btoken\s+limit\b/.test(m) ||
    /\btoken\s+output\b/.test(m) ||
    /\boutput\s+limits?\b/.test(m)
  );
}

function jsonMessageIsRequestBlockedForDomain(
  parsed: Record<string, unknown>,
): boolean {
  const msg = readAgentStudioJsonStringField(parsed, "message") ?? "";
  return matchesRequestBlockedForThisDomainMessage(msg.toLowerCase());
}

function jsonPayloadImpliesCostControlExcludingRequestBlockedDomainMessage(
  parsed: Record<string, unknown>,
): boolean {
  const type = typeof parsed.type === "string" ? parsed.type : "";
  if (
    /tokenoutput|outputlimit|steplimit|maxstep|ratelimit|domainnotallowed/i.test(
      type,
    )
  ) {
    return true;
  }
  const errCode = readAgentStudioJsonStringField(parsed, "error") ?? "";
  if (errCode.toUpperCase() === "TOO_MANY_REQUESTS") {
    return true;
  }
  if (
    /token output|output limits|token limits|rate limit|whitelist|step limit|max steps|could not complete response due to token/i.test(
      errCode,
    )
  ) {
    return true;
  }
  const msg = readAgentStudioJsonStringField(parsed, "message") ?? "";
  if (/rate limit exceeded|retry after \d+/i.test(msg)) {
    return true;
  }
  if (/whitelist/i.test(msg)) {
    return true;
  }
  const lower = msg.toLowerCase();
  const notAllowedAt = lower.indexOf("not allowed");
  if (notAllowedAt !== -1 && lower.indexOf("domain", notAllowedAt) !== -1) {
    return true;
  }
  return false;
}

type BlockingMatchContext = {
  message: string;
  messageLower: string;
  parsedJson: Record<string, unknown> | null;
  extractedCodeUpper: string | undefined;
};

type BlockingMatcher = {
  matches: (c: BlockingMatchContext) => boolean;
  showNewConversationLink?: boolean;
};

function buildBlockingContext(rawMessage: string): BlockingMatchContext {
  const message = rawMessage;
  const messageLower = message.toLowerCase();
  let parsedJson: Record<string, unknown> | null = null;
  try {
    const p = JSON.parse(message) as Record<string, unknown>;
    if (p && typeof p === "object" && !Array.isArray(p)) {
      parsedJson = p;
    }
  } catch {
    // not JSON
  }
  return {
    message,
    messageLower,
    parsedJson,
    extractedCodeUpper: extractAiErrorCodeFromMessage(message),
  };
}

const agentStudioPromptBlockingMatchers: BlockingMatcher[] = [
  {
    matches: (c) =>
      typeof c.extractedCodeUpper === "string" &&
      AGENT_STUDIO_PROMPT_BLOCKING_CODES.has(c.extractedCodeUpper),
  },
  {
    matches: (c) =>
      c.parsedJson !== null &&
      jsonMessageIsRequestBlockedForDomain(c.parsedJson),
    showNewConversationLink: false,
  },
  {
    matches: (c) =>
      c.parsedJson !== null &&
      jsonPayloadImpliesCostControlExcludingRequestBlockedDomainMessage(
        c.parsedJson,
      ),
  },
  {
    matches: (c) => matchesAgentStudioTokenOutputLimitPlainMessage(c.message),
    showNewConversationLink: false,
  },
  {
    matches: (c) => matchesAgentStudioRateLimitMessage(c.messageLower),
  },
  {
    matches: (c) => matchesRequestBlockedForThisDomainMessage(c.messageLower),
    showNewConversationLink: false,
  },
  {
    matches: (c) =>
      matchesAgentStudioWhitelistOrNotAllowedDomainPlainMessage(c.messageLower),
  },
  {
    matches: (c) =>
      matchesAgentStudioContextOrTokenLimitsPlainMessage(c.messageLower),
  },
  {
    matches: (c) => matchesAgentStudioMaxStepsMessage(c.messageLower),
  },
];

function resolveAgentStudioPromptBlocking(rawMessage: string): {
  blocking: boolean;
  showNewConversationLink: boolean;
} {
  const ctx = buildBlockingContext(rawMessage);
  const matched = agentStudioPromptBlockingMatchers.filter((m) =>
    m.matches(ctx),
  );
  if (matched.length === 0) {
    return { blocking: false, showNewConversationLink: true };
  }
  const showNewConversationLink = matched.every(
    (m) => m.showNewConversationLink !== false,
  );
  return { blocking: true, showNewConversationLink };
}

function messageLooksLikeAgentStudioCostControl(rawMessage: string): boolean {
  return resolveAgentStudioPromptBlocking(rawMessage).blocking;
}

/**
 * Whether further prompts should be blocked: thread depth (any backend) or Agent Studio cost controls.
 */
export function isAskAiPromptBlockingError(
  error?: unknown,
  agentStudio = false,
): boolean {
  if (error == null) return false;
  if (isThreadDepthError(error)) return true;
  if (!agentStudio) return false;
  return messageLooksLikeAgentStudioCostControl(errorMessage(error));
}

/**
 * Agent Studio stream hit the completion token ceiling (`TokenOutputLimitError`).
 */
export function isAgentStudioTokenOutputLimitError(error?: unknown): boolean {
  const msg = errorMessage(error);
  if (/TokenOutputLimitError/i.test(msg)) return true;
  if (/could not complete response due to token output limits/i.test(msg)) {
    return true;
  }
  try {
    const p = JSON.parse(msg) as { type?: string; error?: string };
    if (
      typeof p.type === "string" &&
      /^TokenOutputLimitError$/i.test(p.type.trim())
    ) {
      return true;
    }
    if (typeof p.error === "string" && /token output limits/i.test(p.error)) {
      return true;
    }
  } catch {
    // not JSON
  }
  return false;
}

/**
 * Whether the blocking banner should include “Start a new conversation … to continue”.
 */
export function showAskAiBlockingBannerNewConversationLink(
  error?: unknown,
  agentStudio = false,
): boolean {
  if (error == null) return true;
  if (isAgentStudioTokenOutputLimitError(error)) return false;
  if (isThreadDepthError(error)) return true;
  if (!agentStudio) return true;
  return resolveAgentStudioPromptBlocking(errorMessage(error))
    .showNewConversationLink;
}

function stripTrailingAiCodeSuffix(message: string): string {
  return message.replace(/\s*\(AI-\d{3}\)\s*$/i, "").trim();
}

function looksLikeJsonObjectString(s: string): boolean {
  const t = s.trim();
  return t.startsWith("{") && t.endsWith("}");
}

/**
 * Pulls `message` or `error` from Agent Studio JSON payloads, including double-encoded JSON
 * and objects serialized with escaped quotes (`{\"error\": \"...\"}`).
 */
export function extractAgentStudioErrorFieldMessage(
  raw: string,
): string | undefined {
  let s = raw.trim();
  if (!s) return undefined;

  let iterations = 0;
  while (iterations < 10) {
    iterations += 1;
    try {
      const v: unknown = JSON.parse(s);
      if (typeof v === "string") {
        const next = v.trim();
        if (!next) return undefined;
        s = next;
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        const o = v as Record<string, unknown>;
        const msg = readAgentStudioJsonStringField(o, "message");
        if (msg) {
          return msg;
        }
        const err = readAgentStudioJsonStringField(o, "error");
        if (err) {
          return err;
        }
        return undefined;
      } else {
        return undefined;
      }
    } catch {
      if (/\\"/.test(s)) {
        s = s.replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
      } else {
        const mMsg = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(s);
        if (mMsg?.[1]) {
          return mMsg[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
        }
        const mErr = /"error"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(s);
        if (mErr?.[1]) {
          return mErr[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
        }
        return undefined;
      }
    }
  }

  return undefined;
}

/**
 * “Request blocked for this domain” (Agent Studio origin allowlist), including nested JSON `message`.
 */
export function isRequestBlockedForDomainAskAiError(error?: unknown): boolean {
  if (error == null) return false;
  const raw = errorMessage(error);
  const lower = raw.toLowerCase();
  if (matchesRequestBlockedForThisDomainMessage(lower)) return true;
  const extracted = extractAgentStudioErrorFieldMessage(raw.trim());
  if (
    extracted &&
    matchesRequestBlockedForThisDomainMessage(extracted.toLowerCase())
  ) {
    return true;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (jsonMessageIsRequestBlockedForDomain(parsed)) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function getAskAiPromptBlockingUserFacingMessage(
  error?: unknown,
): string | undefined {
  if (error == null) return undefined;
  const raw = errorMessage(error);
  const extracted = extractAgentStudioErrorFieldMessage(raw);
  if (extracted) {
    return extracted;
  }
  const stripped = stripTrailingAiCodeSuffix(raw.trim());
  return stripped !== "" ? stripped : undefined;
}

/**
 * Primary line for the blocking banner (parsed API text when possible).
 */
export function promptBlockingBannerMessage(
  error?: unknown,
  agentStudio = false,
): string | undefined {
  if (!isAskAiPromptBlockingError(error, agentStudio)) return undefined;

  if (isAgentStudioTokenOutputLimitError(error)) {
    const m = getAskAiPromptBlockingUserFacingMessage(error);
    if (m && !looksLikeJsonObjectString(m)) {
      return m;
    }
    return TOKEN_OUTPUT_LIMIT_FALLBACK;
  }

  return getAskAiPromptBlockingUserFacingMessage(error);
}

/**
 * Whether to omit the shell chat field (modal search bar, sidepanel compose, etc.).
 * The banner can show token-limit copy while {@link showAskAiBlockingBannerNewConversationLink}
 * stays true (generic “context / token” matchers), so we also key off the resolved banner text.
 * Max-steps / per-completion limits use the same pattern (API copy may not flip the “new chat” heuristic).
 */
export function shouldHideAskAiShellChatInput(
  error: unknown,
  agentStudio: boolean,
): boolean {
  if (!agentStudio) return false;
  if (!isAskAiPromptBlockingError(error, agentStudio)) return false;
  const rawLower = errorMessage(error).toLowerCase();
  if (matchesAgentStudioMaxStepsMessage(rawLower)) return true;
  if (isAgentStudioTokenOutputLimitError(error)) return true;
  const banner = promptBlockingBannerMessage(error, agentStudio);
  if (
    banner &&
    /could not complete response due to token output limits/i.test(banner)
  ) {
    return true;
  }
  if (banner && matchesAgentStudioMaxStepsMessage(banner.toLowerCase())) {
    return true;
  }
  return !showAskAiBlockingBannerNewConversationLink(error, agentStudio);
}

/**
 * Human-readable thread-depth text from the API (plain `Error.message` or JSON `{"message":"…"}`).
 * @deprecated Prefer {@link promptBlockingBannerMessage} with `agentStudio` for combined blocking UX.
 */
export function threadDepthErrorDetail(error?: unknown): string | undefined {
  if (!isThreadDepthError(error)) return undefined;
  return getAskAiPromptBlockingUserFacingMessage(error);
}

/**
 * Props for ThreadDepthErrorBanner component
 */
export interface ThreadDepthErrorBannerProps {
  onNewChat?: () => void;
  detailMessage?: string;
  /**
   * When false, only the API/detail line is shown (e.g. token output limit, domain blocked on origin).
   */
  showNewConversationLink?: boolean;
}

/**
 * Banner when the conversation cannot accept further prompts (thread depth or Agent Studio limits).
 */
export const ThreadDepthErrorBanner = ({
  onNewChat,
  detailMessage,
  showNewConversationLink = true,
}: ThreadDepthErrorBannerProps) => (
  <div className="ss-thread-depth-error-banner">
    {detailMessage ? (
      <p className="ss-thread-depth-error-detail">{detailMessage}</p>
    ) : null}
    {showNewConversationLink ? (
      <p className="ss-thread-depth-error-main">
        {onNewChat ? (
          <button
            type="button"
            className="ss-thread-depth-error-link"
            onClick={onNewChat}
          >
            Start a new conversation
          </button>
        ) : (
          <span className="ss-thread-depth-error-cta">
            Start a new conversation
          </span>
        )}{" "}
        to continue.
      </p>
    ) : null}
  </div>
);
