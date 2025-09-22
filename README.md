# Algolia SiteSearch Components

> Copy-paste React components for instant search experiences, powered by Algolia. Just like shadcn/ui, but for search.

[![StackBlitz](https://img.shields.io/badge/StackBlitz-Open%20Demo-blue)](https://stackblitz.com/~/github.com/algolia/quick-search?file=src%2FApp.tsx)

## ✨ What is this?

This is a [WIP] collection of **copy-paste React components** that provide beautiful, accessible site search experiences powered by Algolia's instant search. Unlike traditional libraries, you don't install packages - you **copy the component code** and paste it into your project.

- 🎯 **Copy & Paste**: Just like shadcn/ui - copy component code, install dependencies, done
- ⚡ **Instant**: Built on Algolia's lightning-fast search API
- 🤖 **AI-Powered**: Includes conversational AI chat for complex queries
- 🎨 **Customizable**: Full CSS custom properties for easy theming
- ♿ **Accessible**: WCAG compliant with keyboard navigation
- 📱 **Responsive**: Works perfectly on all screen sizes

## 🚀 Quick Start

### 1. Copy Component Code

Visit [StackBlitz Demo](https://stackblitz.com/~/github.com/algolia/quick-search) or copy from the examples below:

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

## 📦 Available Components

### 🔍 SiteSearchExperience

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

### 🎯 Individual Components

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

## 🎨 Theming

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

1. Go to [StackBlitz](https://stackblitz.com/~/github.com/algolia/quick-search)
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

## 📚 Component API

### Individual Components

Each component can be used independently:

- **SearchModal**: Modal container with backdrop
- **SearchButton**: Trigger button with keyboard shortcut
- **SearchInput**: Enhanced search input with AI toggle
- **HitsList**: Search results with highlighting
- **ChatWidget**: AI chat interface

## 🚀 Examples

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

## 🔧 Configuration

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

## 🤝 Contributing

1. Fork the repository
2. Add your component to `/src/experiences/`
3. Update the StackBlitz examples
4. Submit a PR

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Algolia** | [View on GitHub](https://github.com/algolia/instant-sitesearch) | [StackBlitz Demo](https://stackblitz.com/~/github.com/algolia/quick-search)
