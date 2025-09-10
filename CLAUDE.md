# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**

```bash
pnpm dev
```

**Build for production:**

```bash
pnpm build
```

**Lint code:**

```bash
pnpm lint
```

**Preview production build:**

```bash
pnpm preview
```

## Project Architecture

This is a React + TypeScript + Vite application that implements a hybrid search interface combining Algolia InstantSearch with AI-powered chat functionality.

### Core Architecture

**Search Integration:**

- Uses `algoliasearch/lite` client connected to Algolia's "instant_search" index
- Built on `react-instantsearch` with custom search box implementation
- Configured with `latency` app ID for demo purposes

**Dual-Mode Interface:**

- Toggle between traditional search results and AI chat mode
- `HitsOrChat` component manages mode switching
- Search query state shared between both modes

**AI Chat Integration:**

- `ChatWidget` uses `@ai-sdk/react` for chat functionality
- Connected to `https://askai.algolia.com/chat` endpoint via `DefaultChatTransport`
- Enter key in search box sends queries to chat when in chat mode
- Chat messages rendered with role-based styling

### Key Components

**App.tsx (main entry point):**

- `SearchBox`: Custom search input with stall detection
- `QuickSearch`: Main search interface container
- `ModeToggle`: Switch between search/chat modes
- `HitComponent`: Basic hit display (currently shows JSON)

**ChatWidget.tsx:**

- Listens for Enter key events globally
- Manages chat state with `useChat` hook
- Renders conversation with role-based bubbles

### State Management

- Search state managed by InstantSearch context
- Chat mode toggle via React state in `QuickSearch`
- Query synchronization between search box and chat widget
- Prevents duplicate chat messages with `lastSentQuery` tracking

### Styling

- CSS files: `src/App.css`
- Chat bubbles styled by role (`chat-user`, `chat-assistant`)
- Toggle button indicates active mode with dynamic classes
