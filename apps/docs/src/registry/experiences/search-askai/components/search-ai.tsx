/** biome-ignore-all lint/suspicious/noArrayIndexKey: . */
/** biome-ignore-all lint/a11y/useFocusableInteractive: hand crafted interactions */
/** biome-ignore-all lint/a11y/useSemanticElements: hand crafted interactions */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: hand crafted interactions */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: hand crafted interactions */
import type { UIMessage } from "@ai-sdk/react";
import type { UIDataTypes, UIMessagePart } from "ai";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  ArrowLeftIcon,
  BrainIcon,
  CheckIcon,
  CopyIcon,
  CornerDownLeftIcon,
  SearchIcon,
  SparklesIcon,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { marked, type Tokens } from "marked";
import type React from "react";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Configure,
  Highlight,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  postFeedback,
  useAskai,
  isThreadDepthError,
} from "@/registry/experiences/search-askai/hooks/use-askai";
import { useKeyboardNavigation } from "@/registry/experiences/search-askai/hooks/use-keyboard-navigation";
import { useSearchState } from "@/registry/experiences/search-askai/hooks/use-search-state";
import {
  type SuggestedQuestionHit,
  useSuggestedQuestions,
} from "@/registry/experiences/search-askai/hooks/use-suggested-questions";

// ============================================================================
// Types
// ============================================================================

export interface SearchWithAskAIConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** AI Assistant ID (required for chat functionality) */
  assistantId: string;
  /** Placeholder text for search input (optional, defaults to "What are you looking for?") */
  placeholder?: string;
  /** Number of hits per page (optional, defaults to 8) */
  hitsPerPage?: number;
  /** Custom search button text (optional) */
  buttonText?: string;
  /** Custom search button props (optional) */
  buttonProps?: React.ComponentProps<typeof SearchButton>;
  /** Map which hit attributes to render (supports dotted paths) */
  attributes: HitsAttributesMapping;
  /** Additional Algolia search parameters (optional) - e.g., analytics, filters, distinct, etc. */
  searchParameters?: Record<string, unknown>;
  /** Enable Algolia Insights (optional, defaults to true) */
  insights?: boolean;
  /** Suggested Questions Enabled (optional, defaults to false) */
  suggestedQuestionsEnabled?: boolean;
  /** Open hit URLs in a new tab (optional, defaults to true) */
  openResultsInNewTab?: boolean;
}

interface SearchButtonProps extends React.ComponentProps<typeof Button> {}

export const SearchButton: React.FC<SearchButtonProps> = ({
  className,
  ...buttonProps
}) => {
  const [modifierLabel, setModifierLabel] = useState("⌘");
  const [isModifierPressed, setIsModifierPressed] = useState(false);
  const [isKPressed, setIsKPressed] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    setModifierLabel(isMac ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) setIsModifierPressed(true);
      if (event.key.toLowerCase() === "k") setIsKPressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) setIsModifierPressed(false);
      if (event.key.toLowerCase() === "k") setIsKPressed(false);
    };
    const resetKeys = () => {
      setIsModifierPressed(false);
      setIsKPressed(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetKeys);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetKeys);
    };
  }, []);

  const baseClassName =
    "md:min-w-[200px] justify-between hover:shadow-md transition-transform duration-400 translate-y-0 py-3 h-auto cursor-pointer hover:bg-transparent hover:translate-y-[-2px] border shadow-none";

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(baseClassName, className)}
      aria-label="Open search"
      {...buttonProps}
    >
      <span className="flex items-center gap-2 opacity-80">
        <SearchIcon size={24} color="currentColor" />
        <span className="hidden sm:inline text-muted-foreground">Search</span>
      </span>
      <div className="hidden md:flex gap-0.5">
        <kbd
          className={`h-5 min-w-5 rounded grid place-items-center bg-muted text-xs text-muted-foreground transition-all duration-200 ${
            isModifierPressed
              ? "inset-shadow-sm inset-shadow-foreground/30"
              : "shadow-none"
          }`}
        >
          {modifierLabel}
        </kbd>
        <kbd
          className={`h-5 min-w-5 rounded grid place-items-center bg-muted text-xs text-muted-foreground transition-all duration-200 ${
            isKPressed
              ? "inset-shadow-sm inset-shadow-foreground/30"
              : "shadow-none"
          }`}
        >
          K
        </kbd>
      </div>
    </Button>
  );
};

export interface SearchIndexTool {
  input: {
    query: string;
  };
  output: {
    query: string;
    // biome-ignore lint/suspicious/noExplicitAny: too ambiguous
    hits: any[];
  };
}

export type Message = UIMessage<
  unknown,
  UIDataTypes,
  {
    searchIndex: SearchIndexTool;
  }
>;

export type AIMessagePart = UIMessagePart<
  UIDataTypes,
  {
    searchIndex: SearchIndexTool;
  }
>;

interface Exchange {
  id: string;
  userMessage: Message;
  assistantMessage: Message | null;
}

// ============================================================================
// Utilities & Helpers
// ============================================================================

function useClipboard() {
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently fail - clipboard access might be blocked
    }
  }, []);

  return { copyText };
}

function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================================
// Markdown Renderer
// ============================================================================

const markdownRenderer = new marked.Renderer();

markdownRenderer.code = ({ text, lang = "", escaped }: Tokens.Code): string => {
  const languageClass = lang ? `language-${lang}` : "";
  const safeCode = escaped ? text : escapeHtml(text);
  const encodedCode = encodeURIComponent(text);

  const copyIconSvg = `
    <svg class="markdown-copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="m5 15-4-4 4-4"></path>
    </svg>
  `;

  const checkIconSvg = `
    <svg class="markdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;

  return `
    <div class="markdown-code-snippet">
      <button class="markdown-copy-button" data-code="${encodedCode}" aria-label="Copy code to clipboard" title="Copy code">
        ${copyIconSvg}${checkIconSvg}
        <span class="markdown-copy-label">Copy</span>
      </button>
      <pre><code class="${languageClass}">${safeCode}</code></pre>
    </div>
  `;
};

markdownRenderer.link = ({ href, title, text }: Tokens.Link): string => {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  const hrefAttr = href ? escapeHtml(href) : "";
  const textContent = text || "";

  return `<a href="${hrefAttr}" target="_blank" rel="noopener noreferrer"${titleAttr}>${textContent}</a>`;
};

// ============================================================================
// Icon Components
// ============================================================================

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

const AlgoliaLogo = ({ size = 150 }: IconProps) => (
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

// Attribute Mapping
type HitsAttributesMapping = {
  primaryText: string;
  secondaryText?: string;
  tertiaryText?: string;
  url?: string;
  image?: string;
};

function toAttributePath(attribute: undefined): undefined;
function toAttributePath(attribute: string): string | string[];
function toAttributePath(attribute?: string): string | string[] | undefined {
  if (!attribute) return undefined;
  return attribute.includes(".") ? attribute.split(".") : attribute;
}

function getByPath<T = unknown>(obj: unknown, path?: string): T | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as T | undefined;
}

// ============================================================================
// UI Helper Components
// ============================================================================
export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className="text-neutral-600/70 dark:text-neutral-400/70 animate-shiny-text [background-size:var(--shiny-width)_100%] bg-clip-text [background-position:0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite] bg-gradient-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80"
      {...props}
    >
      {children}
    </span>
  );
};

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center md:pt-[10vh] dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background md:rounded-xl shadow-2xl w-full md:w-[90%] max-w-full md:max-w-[720px] h-full md:h-auto md:max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// Markdown Component
// ============================================================================

interface MemoizedMarkdownProps {
  children: string;
  className?: string;
}

const MemoizedMarkdown = memo(function MemoizedMarkdown({
  children,
  className = "",
}: MemoizedMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      return marked(children, {
        renderer: markdownRenderer,
        breaks: true,
        gfm: true,
      });
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return escapeHtml(children);
    }
  }, [children]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest(
        ".markdown-copy-button"
      ) as HTMLButtonElement;

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const encodedCode = button.getAttribute("data-code");
      if (!encodedCode) return;

      try {
        const code = decodeURIComponent(encodedCode);
        await navigator.clipboard.writeText(code);

        button.classList.add("markdown-copied");

        setTimeout(() => {
          button.classList.remove("markdown-copied");
        }, 2000);
      } catch (error) {
        console.error("Failed to copy code:", error);
      }
    };

    container.addEventListener("click", handleCopyClick);

    return () => {
      container.removeEventListener("click", handleCopyClick);
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`text-foreground leading-relaxed max-w-none flex flex-col
        [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:mb-2 [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
        [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:mb-2 [&_h2]:text-foreground [&_h2]:text-xl
        [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:mb-2 [&_h3]:text-foreground [&_h3]:text-lg
        [&_h4]:font-semibold [&_h4]:leading-tight [&_h4]:mb-2 [&_h4]:text-foreground [&_h4]:text-base
        [&_h5]:font-semibold [&_h5]:leading-tight [&_h5]:mb-2 [&_h5]:text-foreground [&_h5]:text-base
        [&_h6]:font-semibold [&_h6]:leading-tight [&_h6]:mb-2 [&_h6]:text-foreground [&_h6]:text-base
        [&_p]:p-0 [&_p]:my-2 [&_p:last-child]:mb-0
        [&_a]:text-blue-600 [&_a]:no-underline [&_a]:border-b [&_a]:border-transparent [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:border-blue-600 [&_a:hover]:bg-blue-50 dark:[&_a:hover]:bg-slate-900
        [&_ul]:ps-6 [&_ul]:mt-0 [&_ul]:mb-0 [&_ul]:list-disc
        [&_ol]:ps-6 [&_ol]:mt-0 [&_ol]:mb-0 [&_ol]:list-decimal
        [&_li]:mb-1 [&_li::marker]:text-muted-foreground
        [&_ul_ul]:mb-0 [&_ul_ul]:mt-1 [&_ol_ol]:mb-0 [&_ol_ol]:mt-1 [&_ul_ol]:mb-0 [&_ul_ol]:mt-1 [&_ol_ul]:mb-0 [&_ol_ul]:mt-1
        [&_code:not(.markdown-code-snippet_code)]:bg-muted [&_code:not(.markdown-code-snippet_code)]:text-foreground [&_code:not(.markdown-code-snippet_code)]:text-sm [&_code:not(.markdown-code-snippet_code)]:font-mono [&_code:not(.markdown-code-snippet_code)]:px-1 [&_code:not(.markdown-code-snippet_code)]:py-0.5 [&_code:not(.markdown-code-snippet_code)]:rounded [&_code:not(.markdown-code-snippet_code)]:border [&_code:not(.markdown-code-snippet_code)]:border-border
        [&_.markdown-code-snippet]:relative [&_.markdown-code-snippet]:my-4 [&_.markdown-code-snippet]:rounded-lg [&_.markdown-code-snippet]:overflow-hidden [&_.markdown-code-snippet]:border [&_.markdown-code-snippet]:border-border [&_.markdown-code-snippet]:bg-muted
        [&_.markdown-code-snippet_pre]:m-0 [&_.markdown-code-snippet_pre]:p-4 [&_.markdown-code-snippet_pre]:overflow-x-auto [&_.markdown-code-snippet_pre]:text-sm [&_.markdown-code-snippet_pre]:leading-normal [&_.markdown-code-snippet_pre]:font-mono [&_.markdown-code-snippet_pre]:bg-transparent
        [&_.markdown-code-snippet_code]:bg-transparent [&_.markdown-code-snippet_code]:text-foreground [&_.markdown-code-snippet_code]:p-0 [&_.markdown-code-snippet_code]:border-none
        [&_.markdown-copy-button]:absolute [&_.markdown-copy-button]:top-2 [&_.markdown-copy-button]:right-2 [&_.markdown-copy-button]:flex [&_.markdown-copy-button]:items-center [&_.markdown-copy-button]:gap-1 [&_.markdown-copy-button]:px-3 [&_.markdown-copy-button]:py-1.5 [&_.markdown-copy-button]:bg-background [&_.markdown-copy-button]:border [&_.markdown-copy-button]:border-border [&_.markdown-copy-button]:rounded-md [&_.markdown-copy-button]:text-xs [&_.markdown-copy-button]:cursor-pointer [&_.markdown-copy-button]:transition-all [&_.markdown-copy-button]:duration-200 [&_.markdown-copy-button]:text-foreground [&_.markdown-copy-button]:opacity-0 [&_.markdown-copy-button]:-translate-y-1
        [&_.markdown-code-snippet:hover_.markdown-copy-button]:opacity-100 [&_.markdown-code-snippet:hover_.markdown-copy-button]:translate-y-0
        [&_.markdown-copy-button:hover]:bg-blue-50 dark:[&_.markdown-copy-button:hover]:bg-slate-900 [&_.markdown-copy-button:hover]:shadow-sm
        [&_.markdown-copy-button_.markdown-check-icon]:hidden
        [&_.markdown-copy-button.markdown-copied_.markdown-copy-icon]:hidden
        [&_.markdown-copy-button.markdown-copied_.markdown-check-icon]:block
        [&_.markdown-copy-button.markdown-copied]:text-green-600 [&_.markdown-copy-button.markdown-copied]:border-green-600
        [&_.markdown-copy-label]:font-medium
        [&_.markdown-copied_.markdown-copy-label]:after:content-['ed']
        [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:bg-background [&_table]:my-4 [&_table]:rounded-lg [&_table]:border [&_table]:border-border [&_table]:overflow-hidden
        [&_thead]:bg-muted
        [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b-2 [&_th]:border-border
        [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-border [&_td]:text-foreground
        [&_tr:last-child_td]:border-b-0
        [&_tbody_tr:hover]:bg-blue-50 dark:[&_tbody_tr:hover]:bg-slate-900
        [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:my-4 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:bg-blue-50 [&_blockquote]:text-foreground [&_blockquote]:italic
        [&_blockquote_p]:mb-2 [&_blockquote_p:last-child]:mb-0
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_em]:italic
        [&_hr]:border-none [&_hr]:border-t [&_hr]:border-border [&_hr]:my-6
        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2
        ${className}`.trim()}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: its alright :)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

// ============================================================================
// Thread Depth Error Banner Component
// ============================================================================

interface ThreadDepthErrorBannerProps {
  onNewChat: () => void;
}

const ThreadDepthErrorBanner = ({ onNewChat }: ThreadDepthErrorBannerProps) => (
  <div className="text-gray-900 text-sm leading-normal">
    This conversation is now closed to keep responses accurate.{" "}
    <button
      type="button"
      className="text-blue-600 underline font-normal cursor-pointer bg-transparent border-none p-0 hover:text-blue-800 focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 focus:rounded-sm"
      onClick={onNewChat}
    >
      Start a new conversation
    </button>{" "}
    to continue.
  </div>
);

// ============================================================================
// Chat Component
// ============================================================================

interface ChatWidgetProps {
  messages: Message[];
  error: Error | null;
  isGenerating: boolean;
  onCopy?: (text: string) => Promise<void> | void;
  onThumbsUp?: (userMessageId: string) => Promise<void> | void;
  onThumbsDown?: (userMessageId: string) => Promise<void> | void;
  applicationId: string;
  assistantId: string;
  suggestedQuestions?: SuggestedQuestionHit[];
  onSuggestedQuestionClick?: (question: string) => void;
  onNewChat?: () => void;
}

const ChatWidget = memo(function ChatWidget({
  messages,
  error,
  isGenerating,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  applicationId,
  assistantId,
  suggestedQuestions,
  onSuggestedQuestionClick,
  onNewChat,
}: ChatWidgetProps) {
  const { copyText } = useClipboard();
  const [copiedExchangeId, setCopiedExchangeId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [acknowledgedExchangeIds, setAcknowledgedExchangeIds] = useState<
    Set<string>
  >(new Set());
  const [submittingExchangeId, setSubmittingExchangeId] = useState<
    string | null
  >(null);

  // Group messages into exchanges (user + assistant pairs)
  const exchanges = useMemo(() => {
    const grouped: Exchange[] = [];
    let skipLastUserMessage = false;

    // If there's a thread depth error, don't show the last user message
    if (isThreadDepthError(error) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        skipLastUserMessage = true;
      }
    }

    for (let i = 0; i < messages.length; i++) {
      // Skip the last user message if it caused a thread depth error
      if (skipLastUserMessage && i === messages.length - 1) {
        continue;
      }

      const current = messages[i];
      if (current.role === "user") {
        const userMessage = current as Message;
        const nextMessage = messages[i + 1];
        if (nextMessage?.role === "assistant") {
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: nextMessage as Message,
          });
          i++; // Skip the assistant message since we've already processed it
        } else {
          // No assistant yet – show a pending exchange immediately
          grouped.push({
            id: userMessage.id,
            userMessage,
            assistantMessage: null,
          });
        }
      }
    }
    return grouped;
  }, [messages, error]);

  // Cleanup any pending reset timers on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-[91vh] md:h-[50vh] p-4 bg-muted overflow-y-auto">
      <div className="flex flex-col gap-4">
        {exchanges.length === 0 ? (
          <>
            <div className="flex flex-col gap-4 py-2">
              <h2 className="text-2xl font-semibold text-foreground m-0">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground m-0">
                I search through your content to help you find answers to your
                questions, fast.
              </p>
              {suggestedQuestions && suggestedQuestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <Button
                      key={question.objectID}
                      type="button"
                      variant="outline"
                      className="cursor-pointer text-left"
                      disabled={isGenerating}
                      onClick={() => {
                        if (isGenerating) return;
                        onSuggestedQuestionClick?.(question.question);
                      }}
                    >
                      {question.question}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-sm m-0 text-muted-foreground">
              Answers are generated using AI and may make mistakes.
            </p>
          </>
        ) : (
          <p className="text-sm m-0 text-muted-foreground">
            Answers are generated using AI and may make mistakes.
          </p>
        )}
        {/* errors */}
        {error && (
          <div className="border border-red-300 bg-red-100 text-red-900 px-4 py-3 rounded-lg">
            {isThreadDepthError(error) && onNewChat ? (
              <ThreadDepthErrorBanner onNewChat={onNewChat} />
            ) : (
              error.message
            )}
          </div>
        )}

        {/* exchanges */}
        {exchanges
          .slice()
          .reverse()
          .map((exchange, index) => {
            const isLastExchange = index === 0;

            return (
              <article
                key={exchange.id}
                className="rounded-lg bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="font-semibold text-2xl text-foreground mb-2">
                    {exchange.userMessage.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <div className="flex-1 gap-3">
                    {exchange.assistantMessage ? (
                      <div className="text-foreground">
                        {exchange.assistantMessage.parts.map((part, index) => {
                          if (typeof part === "string") {
                            return <p key={`${index}`}>{part}</p>;
                          }
                          if (part.type === "text") {
                            return (
                              <MemoizedMarkdown key={`${index}`}>
                                {part.text}
                              </MemoizedMarkdown>
                            );
                          } else if (
                            part.type === "reasoning" &&
                            part.state === "streaming"
                          ) {
                            return (
                              <p
                                className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                key={`${index}`}
                              >
                                <BrainIcon />{" "}
                                <AnimatedShinyText>
                                  Reasoning...
                                </AnimatedShinyText>
                              </p>
                            );
                          } else if (part.type === "tool-searchIndex") {
                            if (part.state === "input-streaming") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                  key={`${index}`}
                                >
                                  <SearchIcon size={18} />{" "}
                                  <AnimatedShinyText>
                                    Searching...
                                  </AnimatedShinyText>
                                </p>
                              );
                            } else if (part.state === "input-available") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                  key={`${index}`}
                                >
                                  <SearchIcon size={18} />{" "}
                                  <AnimatedShinyText>
                                    Looking for{" "}
                                    <mark className="bg-transparent text-muted-foreground underline decoration-2 underline-offset-4">
                                      &quot;{part.input?.query || ""}&quot;
                                    </mark>
                                  </AnimatedShinyText>
                                </p>
                              );
                            } else if (part.state === "output-available") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                  key={`${index}`}
                                >
                                  <SearchIcon size={18} />{" "}
                                  <span>
                                    Searched for{" "}
                                    <mark className="bg-transparent text-muted-foreground underline decoration-1 underline-offset-4">
                                      &quot;{part.output?.query}&quot;
                                    </mark>{" "}
                                    found {part.output?.hits.length || "no"}{" "}
                                    results
                                  </span>
                                </p>
                              );
                            } else if (part.state === "output-error") {
                              return (
                                <p
                                  className="text-[0.95rem] flex my-2 gap-2 items-center text-muted-foreground"
                                  key={`${index}`}
                                >
                                  {part.errorText}
                                </p>
                              );
                            } else {
                              return null;
                            }
                          } else {
                            return null;
                          }
                        })}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <AnimatedShinyText>
                          {isGenerating && isLastExchange ? "Thinking..." : ""}
                        </AnimatedShinyText>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  {exchange.assistantMessage && !isGenerating ? (
                    acknowledgedExchangeIds.has(exchange.id) ? (
                      <span className="text-muted-foreground text-[0.85rem] animate-in fade-in slide-in-from-bottom-1">
                        Thanks for your feedback!
                      </span>
                    ) : submittingExchangeId === exchange.id ? (
                      <span className="text-muted-foreground text-[0.85rem] shimmer-text">
                        Submitting...
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          title="Like"
                          aria-label="Like"
                          className="border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed"
                          disabled={
                            !exchange.assistantMessage ||
                            submittingExchangeId === exchange.id
                          }
                          onClick={async () => {
                            if (!exchange.assistantMessage) return;
                            try {
                              setSubmittingExchangeId(exchange.id);
                              if (onThumbsUp) {
                                await onThumbsUp(exchange.userMessage.id);
                              } else {
                                await postFeedback({
                                  assistantId,
                                  appId: applicationId,
                                  messageId: exchange.userMessage.id,
                                  thumbs: 1,
                                });
                              }
                              setAcknowledgedExchangeIds((prev) => {
                                const next = new Set(prev);
                                next.add(exchange.id);
                                return next;
                              });
                            } catch {
                              // ignore errors
                            } finally {
                              setSubmittingExchangeId(null);
                            }
                          }}
                        >
                          <ThumbsUp size={18} />
                        </button>
                        <button
                          type="button"
                          title="Dislike"
                          aria-label="Dislike"
                          className="border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed"
                          disabled={
                            !exchange.assistantMessage ||
                            submittingExchangeId === exchange.id
                          }
                          onClick={async () => {
                            if (!exchange.assistantMessage) return;
                            try {
                              setSubmittingExchangeId(exchange.id);
                              if (onThumbsDown) {
                                await onThumbsDown(exchange.userMessage.id);
                              } else {
                                await postFeedback({
                                  assistantId,
                                  appId: applicationId,
                                  messageId: exchange.userMessage.id,
                                  thumbs: 0,
                                });
                              }
                              setAcknowledgedExchangeIds((prev) => {
                                const next = new Set(prev);
                                next.add(exchange.id);
                                return next;
                              });
                            } catch {
                              // ignore errors
                            } finally {
                              setSubmittingExchangeId(null);
                            }
                          }}
                        >
                          <ThumbsDown size={18} />
                        </button>
                      </div>
                    )
                  ) : null}
                  <button
                    type="button"
                    className={`border-none bg-transparent rounded-md px-2.5 py-1.5 text-muted-foreground cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-50 dark:hover:bg-slate-900 disabled:text-foreground disabled:cursor-not-allowed ${
                      copiedExchangeId === exchange.id
                        ? "bg-blue-50 dark:bg-slate-900 text-blue-600 -translate-y-px"
                        : ""
                    }`}
                    aria-label={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    title={
                      copiedExchangeId === exchange.id
                        ? "Copied"
                        : "Copy answer"
                    }
                    disabled={
                      !exchange.assistantMessage ||
                      copiedExchangeId === exchange.id
                    }
                    onClick={async () => {
                      const parts = exchange.assistantMessage?.parts ?? [];
                      const textContent = parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")
                        .trim();
                      if (!textContent) return;
                      try {
                        if (onCopy) {
                          await onCopy(textContent);
                        } else {
                          await copyText(textContent);
                        }
                        setCopiedExchangeId(exchange.id);
                        if (copyResetTimeoutRef.current) {
                          window.clearTimeout(copyResetTimeoutRef.current);
                        }
                        copyResetTimeoutRef.current = window.setTimeout(() => {
                          setCopiedExchangeId(null);
                        }, 1500);
                      } catch {
                        // noop – copy may fail silently
                      }
                    }}
                  >
                    {copiedExchangeId === exchange.id ? (
                      <CheckIcon size={18} />
                    ) : (
                      <CopyIcon size={18} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
});

// ============================================================================
// Hits List Component
// ============================================================================

interface HitsActionsProps {
  query: string;
  isSelected: boolean;
  onAskAI: () => void;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
}

const HitsActions = memo(function HitsActions({
  query,
  isSelected,
  onAskAI,
  onHoverIndex,
  hoverEnabled,
}: HitsActionsProps) {
  return (
    <div className="list-none p-0 m-0 animate-in fade-in-0 slide-in-from-top-1">
      <article
        onClick={onAskAI}
        className="my-1 p-3 rounded-lg bg-background flex items-center gap-4 cursor-pointer select-none whitespace-nowrap transition-all duration-150 hover:bg-blue-50 hover:shadow-lg hover:-translate-y-px aria-selected:bg-blue-50 aria-selected:shadow-lg aria-selected:-translate-y-px dark:hover:bg-slate-900 dark:aria-selected:bg-slate-900"
        aria-label="Ask AI"
        title="Ask AI"
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: hand crafted
        role="option"
        aria-selected={isSelected}
        onMouseEnter={() => {
          if (!hoverEnabled) return;
          onHoverIndex?.(0);
        }}
        onMouseMove={() => {
          if (!hoverEnabled) return;
          onHoverIndex?.(0);
        }}
      >
        <SparklesIcon strokeWidth={1.5} size={20} />
        <p className="text-base text-foreground m-0 font-normal">
          Ask AI:{" "}
          <span className="text-blue-600 bg-transparent underline decoration-1 underline-offset-4 aria-selected:text-blue-600 aria-selected:bg-transparent aria-selected:underline aria-selected:decoration-1 aria-selected:underline-offset-4">
            &quot;{query}&quot;
          </span>
        </p>
      </article>
    </div>
  );
});

interface HitsListProps {
  hits: any[];
  query: string;
  selectedIndex: number;
  onAskAI: () => void;
  attributes: HitsAttributesMapping;
  onHoverIndex?: (index: number) => void;
  hoverEnabled?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
  openResultsInNewTab?: boolean;
}

const HitsList = memo(function HitsList({
  hits,
  query,
  selectedIndex,
  onAskAI,
  attributes,
  onHoverIndex,
  hoverEnabled,
  sendEvent,
  openResultsInNewTab = true,
}: HitsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const mapping = useMemo(
    () => ({
      primaryText: attributes.primaryText,
      secondaryText: attributes.secondaryText,
      tertiaryText: attributes.tertiaryText,
      url: attributes.url,
      image: attributes.image,
    }),
    [attributes]
  );

  if (!attributes || !mapping.primaryText) {
    throw new Error("At least a primaryText is required to display results");
  }

  return (
    <>
      <HitsActions
        query={query}
        isSelected={selectedIndex === 0}
        onAskAI={onAskAI}
        onHoverIndex={onHoverIndex}
        hoverEnabled={hoverEnabled}
      />
      <p className="text-muted-foreground text-sm mt-4 mb-2">Results</p>
      {hits.map((hit: any, idx: number) => {
        const isSel = selectedIndex === idx + 1;
        const primaryVal = getByPath<string>(hit, mapping.primaryText);
        const imageUrl = getByPath<string>(hit, mapping.image);
        const url = getByPath<string>(hit, mapping.url);
        const hasImage = Boolean(imageUrl);
        const isImageFailed = failedImages[hit.objectID] || !hasImage;
        return (
          <a
            key={hit.objectID}
            href={url ?? "#"}
            target={openResultsInNewTab && url ? "_blank" : undefined}
            rel={openResultsInNewTab && url ? "noopener noreferrer" : undefined}
            className={`my-1 p-4 rounded-lg bg-background gap-4 cursor-pointer no-underline text-foreground transition-all duration-150 block hover:bg-blue-50 hover:border-border hover:shadow-lg hover:-translate-y-px aria-selected:bg-blue-50 aria-selected:border-border aria-selected:shadow-lg aria-selected:-translate-y-px dark:hover:bg-slate-900 dark:aria-selected:bg-slate-900 animate-in fade-in-0 zoom-in-95 ${
              hasImage ? "flex flex-row items-center gap-4" : ""
            }`}
            role="option"
            aria-selected={isSel}
            onClick={() => {
              sendEvent?.("click", hit, "Hit Clicked");
            }}
            onMouseEnter={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx + 1);
            }}
            onMouseMove={() => {
              if (!hoverEnabled) return;
              onHoverIndex?.(idx + 1);
            }}
          >
            {hasImage ? (
              <div className="w-[100px] h-[100px] self-start flex-[0_0_100px] items-center justify-center overflow-hidden rounded-sm bg-muted">
                {!isImageFailed ? (
                  <img
                    src={imageUrl as string}
                    alt={primaryVal || ""}
                    className="w-full h-full object-contain rounded-sm"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [hit.objectID]: true,
                      }))
                    }
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-full h-full text-muted-foreground"
                    aria-hidden="true"
                  >
                    <SearchIcon />
                  </div>
                )}
              </div>
            ) : null}
            <div>
              <p className="text-base text-foreground m-0 mb-2 font-normal [&_mark]:text-blue-600 [&_mark]:bg-transparent [&_mark]:underline [&_mark]:decoration-1 [&_mark]:underline-offset-4 aria-selected:text-blue-600 aria-selected:bg-transparent aria-selected:underline aria-selected:decoration-1 aria-selected:underline-offset-4">
                <Highlight
                  attribute={toAttributePath(mapping.primaryText as string)}
                  hit={hit}
                />
              </p>
              {mapping.secondaryText ? (
                <p className="text-sm mt-2 text-muted-foreground">
                  {getByPath<string>(hit, mapping.secondaryText)}
                </p>
              ) : null}
              {mapping.tertiaryText ? (
                <p className="text-sm text-muted-foreground mt-2">
                  {getByPath<string>(hit, mapping.tertiaryText)}
                </p>
              ) : null}
            </div>
          </a>
        );
      })}
    </>
  );
});

// ============================================================================
// Search Input Component
// ============================================================================

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  showChat: boolean;
  isGenerating?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  setShowChat: (show: boolean) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: (value: string) => boolean;
  onNewChat?: () => void;
}

const SearchLeftButton = memo(function SearchLeftButton({
  showChat,
  setShowChat,
}: {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}) {
  if (showChat) {
    return (
      <button
        type="button"
        onClick={() => setShowChat(false)}
        className="cursor-pointer p-2 rounded-full flex items-center justify-center text-foreground transition-colors hover:text-blue-600"
        aria-label="Back to search"
        title="Back to search"
      >
        <ArrowLeftIcon strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      className="p-2 rounded-full flex items-center justify-center text-muted-foreground has-[+input:focus]:text-blue-600"
      aria-label="Search"
      title="Search"
    >
      <SearchIcon strokeWidth={1.5} />
    </div>
  );
});

const SearchInput = memo(function SearchInput(props: SearchInputProps) {
  const { status } = useInstantSearch();
  const { query, refine } = useSearchBox();
  const [chatInput, setChatInput] = useState("");

  const isSearchStalled = status === "stalled";

  function setQuery(newQuery: string) {
    if (props.showChat) {
      setChatInput(newQuery);
    } else {
      refine(newQuery);
    }
  }

  // Clear the input when entering chat mode
  useEffect(() => {
    if (props.showChat) {
      setChatInput("");
    }
  }, [props.showChat]);

  const placeholder = props.isGenerating
    ? "Answering..."
    : props.showChat
    ? "Ask AI anything about Algolia"
    : props.placeholder;

  const currentValue = props.showChat ? chatInput : query || "";

  return (
    <search
      className="flex flex-row items-center bg-background border-b border-border rounded-t-lg p-2"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onReset={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setQuery("");
        if (props.inputRef.current) {
          props.inputRef.current.focus();
        }
      }}
    >
      <SearchLeftButton
        showChat={props.showChat}
        setShowChat={props.setShowChat}
      />
      <input
        ref={props.inputRef}
        className="peer w-full outline-none bg-transparent border-none text-foreground text-xl font-light placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={placeholder}
        spellCheck={false}
        maxLength={512}
        type="search"
        value={currentValue}
        disabled={props.isGenerating}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (props.isGenerating) {
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            props.onArrowDown?.();
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            props.onArrowUp?.();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const valueAtEnter = props.showChat ? chatInput : query || "";
            if (props.onEnter?.(valueAtEnter)) {
              if (props.showChat) {
                setChatInput("");
              } else {
                setQuery("");
              }
              return;
            }
            const trimmed = valueAtEnter.trim();
            if (trimmed) {
              props.setShowChat(true);
            }
          }
        }}
        // biome-ignore lint/a11y/noAutofocus: expected
        autoFocus
      />
      <div className="flex items-center gap-2 ml-auto">
        <Button
          type="reset"
          variant="ghost"
          className="px-2 text-muted-foreground"
          hidden={!currentValue || currentValue.length === 0 || isSearchStalled}
          onClick={() => {
            setQuery("");
            if (props.inputRef.current) {
              props.inputRef.current.focus();
            }
          }}
        >
          Clear
        </Button>
        {props.showChat ? (
          <Button
            type="button"
            variant="ghost"
            disabled={props.isGenerating}
            onClick={() => {
              setChatInput("");
              props.onNewChat?.();
            }}
          >
            <SquarePen size={18} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="px-2 text-muted-foreground"
          onClick={props.onClose}
        >
          esc
        </Button>
      </div>
    </search>
  );
});

// ============================================================================
// No Results Component
// ============================================================================

interface NoResultsProps {
  query: string;
  onAskAI: () => void;
  onClear: () => void;
}

const NoResults = memo(function NoResults({
  query,
  onAskAI,
  onClear,
}: NoResultsProps) {
  return (
    <div className="flex flex-col items-center text-center justify-center gap-2 bg-muted p-8 h-[50vh] text-foreground">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-900 text-muted-foreground">
        <SearchIcon size={22} />
      </div>
      <p className="m-0 font-normal text-base">
        No results for &quot;{query}&quot;
      </p>
      <p className="m-0 text-muted-foreground text-sm">
        Try a different query or ask AI to help.
      </p>
      <div className="inline-flex gap-4 mt-4">
        <Button className="" onClick={onAskAI}>
          <CornerDownLeftIcon size={20}></CornerDownLeftIcon>
          Ask AI
        </Button>
        <Button variant="ghost" className="" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
});

// ============================================================================
// Results Panel Component
// ============================================================================

interface ResultsPanelProps {
  showChat: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setShowChat: (showChat: boolean) => void;
  query: string;
  selectedIndex: number;
  refine: (query: string) => void;
  config: SearchWithAskAIConfig;
  messages: unknown[];
  error: Error | null;
  isGenerating: boolean;
  sendMessage: (options: { text: string }) => void | Promise<void>;
  onHoverIndex?: (index: number) => void;
  scrollOnSelectionChange?: boolean;
  sendEvent?: (eventType: "click", hit: any, eventName: string) => void;
  suggestedQuestions?: SuggestedQuestionHit[];
  onNewChat?: () => void;
}

const ResultsPanel = memo(function ResultsPanel({
  showChat,
  inputRef,
  setShowChat,
  query,
  selectedIndex,
  refine,
  config,
  messages,
  error,
  isGenerating,
  sendMessage,
  onHoverIndex,
  scrollOnSelectionChange = true,
  sendEvent,
  suggestedQuestions,
  onNewChat,
}: ResultsPanelProps) {
  const { items } = useHits();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  // Enable hover selection only after the user moves the pointer inside the list
  useEffect(() => {
    if (showChat) return;
    const container = containerRef.current;
    if (!container) return;
    setHoverEnabled(false);
    const enable = () => setHoverEnabled(true);
    container.addEventListener("pointermove", enable, { once: true } as any);
    return () => {
      container.removeEventListener("pointermove", enable as any);
    };
  }, [showChat]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    if (showChat || !scrollOnSelectionChange) return;
    const container = containerRef.current;
    if (!container) return;
    const selectedEl = container.querySelector(
      '[aria-selected="true"]'
    ) as HTMLElement | null;
    if (!selectedEl) return;

    const padding = 8;
    const cRect = container.getBoundingClientRect();
    const iRect = selectedEl.getBoundingClientRect();

    if (iRect.top < cRect.top + padding) {
      container.scrollTop -= cRect.top + padding - iRect.top;
    } else if (iRect.bottom > cRect.bottom - padding) {
      container.scrollTop += iRect.bottom - (cRect.bottom - padding);
    }
  }, [selectedIndex, showChat, items.length, scrollOnSelectionChange]);

  const lastSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showChat) return;
    const trimmed = (query ?? "").trim();
    if (!trimmed) return;
    if (lastSentRef.current === trimmed) return;
    refine("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
    sendMessage({ text: trimmed });
    lastSentRef.current = trimmed;
  }, [showChat, query, inputRef, sendMessage, refine]);

  useEffect(() => {
    if ((messages as Message[]).length === 0) {
      lastSentRef.current = null;
    }
  }, [messages]);

  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isGenerating) {
        return;
      }
      sendMessage({ text: trimmed });
    },
    [sendMessage, isGenerating]
  );

  if (showChat) {
    return (
      <ChatWidget
        messages={messages as unknown as Message[]}
        error={error as Error | null}
        isGenerating={isGenerating}
        applicationId={config.applicationId}
        assistantId={config.assistantId}
        suggestedQuestions={suggestedQuestions}
        onSuggestedQuestionClick={handleSuggestedQuestionClick}
        onNewChat={onNewChat}
      />
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col h-[91vh] md:h-[50vh] bg-muted p-4 overflow-y-auto"
        role="listbox"
      >
        <HitsList
          hits={items as unknown[]}
          query={query}
          selectedIndex={selectedIndex}
          onAskAI={() => setShowChat(true)}
          attributes={config.attributes}
          onHoverIndex={onHoverIndex}
          hoverEnabled={hoverEnabled}
          sendEvent={sendEvent}
          openResultsInNewTab={config.openResultsInNewTab}
        />
      </div>
    </>
  );
});

// ============================================================================
// Search Box Component
// ============================================================================

interface SearchBoxProps {
  query?: string;
  className?: string;
  placeholder?: string;
  showChat: boolean;
  isGenerating?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  refine: (query: string) => void;
  setShowChat: (show: boolean) => void;
  onClose?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: (value: string) => boolean;
  onNewChat?: () => void;
}

const SearchBox = memo(function SearchBox(props: SearchBoxProps) {
  return (
    <SearchInput
      className={props.className}
      placeholder={props.placeholder}
      showChat={props.showChat}
      isGenerating={props.isGenerating}
      inputRef={props.inputRef}
      setShowChat={props.setShowChat}
      onClose={props.onClose || (() => {})}
      onArrowDown={props.onArrowDown}
      onArrowUp={props.onArrowUp}
      onEnter={props.onEnter}
      onNewChat={props.onNewChat}
    />
  );
});

// ============================================================================
// Footer Component
// ============================================================================

const Footer = memo(function Footer({ showChat }: { showChat: boolean }) {
  const basePoweredByUrl =
    "https://www.algolia.com/developers?utm_medium=referral&utm_content=powered_by&utm_campaign=sitesearch";
  const poweredByHref =
    typeof window !== "undefined"
      ? `${basePoweredByUrl}&utm_source=${encodeURIComponent(
          window.location.hostname
        )}`
      : basePoweredByUrl;
  return (
    <div className="flex items-center justify-between bg-background rounded-b-lg border-t border-border p-4">
      <div className="inline-flex items-center gap-4 text-foreground text-sm">
        <div className="flex items-center gap-2 text-sm font-light text-muted-foreground">
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-0.5 font-mono text-base text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m6.8 13l2.9 2.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T3.426 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7L6.8 11H19V8q0-.425.288-.712T20 7t.713.288T21 8v3q0 .825-.587 1.413T19 13z"
              />
            </svg>
          </kbd>
          <span>{showChat ? "Ask question" : "Open"}</span>
        </div>

        <div className="flex items-center gap-2 text-sm font-light text-muted-foreground">
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-0.5 font-mono text-base text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m11 7.825l-4.9 4.9q-.3.3-.7.288t-.7-.313q-.275-.3-.288-.7t.288-.7l6.6-6.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l6.6 6.6q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3L13 7.825V19q0 .425-.288.713T12 20t-.712-.288T11 19z"
              />
            </svg>
          </kbd>
          <kbd className="bg-muted rounded-sm h-6 flex items-center justify-center p-0.5 font-mono text-base text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M11 16.175V5q0-.425.288-.712T12 4t.713.288T13 5v11.175l4.9-4.9q.3-.3.7-.288t.7.313q.275.3.287.7t-.287.7l-6.6 6.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213l-6.6-6.6q-.275-.275-.275-.687T4.7 11.3q.3-.3.713-.3t.712.3z"
              />
            </svg>
          </kbd>
          <span>Navigate</span>
        </div>
      </div>
      <div className="inline-flex">
        {/* 🚧 DO NOT REMOVE the logo if you are on a Free plan
         * https://support.algolia.com/hc/en-us/articles/17226079853073-Is-displaying-the-Algolia-logo-required
         */}
        <a
          className="inline-flex items-center gap-2 text-muted-foreground text-sm no-underline transition-colors hover:text-blue-600"
          href={poweredByHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="md:block hidden">Powered by </span>
          <AlgoliaLogo />
        </a>
      </div>
    </div>
  );
});

// ============================================================================
// Search Modal (Inner Content)
// ============================================================================

interface SearchModalProps {
  onClose?: () => void;
  config: SearchWithAskAIConfig;
}

function SearchModal({ onClose, config }: SearchModalProps) {
  const { query, refine } = useSearchBox();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useInstantSearch();
  const { items, sendEvent } = useHits();
  const { showChat, setShowChat, handleShowChat } = useSearchState();

  // Track the message count when a thread depth error occurred
  const [threadDepthErrorAtMessageCount, setThreadDepthErrorAtMessageCount] =
    useState<number | null>(null);

  const { messages, setMessages, error, isGenerating, sendMessage, status } =
    useAskai({
      applicationId: config.applicationId,
      apiKey: config.apiKey,
      indexName: config.indexName,
      assistantId: config.assistantId,
    });

  // Monitor for thread depth errors (AI-217)
  useEffect(() => {
    const err = error as Error & { code?: string };
    if (
      status === "error" &&
      (err?.code === "AI-217" || error?.message?.includes("AI-217"))
    ) {
      // Only record if we have an assistant message (real conversation)
      messages.some((m) => m.role === "assistant") &&
        setThreadDepthErrorAtMessageCount(messages.length);
    } else if (
      status !== "error" &&
      threadDepthErrorAtMessageCount &&
      messages.length < threadDepthErrorAtMessageCount
    ) {
      setThreadDepthErrorAtMessageCount(null);
    }
  }, [status, error, messages, threadDepthErrorAtMessageCount]);

  const suggestedQuestionsClient = useMemo(() => {
    const client = algoliasearch(config.applicationId, config.apiKey);
    client.addAlgoliaAgent("algolia-sitesearch");
    return client;
  }, [config.applicationId, config.apiKey]);

  const suggestedQuestions = useSuggestedQuestions({
    searchClient: suggestedQuestionsClient,
    assistantId: config.assistantId,
    suggestedQuestionsEnabled: config.suggestedQuestionsEnabled ?? false,
    isOpen: showChat,
  });

  const noResults = results.results?.nbHits === 0;
  const {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  } = useKeyboardNavigation(showChat, items, query, config.openResultsInNewTab ?? true);

  const handleActivateSelection = useCallback((): boolean => {
    // Send click event for keyboard navigation before activating
    if (selectedIndex > 0) {
      const hit = items[selectedIndex - 1];
      if (hit) {
        sendEvent?.("click", hit, "Hit Clicked");
      }
    }

    if (activateSelection()) {
      if (selectedIndex === 0) {
        handleShowChat(true);
      }
      return true;
    }
    return false;
  }, [activateSelection, selectedIndex, handleShowChat, items, sendEvent]);

  const showResultsPanel = (!noResults && !!query) || showChat;

  const handleNewChat = useCallback(() => {
    // Clear messages to start a fresh conversation
    setMessages([]);
    setThreadDepthErrorAtMessageCount(null);
    setShowChat(true);
    refine("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [setMessages, setShowChat, refine]);

  return (
    <>
      <Configure
        hitsPerPage={config.hitsPerPage || 8}
        {...(config.searchParameters || {})}
      />
      <div className="flex flex-col">
        <SearchBox
          query={query}
          placeholder={config.placeholder || "What are you looking for?"}
          refine={refine}
          showChat={showChat}
          isGenerating={isGenerating}
          setShowChat={setShowChat}
          onClose={onClose}
          onArrowDown={moveDown}
          onArrowUp={moveUp}
          onEnter={(value) => {
            const trimmed = (value ?? "").trim();
            if (showChat && trimmed) {
              refine(trimmed);
              return true;
            }
            return handleActivateSelection();
          }}
          inputRef={inputRef}
          onNewChat={handleNewChat}
        />
        {showResultsPanel && (
          <ResultsPanel
            showChat={showChat}
            inputRef={inputRef}
            setShowChat={(v) => {
              setShowChat(v);
            }}
            query={query}
            selectedIndex={selectedIndex}
            refine={refine}
            config={config}
            messages={messages as unknown[]}
            error={error as Error | null}
            isGenerating={isGenerating}
            sendMessage={sendMessage}
            onHoverIndex={hoverIndex}
            scrollOnSelectionChange={selectionOrigin !== "pointer"}
            sendEvent={sendEvent}
            suggestedQuestions={suggestedQuestions}
            onNewChat={handleNewChat}
          />
        )}
        {noResults && query && !showChat && (
          <NoResults
            query={query}
            onAskAI={() => {
              setShowChat(true);
            }}
            onClear={() => {
              refine("");
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        )}
      </div>
      <Footer showChat={showChat} />
    </>
  );
}

// ============================================================================
// Main Export Component
// ============================================================================

export default function SearchExperience(config: SearchWithAskAIConfig) {
  const searchClient = useMemo(() => {
    const client = algoliasearch(config.applicationId, config.apiKey);
    client.addAlgoliaAgent("algolia-sitesearch");
    return client;
  }, [config.applicationId, config.apiKey]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const buttonProps = {
    ...config.buttonProps,
    onClick: openModal,
  };

  return (
    <>
      <SearchButton {...buttonProps}>{config.buttonText}</SearchButton>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <InstantSearch
          searchClient={searchClient}
          indexName={config.indexName}
          future={{ preserveSharedStateOnUnmount: true }}
          insights={config.insights ?? true}
        >
          <SearchModal onClose={closeModal} config={config} />
        </InstantSearch>
      </Modal>
    </>
  );
}
