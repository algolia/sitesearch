import { describe, expect, it } from "bun:test";
import { parseMarkdownToSafeHtml } from "../markdown";

describe("parseMarkdownToSafeHtml", () => {
  it("escapes raw HTML so event handlers cannot run", () => {
    const html = parseMarkdownToSafeHtml("<img src=x onerror=alert(1)>");
    expect(html).not.toMatch(/<img\b/i);
    expect(html).toContain("&lt;img");
    expect(html).toBe("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes inline script tags", () => {
    const html = parseMarkdownToSafeHtml("a <script>alert(1)</script> b");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not emit javascript: links", () => {
    const html = parseMarkdownToSafeHtml(`[click](javascript${":"}alert(1))`);
    expect(html).not.toContain(`javascript${":"}`);
    expect(html).not.toContain("<a ");
    expect(html).toContain("click");
  });

  it("does not emit javascript: images", () => {
    const html = parseMarkdownToSafeHtml(`![x](javascript${":"}alert(1))`);
    expect(html).not.toContain(`javascript${":"}`);
    expect(html).not.toContain("<img");
  });

  it("keeps safe markdown links and formatting", () => {
    const html = parseMarkdownToSafeHtml(
      "See [SiteSearch](https://www.algolia.com) and **bold**",
    );
    expect(html).toContain('href="https://www.algolia.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("<strong>bold</strong>");
  });

  it("still renders fenced code blocks with escaped content", () => {
    const html = parseMarkdownToSafeHtml('```js\nconst x = "<script>"\n```');
    expect(html).toContain("ss-markdown-code-snippet");
    expect(html).toContain("language-js");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not allow HTML breakout via fenced-code lang", () => {
    const html = parseMarkdownToSafeHtml(
      '```"><img src=x onerror=alert(1)>\nx\n```',
    );
    expect(html).not.toMatch(/<img\b/i);
    expect(html).not.toContain("onerror=alert");
    expect(html).not.toContain('language-">');
  });
});
