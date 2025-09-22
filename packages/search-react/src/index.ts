// Export sitesearch experience
export { default as SiteSearchExperience } from "./experiences/sitesearch/index";
export type { SearchExperienceConfig } from "./experiences/sitesearch/index";

// Export individual components from sitesearch experience
export { SearchModal } from "./experiences/sitesearch/index";
export { SearchButton } from "./experiences/sitesearch/search-button";
export { Modal } from "./experiences/sitesearch/search-modal";
export { SearchInput } from "./experiences/sitesearch/search-input";
export { HitsList } from "./experiences/sitesearch/hits-list";
export { ChatWidget } from "./experiences/sitesearch/chat";
export { MemoizedMarkdown } from "./experiences/sitesearch/markdown";

// Export utilities and hooks
export { useSearchState } from "./experiences/sitesearch/useSearchState";
export { useKeyboardNavigation } from "./experiences/sitesearch/useKeyboardNavigation";

// Export icons
export * from "./experiences/sitesearch/icons";
