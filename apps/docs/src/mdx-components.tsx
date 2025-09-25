import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { PreviewSidepanel } from "@/components/PreviewSidepanel";
import { PreviewSiteSearch } from "@/components/PreviewSiteSearch";

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    PreviewSiteSearch,
    PreviewSidepanel,
    ...components,
  };
}
