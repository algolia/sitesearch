import { marked, type Tokens } from "marked";
import { escapeHtml, sanitizeUrl } from "./sanitize";

/** Replace unpaired UTF-16 surrogates (common in crawled index text). */
function replaceUnpairedSurrogates(value: string): string {
  return value.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    "\uFFFD",
  );
}

function toMarkdownString(value: unknown): string {
  if (typeof value !== "string") return "";
  return replaceUnpairedSurrogates(value);
}

function safeEncodeURIComponent(value: string): string {
  const sanitized = replaceUnpairedSurrogates(value);
  try {
    return encodeURIComponent(sanitized);
  } catch {
    return "";
  }
}

const renderer = new marked.Renderer();

renderer.code = ({ text, lang = "", escaped }: Tokens.Code): string => {
  const safeLang = /^[a-zA-Z0-9_-]+$/.test(lang) ? lang : "";
  const languageClass = safeLang ? `language-${safeLang}` : "";
  const safeCode = escaped ? text : escapeHtml(text);
  const encodedCode = safeEncodeURIComponent(text);

  const copyIconSvg = [
    '<svg class="ss-markdown-copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>',
    '<path d="m5 15-4-4 4-4"></path>',
    "</svg>",
  ].join("");

  const checkIconSvg = [
    '<svg class="ss-markdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<polyline points="20,6 9,17 4,12"></polyline>',
    "</svg>",
  ].join("");

  // Values interpolated below are escaped / allowlisted (encodedCode, languageClass, safeCode).
  // nosemgrep: javascript.lang.security.audit.raw-html-format
  return [
    '<div class="ss-markdown-code-snippet">',
    `<button class="ss-markdown-copy-button" data-code="${encodedCode}" aria-label="Copy code to clipboard" title="Copy code">`,
    copyIconSvg,
    checkIconSvg,
    '<span class="ss-markdown-copy-label">Copy</span>',
    "</button>",
    `<pre><code class="${languageClass}">${safeCode}</code></pre>`,
    "</div>",
  ].join("");
};

renderer.link = ({ href, title, text }: Tokens.Link): string => {
  const safeHref = escapeHtml(sanitizeUrl(href));
  const textEscaped = escapeHtml(text);

  if (!safeHref) {
    return textEscaped;
  }

  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  // href/text/title are sanitized + escaped above.
  // nosemgrep: javascript.lang.security.audit.raw-html-format
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${textEscaped}</a>`;
};

renderer.image = ({ href, title, text }: Tokens.Image): string => {
  const safeHref = escapeHtml(sanitizeUrl(href));
  if (!safeHref) {
    return escapeHtml(text);
  }

  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  // src/alt/title are sanitized + escaped above.
  // nosemgrep: javascript.lang.security.audit.raw-html-format
  return `<img src="${safeHref}" alt="${escapeHtml(text)}"${titleAttr} />`;
};

renderer.html = ({ text }: Tokens.HTML | Tokens.Tag): string =>
  escapeHtml(text);

/** Parses markdown into HTML safe for `dangerouslySetInnerHTML`. */
export function parseMarkdownToSafeHtml(content: string): string {
  const source = toMarkdownString(content);
  try {
    return marked.parse(source, {
      gfm: true,
      breaks: true,
      renderer,
    }) as string;
  } catch (error) {
    console.error("Error parsing markdown:", error);
    return escapeHtml(source);
  }
}
