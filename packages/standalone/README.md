# @algolia/sitesearch

Opinionated site search modal for the web. Ships zero-build CDN bundles (JS + CSS) and a one-line init API. Powered by Algolia InstantSearch.

## Features

- Modal search UI with keyboard shortcut (Cmd/Ctrl+K)
- Infinite hits list with highlighted matches and optional images
- Clean light/dark themes with CSS variables
- Zero-build usage via unpkg CDN (script + link tag)
- Optional Ask AI mode that streams AI answers with inline search tool feedback

## Quickstart (CDN / no build)

Add CSS + JS from unpkg, then initialize.

```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/@algolia/sitesearch@1/dist/search.min.css" />

<!-- JS (UMD exposes window.SiteSearch) -->
<script src="https://unpkg.com/@algolia/sitesearch@1/dist/search.min.js"></script>

<div id="search-root"></div>

<script>
  // Minimal config – replace with your own Algolia credentials
  window.SiteSearch.init({
    container: '#search-root',
    applicationId: 'ALGOLIA_APP_ID',
    apiKey: 'ALGOLIA_SEARCH_API_KEY',
    indexName: 'YOUR_INDEX_NAME',
    // Optional UX tweaks
    placeholder: 'What are you looking for?',
    hitsPerPage: 8,
    keyboardShortcut: 'cmd+k', // or 'ctrl+k', 'alt+k', etc.
    darkMode: undefined, // true, false, or leave it empty
    attributes: {
      primaryText: 'title', // required primary text
      secondaryText: 'description', // optional secondary text
      tertiaryText: "itunesAuthor", // optional tertiary text
      url: "url" // optional url attribute
      image: 'image', // optional URL attribute
    },
    // Optional: Transform items before rendering (e.g., proxy images)
    transformItems: (items) => 
      items.map(item => ({
        ...item,
        image: item.image ? `https://your-proxy.com/${item.image}` : item.image
      }))
  });
</script>
```

## Theming

The widgets use CSS variables. Override them globally or within a wrapper.

```css
/* Light (default) */
.ss-exp, .modal-backdrop, .sitesearch-button {
  --search-primary-color: #003dff;
  --search-background-color: #f5f5fa;
  --search-text-color: #23263b;
  /* ...more variables... */
}

/* Dark: either pass darkMode: true or add .dark to <html> */
.ss-exp.dark, .modal-backdrop.dark, .sitesearch-button.dark {
  --search-primary-color: #7aa2ff;
  --search-background-color: #202127;
  --search-text-color: #e5e7eb;
}
```

Key variables include:

- `--search-primary-color`
- `--search-background-color`
- `--search-neutral-color`
- `--search-border-color`
- `--search-input-font-size`
- `--search-results-max-height`

Tip: The components auto-detect dark mode if `html.dark` is present or if the OS prefers dark, unless `darkMode` is explicitly set.

## Transform Items

The `transformItems` option allows you to modify search results before they are rendered. This is useful for:

- **Proxying images** – Work around CORS issues or use a CDN
- **Formatting data** – Transform dates, prices, or other fields

## Accessibility & Keyboard

- Open: Cmd/Ctrl+K (configurable via `keyboardShortcut`)
- Navigate: Up/Down
- Close: Escape or close button
- Focus styles and `aria-selected` states are included out of the box

## License

MIT

## References

- unpkg CDN docs: `https://unpkg.com/`
