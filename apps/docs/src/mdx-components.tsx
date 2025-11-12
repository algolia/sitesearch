import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  PreviewDropdownSearch,
  PreviewSearchNoAskAI,
  PreviewSidepanelAskAI,
  PreviewSiteSearch,
} from "@/components/previews";

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    PreviewSiteSearch,
    PreviewSearchNoAskAI,
    PreviewDropdownSearch,
    PreviewSidepanelAskAI,
    ...components,
  };
}
