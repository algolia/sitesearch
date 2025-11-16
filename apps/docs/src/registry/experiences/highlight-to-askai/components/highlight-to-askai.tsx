/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: markdown rendering, sanitized by marked */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: parts are stable during render */
"use client";

import type { Placement, ReferenceType } from "@floating-ui/react";
import {
  FloatingPortal,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  BrainIcon,
  CornerDownLeftIcon,
  SearchIcon,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { marked } from "marked";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  postFeedback,
  useAskai,
} from "@/registry/experiences/highlight-to-askai/hooks/use-askai";

type OnAskPayload = {
  text: string;
  html: string;
  rect: DOMRect;
  range: Range;
  contextNode: HTMLElement;
};

export type HighlightAskAIProps = {
  applicationId: string;
  apiKey: string;
  indexName: string;
  assistantId: string;
  excludeElements?: string[];
  side?: Placement;
  sideOffset?: number;
  delay?: number;
  askButtonLabel?: string;
  className?: string;
  askAiBaseUrl?: string;
  onAsk?: (payload: OnAskPayload) => void | Promise<void>;
  children: React.ReactNode;
};

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element | null;
};

function isWhitespaceOnly(text: string) {
  return text.trim().length === 0;
}

function selectionIntersectsContainer(
  range: Range,
  container: HTMLElement,
): boolean {
  const startContainer = range.startContainer as Node | null;
  const endContainer = range.endContainer as Node | null;
  if (!startContainer || !endContainer) return false;
  return container.contains(startContainer) || container.contains(endContainer);
}

function nodeIsExcluded(node: Node, selectors: string[]): boolean {
  let el: Element | null = null;
  if (node instanceof Element) {
    el = node;
  } else if ((node as ChildNode).parentElement) {
    el = (node as ChildNode).parentElement;
  }
  if (!el) return false;
  for (const sel of selectors) {
    if (el.closest(sel)) return true;
  }
  return false;
}

const AlgoliaLogo = ({ size = 52 }: { size?: number | string }) => (
  <svg
    width="80"
    height="24"
    aria-label="Algolia"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 2196.2 500"
    style={{ maxWidth: size }}
  >
    <defs>
      {/* eslint-disable-nextLine @docusaurus/no-untranslated-text */}
      <style>{`.cls-1,.cls-2{fill:#003dff}.cls-2{fillRule:evenodd}`}</style>
    </defs>
    <path
      className="cls-2"
      d="M1070.38,275.3V5.91c0-3.63-3.24-6.39-6.82-5.83l-50.46,7.94c-2.87,.45-4.99,2.93-4.99,5.84l.17,273.22c0,12.92,0,92.7,95.97,95.49,3.33,.1,6.09-2.58,6.09-5.91v-40.78c0-2.96-2.19-5.51-5.12-5.84-34.85-4.01-34.85-47.57-34.85-54.72Z"
    />
    <rect
      className="cls-1"
      x="1845.88"
      y="104.73"
      width="62.58"
      height="277.9"
      rx="5.9"
      ry="5.9"
    />
    <path
      className="cls-2"
      d="M1851.78,71.38h50.77c3.26,0,5.9-2.64,5.9-5.9V5.9c0-3.62-3.24-6.39-6.82-5.83l-50.77,7.95c-2.87,.45-4.99,2.92-4.99,5.83v51.62c0,3.26,2.64,5.9,5.9,5.9Z"
    />
    <path
      className="cls-2"
      d="M1764.03,275.3V5.91c0-3.63-3.24-6.39-6.82-5.83l-50.46,7.94c-2.87,.45-4.99,2.93-4.99,5.84l.17,273.22c0,12.92,0,92.7,95.97,95.49,3.33,.1,6.09-2.58,6.09-5.91v-40.78c0-2.96-2.19-5.51-5.12-5.84-34.85-4.01-34.85-47.57-34.85-54.72Z"
    />
    <path
      className="cls-2"
      d="M1631.95,142.72c-11.14-12.25-24.83-21.65-40.78-28.31-15.92-6.53-33.26-9.85-52.07-9.85-18.78,0-36.15,3.17-51.92,9.85-15.59,6.66-29.29,16.05-40.76,28.31-11.47,12.23-20.38,26.87-26.76,44.03-6.38,17.17-9.24,37.37-9.24,58.36,0,20.99,3.19,36.87,9.55,54.21,6.38,17.32,15.14,32.11,26.45,44.36,11.29,12.23,24.83,21.62,40.6,28.46,15.77,6.83,40.12,10.33,52.4,10.48,12.25,0,36.78-3.82,52.7-10.48,15.92-6.68,29.46-16.23,40.78-28.46,11.29-12.25,20.05-27.04,26.25-44.36,6.22-17.34,9.24-33.22,9.24-54.21,0-20.99-3.34-41.19-10.03-58.36-6.38-17.17-15.14-31.8-26.43-44.03Zm-44.43,163.75c-11.47,15.75-27.56,23.7-48.09,23.7-20.55,0-36.63-7.8-48.1-23.7-11.47-15.75-17.21-34.01-17.21-61.2,0-26.89,5.59-49.14,17.06-64.87,11.45-15.75,27.54-23.52,48.07-23.52,20.55,0,36.63,7.78,48.09,23.52,11.47,15.57,17.36,37.98,17.36,64.87,0,27.19-5.72,45.3-17.19,61.2Z"
    />
    <path
      className="cls-2"
      d="M894.42,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-14.52,22.58-22.99,49.63-22.99,78.73,0,44.89,20.13,84.92,51.59,111.1,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47,1.23,0,2.46-.03,3.68-.09,.36-.02,.71-.05,1.07-.07,.87-.05,1.75-.11,2.62-.2,.34-.03,.68-.08,1.02-.12,.91-.1,1.82-.21,2.73-.34,.21-.03,.42-.07,.63-.1,32.89-5.07,61.56-30.82,70.9-62.81v57.83c0,3.26,2.64,5.9,5.9,5.9h50.42c3.26,0,5.9-2.64,5.9-5.9V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,206.92c-12.2,10.16-27.97,13.98-44.84,15.12-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-42.24,0-77.12-35.89-77.12-79.37,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33v142.83Z"
    />
    <path
      className="cls-2"
      d="M2133.97,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-14.52,22.58-22.99,49.63-22.99,78.73,0,44.89,20.13,84.92,51.59,111.1,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47,1.23,0,2.46-.03,3.68-.09,.36-.02,.71-.05,1.07-.07,.87-.05,1.75-.11,2.62-.2,.34-.03,.68-.08,1.02-.12,.91-.1,1.82-.21,2.73-.34,.21-.03,.42-.07,.63-.1,32.89-5.07,61.56-30.82,70.9-62.81v57.83c0,3.26,2.64,5.9,5.9,5.9h50.42c3.26,0,5.9-2.64,5.9-5.9V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,206.92c-12.2,10.16-27.97,13.98-44.84,15.12-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-42.24,0-77.12-35.89-77.12-79.37,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33v142.83Z"
    />
    <path
      className="cls-2"
      d="M1314.05,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-11.79,18.34-19.6,39.64-22.11,62.59-.58,5.3-.88,10.68-.88,16.14s.31,11.15,.93,16.59c4.28,38.09,23.14,71.61,50.66,94.52,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47h0c17.99,0,34.61-5.93,48.16-15.97,16.29-11.58,28.88-28.54,34.48-47.75v50.26h-.11v11.08c0,21.84-5.71,38.27-17.34,49.36-11.61,11.08-31.04,16.63-58.25,16.63-11.12,0-28.79-.59-46.6-2.41-2.83-.29-5.46,1.5-6.27,4.22l-12.78,43.11c-1.02,3.46,1.27,7.02,4.83,7.53,21.52,3.08,42.52,4.68,54.65,4.68,48.91,0,85.16-10.75,108.89-32.21,21.48-19.41,33.15-48.89,35.2-88.52V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,64.1s.65,139.13,0,143.36c-12.08,9.77-27.11,13.59-43.49,14.7-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-1.32,0-2.63-.03-3.94-.1-40.41-2.11-74.52-37.26-74.52-79.38,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33Z"
    />
    <path
      className="cls-1"
      d="M249.83,0C113.3,0,2,110.09,.03,246.16c-2,138.19,110.12,252.7,248.33,253.5,42.68,.25,83.79-10.19,120.3-30.03,3.56-1.93,4.11-6.83,1.08-9.51l-23.38-20.72c-4.75-4.21-11.51-5.4-17.36-2.92-25.48,10.84-53.17,16.38-81.71,16.03-111.68-1.37-201.91-94.29-200.13-205.96,1.76-110.26,92-199.41,202.67-199.41h202.69V407.41l-115-102.18c-3.72-3.31-9.42-2.66-12.42,1.31-18.46,24.44-48.53,39.64-81.93,37.34-46.33-3.2-83.87-40.5-87.34-86.81-4.15-55.24,39.63-101.52,94-101.52,49.18,0,89.68,37.85,93.91,85.95,.38,4.28,2.31,8.27,5.52,11.12l29.95,26.55c3.4,3.01,8.79,1.17,9.63-3.3,2.16-11.55,2.92-23.58,2.07-35.92-4.82-70.34-61.8-126.93-132.17-131.26-80.68-4.97-148.13,58.14-150.27,137.25-2.09,77.1,61.08,143.56,138.19,145.26,32.19,.71,62.03-9.41,86.14-26.95l150.26,133.2c6.44,5.71,16.61,1.14,16.61-7.47V9.48C499.66,4.25,495.42,0,490.18,0H249.83Z"
    />
  </svg>
);

export function HighlightAskAI({
  applicationId,
  apiKey,
  indexName,
  assistantId,
  excludeElements = ["pre", "code"],
  side = "top",
  sideOffset = 8,
  delay = 120,
  askButtonLabel = "Ask AI?",
  className,
  onAsk,
  children,
}: HighlightAskAIProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [range, setRange] = React.useState<Range | null>(null);
  const [virtualEl, setVirtualEl] = React.useState<VirtualElement | null>(null);
  const [followUpInput, setFollowUpInput] = React.useState<string>("");
  const [feedbackGiven, setFeedbackGiven] = React.useState(false);
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);

  const { messages, error, isGenerating, sendMessage, setMessages, stop } =
    useAskai({
      applicationId,
      apiKey,
      indexName,
      assistantId,
    });
  const resetConversation = React.useCallback(() => {
    try {
      stop?.();
    } catch {}
    setMessages?.([]);
    setFollowUpInput("");
    setFeedbackGiven(false);
    setSubmittingFeedback(false);
  }, [setMessages, stop]);

  const { refs, floatingStyles, update } = useFloating<
    HTMLElement | ReferenceType
  >({
    placement: side,
    middleware: [offset(sideOffset), flip(), shift()],
    // Don't use autoUpdate - we want the tooltip to stay in place on scroll
  });

  // Keep placement in sync with prop changes
  React.useEffect(() => {
    update?.();
  }, [update]);

  React.useEffect(() => {
    if (virtualEl) refs.setReference(virtualEl as unknown as ReferenceType);
  }, [virtualEl, refs.setReference]);

  // Debounced selection handler
  const debounceRef = React.useRef<number | null>(null);
  const handleSelectionChange = React.useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const sel = window.getSelection();
      const containerEl = containerRef.current;
      const floatingEl = refs.floating.current;
      const activeEl =
        typeof document !== "undefined"
          ? (document.activeElement as Node | null)
          : null;

      // Ignore selection changes while focus is inside the floating tooltip
      if (floatingEl && activeEl && floatingEl.contains(activeEl)) {
        return;
      }

      if (!sel || !containerEl) return;
      if (sel.rangeCount === 0 || sel.isCollapsed) {
        // Don't close if already expanded; allow typing in the tooltip
        if (!expanded) {
          setOpen(false);
          setExpanded(false);
          setRange(null);
          setVirtualEl(null);
        }
        return;
      }

      const nextRange = sel.getRangeAt(0);
      const text = sel.toString();
      if (isWhitespaceOnly(text)) {
        if (!expanded) {
          setOpen(false);
          setExpanded(false);
          setRange(null);
          setVirtualEl(null);
        }
        return;
      }

      if (!selectionIntersectsContainer(nextRange, containerEl)) {
        if (!expanded) {
          setOpen(false);
          setExpanded(false);
          setRange(null);
          setVirtualEl(null);
        }
        return;
      }

      const anchorNode = sel.anchorNode;
      const focusNode = sel.focusNode;
      if (
        (anchorNode && nodeIsExcluded(anchorNode, excludeElements)) ||
        (focusNode && nodeIsExcluded(focusNode, excludeElements))
      ) {
        if (!expanded) {
          setOpen(false);
          setExpanded(false);
          setRange(null);
          setVirtualEl(null);
        }
        return;
      }

      const rect = nextRange.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        if (!expanded) {
          setOpen(false);
          setExpanded(false);
          setRange(null);
          setVirtualEl(null);
        }
        return;
      }

      const v: VirtualElement = {
        getBoundingClientRect: () => rect,
      };
      setRange(nextRange);
      setVirtualEl(v);
      setOpen(true);
      setExpanded(false);
      // Trigger update after setting v
      requestAnimationFrame(() => {
        update?.();
      });
    }, delay);
  }, [delay, excludeElements, expanded, refs.floating, update]);

  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Close on Escape and click outside
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setExpanded(false);
        resetConversation();
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (!open) return;

      const floatingEl = refs.floating.current;
      const containerEl = containerRef.current;
      const target = e.target as Node | null;

      if (!target) return;

      // Don't close if clicking inside the floating tooltip
      if (floatingEl?.contains(target)) {
        return;
      }

      // Don't close if clicking inside the container (but outside selection)
      if (containerEl?.contains(target)) {
        return;
      }

      // Click is outside both - close the tooltip
      setOpen(false);
      setExpanded(false);
      resetConversation();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, refs.floating, resetConversation]);

  // Build HTML content string for onAsk consumers
  const getSelectionHtml = React.useCallback((rangeArg: Range | null) => {
    if (!rangeArg) return "";
    const fragment = rangeArg.cloneContents();
    const div = document.createElement("div");
    div.appendChild(fragment);
    return div.innerHTML;
  }, []);

  const handleAskClick = React.useCallback(async () => {
    if (!range) return;
    const text = range.toString();
    const html = getSelectionHtml(range);
    const rect = range.getBoundingClientRect();
    const node = range.commonAncestorContainer as Node;
    const contextElement =
      node instanceof HTMLElement ? node : node.parentElement;
    const contextNode = (contextElement as HTMLElement) ?? document.body;

    setExpanded(true);
    // starting a fresh question: clear past conversation first
    resetConversation();
    if (onAsk) {
      try {
        await onAsk({ text, html, rect, range, contextNode });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("onAsk error", err);
      }
    }

    const prompt = `Can you tell me what exactly is '${text}' ? be concise`;
    try {
      await sendMessage({ text: prompt });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("sendMessage error", err);
    }
  }, [getSelectionHtml, onAsk, range, resetConversation, sendMessage]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {children}
      {open && virtualEl && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 60,
            }}
            className={
              "rounded-md border border-neutral-200 bg-white text-neutral-900 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" +
              (className ? ` ${className}` : "")
            }
          >
            {!expanded ? (
              <div className="flex items-center">
                <Button
                  type="button"
                  onClick={handleAskClick}
                  className="inline-flex items-center rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {askButtonLabel}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800">
                <a
                  href="https://www.algolia.com/developers?utm_medium=referral&utm_content=powered_by&utm_campaign=sitesearch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs opacity-70 flex items-center gap-2"
                >
                  <span className="inline-flex items-center gap-1">
                    Powered by
                  </span>
                  <AlgoliaLogo />
                </a>
                <Button
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                    resetConversation();
                  }}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="p-1.5 text-xs text-muted-foreground"
                >
                  esc
                </Button>
              </div>
            )}
            {expanded && (
              <div className="min-w-sm max-w-md">
                <div className="text-foreground p-3 max-h-[400px] overflow-y-auto text-sm">
                  {(() => {
                    const assistant = (messages || [])
                      .slice()
                      .reverse()
                      .find(
                        (m: unknown) =>
                          (m as { role?: string }).role === "assistant",
                      );
                    if (!assistant)
                      return (
                        <span className="text-muted-foreground text-xs">
                          {isGenerating ? "Thinking..." : ""}
                        </span>
                      );
                    const parts =
                      (
                        assistant as {
                          parts?: Array<
                            | string
                            | {
                                type: string;
                                text?: string;
                                state?: string;
                                input?: { query?: string };
                                output?: { query?: string; hits?: unknown[] };
                                errorText?: string;
                              }
                          >;
                        }
                      ).parts ?? [];

                    return (
                      <>
                        {parts.map((part, index) => {
                          if (typeof part === "string") {
                            return <p key={index}>{part}</p>;
                          }
                          if (part.type === "text") {
                            const html = marked.parse(part.text || "");
                            return (
                              <div
                                key={index}
                                className="prose dark:prose-invert text-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: html as string,
                                }}
                              />
                            );
                          } else if (
                            part.type === "reasoning" &&
                            part.state === "streaming"
                          ) {
                            return (
                              <p
                                key={index}
                                className="text-xs flex my-2 gap-2 items-center text-muted-foreground"
                              >
                                <BrainIcon size={14} /> Reasoning...
                              </p>
                            );
                          } else if (part.type === "tool-searchIndex") {
                            if (part.state === "input-streaming") {
                              return (
                                <p
                                  key={index}
                                  className="text-xs flex my-2 gap-2 items-center text-muted-foreground"
                                >
                                  <SearchIcon size={14} /> Searching...
                                </p>
                              );
                            } else if (part.state === "input-available") {
                              return (
                                <p
                                  key={index}
                                  className="text-sm flex my-2 gap-2 items-center text-muted-foreground"
                                >
                                  <SearchIcon size={14} /> Looking for{" "}
                                  <mark className="bg-transparent text-muted-foreground underline decoration-2 underline-offset-4">
                                    &quot;{part.input?.query || ""}&quot;
                                  </mark>
                                </p>
                              );
                            } else if (part.state === "output-available") {
                              return (
                                <p
                                  key={index}
                                  className="text-sm flex my-2 gap-2 items-center text-muted-foreground"
                                >
                                  <SearchIcon size={14} />{" "}
                                  <span>
                                    Searched for{" "}
                                    <mark className="bg-transparent text-muted-foreground underline decoration-1 underline-offset-4">
                                      &quot;{part.output?.query}&quot;
                                    </mark>{" "}
                                    found {part.output?.hits?.length || "no"}{" "}
                                    results
                                  </span>
                                </p>
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  key={index}
                                  className="text-xs flex my-2 gap-2 items-center text-muted-foreground"
                                >
                                  {part.errorText}
                                </p>
                              );
                            }
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </div>
                {error ? (
                  <div className="mt-2 text-xs max-h-[400px] prose text-wrap text-red-600 break-all opacity-80">
                    {String(
                      (error as unknown as { message?: string }).message ||
                        error,
                    )}
                  </div>
                ) : null}
                {(() => {
                  const hasAssistantResponse = (messages || []).some(
                    (m: unknown) =>
                      (m as { role?: string }).role === "assistant",
                  );
                  if (!hasAssistantResponse || isGenerating) return null;

                  const userMessage = (messages || []).find(
                    (m: unknown) => (m as { role?: string }).role === "user",
                  ) as { id?: string } | undefined;

                  return (
                    <>
                      <div className="">
                        <div className="flex items-center justify-end gap-2 mb-3 p-3 border-b border-neutral-200 dark:border-neutral-800">
                          {feedbackGiven ? (
                            <span className="text-muted-foreground text-xs animate-in fade-in slide-in-from-bottom-1">
                              Thanks for your feedback!
                            </span>
                          ) : submittingFeedback ? (
                            <span className="text-muted-foreground text-xs">
                              Submitting...
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                title="Like"
                                aria-label="Like"
                                className="border-none bg-transparent rounded-md px-2 py-1 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-accent disabled:text-foreground disabled:cursor-not-allowed"
                                disabled={submittingFeedback}
                                onClick={async () => {
                                  if (!userMessage?.id) return;
                                  try {
                                    setSubmittingFeedback(true);
                                    await postFeedback({
                                      assistantId,
                                      appId: applicationId,
                                      messageId: userMessage.id,
                                      thumbs: 1,
                                    });
                                    setFeedbackGiven(true);
                                  } catch {
                                    // ignore errors
                                  } finally {
                                    setSubmittingFeedback(false);
                                  }
                                }}
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                type="button"
                                title="Dislike"
                                aria-label="Dislike"
                                className="border-none bg-transparent rounded-md px-2 py-1 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-accent disabled:text-foreground disabled:cursor-not-allowed"
                                disabled={submittingFeedback}
                                onClick={async () => {
                                  if (!userMessage?.id) return;
                                  try {
                                    setSubmittingFeedback(true);
                                    await postFeedback({
                                      assistantId,
                                      appId: applicationId,
                                      messageId: userMessage.id,
                                      thumbs: 0,
                                    });
                                    setFeedbackGiven(true);
                                  } catch {
                                    // ignore errors
                                  } finally {
                                    setSubmittingFeedback(false);
                                  }
                                }}
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (followUpInput.trim()) {
                              sendMessage({ text: followUpInput.trim() });
                              setFollowUpInput("");
                            }
                          }}
                          className="flex items-center gap-2 p-3"
                        >
                          <Input
                            type="text"
                            value={followUpInput}
                            onChange={(e) => setFollowUpInput(e.target.value)}
                            placeholder="Ask a follow-up..."
                            className="flex-1 text-sm"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!followUpInput.trim()}
                            className="p-1.5 h-auto"
                          >
                            <CornerDownLeftIcon size={14} />
                          </Button>
                        </form>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}

export default HighlightAskAI;
