import { memo, useEffect, useMemo, useRef } from "react";
import { parseMarkdownToSafeHtml } from "./utils/markdown";

interface MemoizedMarkdownProps {
  children: string;
  className?: string;
}

export const MemoizedMarkdown = memo(function MemoizedMarkdown({
  children,
  className = "",
}: MemoizedMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // HTML is produced by parseMarkdownToSafeHtml (escapes raw HTML, sanitizes URLs).
  const html = useMemo(() => parseMarkdownToSafeHtml(children), [children]); // nosemgrep

  // Handle copy button clicks
  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest(
        ".ss-markdown-copy-button",
      ) as HTMLButtonElement;

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const encodedCode = button.getAttribute("data-code");
      if (!encodedCode) return;

      try {
        const code = decodeURIComponent(encodedCode);
        await navigator.clipboard.writeText(code);

        // Show success state
        button.classList.add("ss-markdown-copied");

        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove("ss-markdown-copied");
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
      className={`ss-markdown-content ${className}`.trim()}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized via parseMarkdownToSafeHtml
      dangerouslySetInnerHTML={{ __html: html }} // nosemgrep
    />
  );
});
