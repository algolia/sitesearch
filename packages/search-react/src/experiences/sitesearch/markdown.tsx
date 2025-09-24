import { marked, type Tokens } from 'marked';
import { memo, useEffect, useMemo, useRef } from 'react';

interface MemoizedMarkdownProps {
  children: string;
  className?: string;
}

// Escape HTML special characters for safe insertion
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Create a custom renderer
const renderer = new marked.Renderer();

// Custom code block renderer with copy functionality
renderer.code = ({ text, lang = '', escaped }: Tokens.Code): string => {
  const languageClass = lang ? `language-${lang}` : '';
  const safeCode = escaped ? text : escapeHtml(text);
  const encodedCode = encodeURIComponent(text);

  const copyIconSvg = `
    <svg class="ss-markdown-copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="m5 15-4-4 4-4"></path>
    </svg>
  `;

  const checkIconSvg = `
    <svg class="ss-markdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;

  return `
    <div class="ss-markdown-code-snippet">
      <button class="ss-markdown-copy-button" data-code="${encodedCode}" aria-label="Copy code to clipboard" title="Copy code">
        ${copyIconSvg}${checkIconSvg}
        <span class="ss-markdown-copy-label">Copy</span>
      </button>
      <pre><code class="${languageClass}">${safeCode}</code></pre>
    </div>
  `;
};

// Ensure markdown links open in new tab with security attributes
renderer.link = ({ href, title, text }: Tokens.Link): string => {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  const hrefAttr = href ? escapeHtml(href) : '';
  const textContent = text || '';

  return `<a href="${hrefAttr}" target="_blank" rel="noopener noreferrer"${titleAttr}>${textContent}</a>`;
};

export const MemoizedMarkdown = memo(function MemoizedMarkdown({
  children,
  className = '',
}: MemoizedMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      return marked(children, {
        renderer,
        breaks: true,
        gfm: true,
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return escapeHtml(children);
    }
  }, [children]);

  // Handle copy button clicks
  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.ss-markdown-copy-button') as HTMLButtonElement;

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const encodedCode = button.getAttribute('data-code');
      if (!encodedCode) return;

      try {
        const code = decodeURIComponent(encodedCode);
        await navigator.clipboard.writeText(code);

        // Show success state
        button.classList.add('ss-markdown-copied');

        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove('ss-markdown-copied');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    };

    container.addEventListener('click', handleCopyClick);

    return () => {
      container.removeEventListener('click', handleCopyClick);
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`ss-markdown-content ${className}`.trim()}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: its alright :)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});