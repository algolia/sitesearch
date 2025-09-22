export interface SiteSearchConfig {
  /** Algolia Application ID (required) */
  applicationId: string;
  /** Algolia API Key (required) */
  apiKey: string;
  /** Algolia Index Name (required) */
  indexName: string;
  /** AI Assistant ID (required for chat functionality) */
  assistantId: string;
  /** Base URL for AI chat API (optional, defaults to beta endpoint) */
  baseAskaiUrl?: string;
  /** Placeholder text for search input (optional, defaults to "What are you looking for?") */
  placeholder?: string;
  /** Number of hits per page (optional, defaults to 8) */
  hitsPerPage?: number;
  /** Keyboard shortcut to open search (optional, defaults to "cmd+k") */
  keyboardShortcut?: string;
  /** Custom search button text (optional) */
  buttonText?: string;
  /** Custom search button props (optional) */
  buttonProps?: any;
}

export interface SiteSearchInitOptions extends SiteSearchConfig {
  /** Container selector or DOM element where to mount the search button */
  container: string | HTMLElement;
}