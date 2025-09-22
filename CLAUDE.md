# Algolia Instant Site Search

A powerful, customizable search widget for websites that combines Algolia's instant search capabilities with AI-powered chat functionality. This monorepo provides both vanilla JavaScript and React implementations.

## 🚀 Features

- **Instant Search**: Powered by Algolia's lightning-fast search API
- **AI Chat Integration**: Ask AI feature for complex queries and conversational search
- **Keyboard Navigation**: Full keyboard support with customizable shortcuts (default: Cmd+K)
- **Modal Interface**: Clean, accessible search modal with modern UI
- **Multiple Experiences**: Flexible architecture supporting different search experiences
- **TypeScript Support**: Full type safety and excellent developer experience
- **Customizable**: Extensive configuration options for styling and behavior

## 📦 Packages

### `@algolia/sitesearch` (Vanilla JavaScript)

- **Purpose**: Drop-in vanilla JavaScript search widget
- **Technology**: Uses Preact under the hood for performance
- **Bundle Size**: Optimized for minimal footprint
- **Usage**: Simple API with global `SiteSearch` constructor

### `@algolia/sitesearch-react` (React)

- **Purpose**: React components and hooks for search functionality
- **Technology**: Built with React and React InstantSearch
- **Features**: Full component library including SearchModal, SearchButton, ChatWidget
- **Usage**: Use individual components or the complete SearchExperience

## 🏗️ Architecture

```
quick-search/
├── packages/
│   ├── search-js/           # Vanilla JS implementation
│   │   └── src/index.ts     # Main SiteSearch class
│   └── search-react/        # React implementation
│       └── src/experiences/sitesearch/
│           ├── index.tsx    # Main SearchExperience component
│           ├── search-modal.tsx
│           ├── search-input.tsx
│           ├── hits-list.tsx
│           ├── chat.tsx      # AI chat functionality
│           └── useSearchState.ts
└── apps/demo/               # Demo application
```

## 🛠️ Installation

### Using React Components

```bash
npm install @algolia/sitesearch-react react react-dom
```

### Using Vanilla JavaScript

```bash
npm install @algolia/sitesearch
```

## 🚀 Quick Start

### React Implementation

```tsx
import { SearchExperience } from '@algolia/sitesearch-react';

function App() {
  return (
    <SearchExperience
      applicationId="YOUR_APP_ID"
      apiKey="YOUR_API_KEY"
      indexName="YOUR_INDEX_NAME"
      assistantId="YOUR_ASSISTANT_ID"
      placeholder="Search your site..."
    />
  );
}
```

### Vanilla JavaScript Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
</head>
<body>
  <div id="search-container"></div>

  <script src="https://cdn.jsdelivr.net/npm/@algolia/sitesearch/dist/sitesearch.min.js"></script>
  <script>
    SiteSearch.init({
      container: '#search-container',
      applicationId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      indexName: 'YOUR_INDEX_NAME',
      assistantId: 'YOUR_ASSISTANT_ID'
    });
  </script>
</body>
</html>
```

## ⚙️ Configuration

### Required Parameters

- `applicationId`: Your Algolia Application ID
- `apiKey`: Your Algolia API Key (search-only key recommended)
- `indexName`: The Algolia index to search
- `assistantId`: AI Assistant ID for chat functionality

### Optional Parameters

- `placeholder`: Search input placeholder text (default: "What are you looking for?")
- `hitsPerPage`: Number of results per page (default: 8)
- `keyboardShortcut`: Keyboard shortcut to open search (default: "cmd+k")
- `buttonText`: Custom search button text
- `buttonProps`: Additional props for the search button
- `baseAskaiUrl`: Custom AI chat API endpoint

## 🎯 Key Components

### SearchExperience

Main component that orchestrates the entire search experience including the button, modal, and all interactions.

### SearchModal

The modal container that houses the search interface with backdrop and accessibility features.

### SearchInput

Enhanced search input with AI chat toggle, keyboard navigation, and query management.

### HitsList

Displays search results with highlighting, selection states, and keyboard navigation.

### ChatWidget

AI-powered chat interface for conversational search when direct results aren't sufficient.

### SearchButton

Trigger button that opens the search modal with customizable styling and behavior.

## ⌨️ Keyboard Navigation

- **Cmd+K** (or custom shortcut): Open search modal
- **Arrow Up/Down**: Navigate through search results
- **Enter**: Select highlighted result or trigger AI chat
- **Escape**: Close modal or clear search

## 🎨 Styling

The component comes with a complete CSS implementation that's:

- **Responsive**: Works on all screen sizes
- **Accessible**: WCAG compliant with proper focus management
- **Customizable**: CSS custom properties for easy theming
- **Dark Mode Ready**: Supports dark/light theme switching

## 🏗️ Build System

### Development

```bash
pnpm dev          # Start all packages in development mode
pnpm dev:demo     # Start demo application
```

### Building

```bash
pnpm build        # Build all packages
pnpm build:demo   # Build demo application
```

### Tech Stack

- **Monorepo**: Turborepo for efficient builds and caching
- **Bundler**: Rolldown for fast, optimized bundles
- **Language**: TypeScript for type safety
- **React**: React 18+ with hooks and modern patterns
- **CSS**: PostCSS with autoprefixer and CSS modules
- **Testing**: ESLint for code quality

## 🔧 Development

### Project Structure

- `/packages/search-js`: Vanilla JavaScript implementation
- `/packages/search-react`: React components and experiences
- `/apps/demo`: Demo application showcasing usage
- `/turbo.json`: Turborepo configuration
- `/pnpm-workspace.yaml`: Package workspace configuration

### Adding New Features

1. Components go in `/packages/search-react/src/experiences/sitesearch/`
2. Export new components in `/packages/search-react/src/index.ts`
3. Add types to appropriate `.d.ts` files
4. Update build configs if needed

### Testing

```bash
pnpm test         # Run tests across all packages
pnpm lint         # Lint code for style and errors
```

## 📝 API Reference

### SiteSearch Static Methods (Vanilla JS)

- `SiteSearch.init(options)`: Initialize search widget
- `SiteSearch.destroy(container)`: Remove search widget instance
- `SiteSearch.destroyAll()`: Remove all search widget instances

### SearchExperience Props (React)

- `applicationId: string` - Required Algolia app ID
- `apiKey: string` - Required Algolia API key
- `indexName: string` - Required index name
- `assistantId: string` - Required for AI chat
- `baseAskaiUrl?: string` - Optional AI API endpoint
- `placeholder?: string` - Search input placeholder
- `hitsPerPage?: number` - Results per page
- `keyboardShortcut?: string` - Keyboard shortcut
- `buttonText?: string` - Button label
- `buttonProps?: object` - Additional button props

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:

- Check the GitHub issues
- Review the Algolia documentation
- Visit the demo application for examples

---

*Built with ❤️ using Algolia's powerful search platform and modern web technologies.*
