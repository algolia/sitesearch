# Algolia SiteSearch

Drop-in search components for modern web applications, powered by Algolia's instant search technology

<div align="center">

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Demo](https://img.shields.io/badge/Demo-Live-green)](https://stackblitz.com/~/github.com/algolia/sitesearch?file=src%2FApp.tsx)

</div>

## Overview

SiteSearch provides production-ready search components that combine Algolia's lightning-fast search capabilities with intelligent AI chat functionality. Available as both vanilla JavaScript and React implementations, it offers a complete search solution that can be integrated into any modern web application.

### Key Features

- **⚡ Instant Search** - Sub-50ms search powered by Algolia's global infrastructure
- **🤖 AI-Enhanced** - Conversational chat interface for complex queries using [Ask AI](https://www.algolia.com/products/ai/ask-ai)
- **⌨️ Keyboard-First** - Full keyboard navigation with customizable shortcuts
- **🎨 Extensible** - UI with comprehensive theming system
- **♿ Accessible** - WCAG 2.1 AA compliant with screen reader support
- **📦 Framework Agnostic** - Works with React and bundles to vanilla JS, or any framework
- **🔧 Developer Experience** - TypeScript support with comprehensive documentation

## Quick Start

### 1. Copy Component Code

Visit [StackBlitz Demo](https://stackblitz.com/~/github.com/algolia/sitesearch) or copy from the examples below:

### 2. Install Dependencies

```bash
npm install @ai-sdk/react ai algoliasearch react-instantsearch streamdown react react-dom
```

### 3. Use in Your Project

```tsx
import { SiteSearchExperience } from './components/sitesearch';

function App() {
  return (
    <SiteSearchExperience
      applicationId="YOUR_APP_ID"
      apiKey="YOUR_API_KEY"
      indexName="YOUR_INDEX_NAME"
      assistantId="YOUR_ASSISTANT_ID"
      placeholder="Search anything..."
    />
  );
}
```

That's it! No complex setup, no configuration files, no build processes.

## Available Components

### SiteSearchExperience

The main search experience component with modal, keyboard shortcuts, and AI chat.

```tsx
import { SiteSearchExperience } from './sitesearch-experience';

<SiteSearchExperience
  applicationId="latency"
  apiKey="6be0576ff61c053d5f9a3225e2a90f76"
  indexName="instant_search"
  assistantId="algolia-docs-assistant"
  placeholder="What are you looking for?"
  hitsPerPage={8}
  keyboardShortcut="cmd+k"
  buttonText="Search"
/>
```

### Individual Components

You can also use individual components for more control:

```tsx
import {
  SearchModal,
  SearchButton,
  SearchInput,
  HitsList,
  ChatWidget
} from './components';

import './sitesearch.css';
```

## Theming

All components use CSS custom properties for easy theming:

```css
.qs-exp-pop {
  --search-primary-color: #your-brand-color;
  --search-background-color: #your-bg-color;
  --search-text-color: #your-text-color;
}
```

## ⌨️ Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open search modal
- **Arrow Keys**: Navigate results
- **Enter**: Select result or trigger AI chat
- **Escape**: Close modal

## 🛠️ Development

### Copy Component Code

1. Go to [StackBlitz](https://stackblitz.com/~/github.com/algolia/sitesearch)
2. Navigate to `src/experiences/sitesearch/`
3. Copy the component files you need
4. Paste into your project

### Local Development

```bash
# Install dependencies
pnpm install

# Start demo
pnpm dev:demo

# Build all packages
pnpm build
```

### Generate JS Bundle

```bash
# Generate vanilla JS bundle for copy-paste
pnpm build:js-bundle
```

## Component API

### Individual Components

Each component can be used independently:

- **SearchModal**: Modal container with backdrop
- **SearchButton**: Trigger button with keyboard shortcut
- **SearchInput**: Enhanced search input with AI toggle
- **HitsList**: Search results with highlighting
- **ChatWidget**: AI chat interface

## Examples

### Basic Search

```tsx
import { SiteSearchExperience } from './sitesearch-experience';

<SiteSearchExperience
  applicationId="YOUR_APP_ID"
  apiKey="YOUR_SEARCH_KEY"
  indexName="your_index"
  assistantId="your_assistant_id"
/>
```

### Custom Theming

```tsx
import './custom-sitesearch.css';

<SiteSearchExperience
  applicationId="YOUR_APP_ID"
  apiKey="YOUR_SEARCH_KEY"
  indexName="your_index"
  assistantId="your_assistant_id"
  buttonText="🔍 Search"
/>
```

### Individual Components

```tsx
import { SearchButton, Modal } from './components';
import { useState } from 'react';

function CustomSearch() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SearchButton onClick={() => setIsOpen(true)}>
        Search
      </SearchButton>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* Your search content */}
      </Modal>
    </>
  );
}
```

## Configuration

### Algolia Setup

1. Create an Algolia account
2. Create an index with your data
3. Get your Application ID and API Key
4. Create an AI Assistant for chat functionality

### Required Dependencies

```json
{
  "@ai-sdk/react": "^2.0.4",
  "ai": "^5.0.30",
  "algoliasearch": "4",
  "react-instantsearch": "7.16.2",
  "streamdown": "^1.2.0",
}
```

## Contributing

1. Fork the repository
2. Add your component to `/src/experiences/`
3. Update the StackBlitz examples
4. Submit a PR

## License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Algolia** | [View on GitHub](https://github.com/algolia/instant-sitesearch) | [StackBlitz Demo](https://stackblitz.com/~/github.com/algolia/sitesearch)
