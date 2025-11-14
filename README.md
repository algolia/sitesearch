# Algolia SiteSearch

🫆 Opinionated search experiences for your search needs, powered by Algolia's [InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/js/) and [Ask AI](https://www.algolia.com/products/ai/ask-ai)

## Overview

SiteSearch provides opinionated search components that showcases Algolia's lightning-fast search capabilities in the form of experiences. Available as both React implementations and Vanilla JavaScript, it offers a complete search solution that can be integrated into any modern web application.

### Key features

- **⚡ Instant search** - Sub-50ms search powered by Algolia's global infrastructure
- **🎨 Extensible** - UI with comprehensive theming system
- **🤖 AI-enhanced** - Conversational chat interface for complex queries using [Ask AI](https://www.algolia.com/products/ai/ask-ai)
- **♿ Accessible** - WCAG 2.1 AA compliant with screen reader support & full keyboard navigation with customizable shortcuts
- **📦 Framework agnostic** - Works with React and bundles to vanilla JS to use anywhere

## Pre-requisites

1. Get an [Algolia](dashboard.algolia.com) account
2. Setup an index – grab the [Index name](https://dashboard.algolia.com/indices) and [Search API key](https://dashboard.algolia.com/account/api-keys)
3. [Optional] Create an [Ask AI assistant](https://dashboard.algolia.com/apps/ask-ai) (only if you need Ask AI)

## Quickstart

Follow the instructions in the [SiteSearch documentation](https://sitesearch.algolia.com)

## Theming

We ship SiteSearch with all the CSS needed for configuration. Use all available CSS variables and for more advanced theming needs.

Feel free to tweak SiteSearch to your convenience!

## Contributing

1. Fork this repository
2. Add your experience to `apps/docs/src/registry/experiences` for Shadcn and/or `packages/standalone` for VanillaJS
3. Submit a PR

Or start from our provisioned CodeSandBox container – [![CodeSandbox](https://img.shields.io/badge/Codesandbox-040404?style=for-the-badge&logo=codesandbox&logoColor=DBDBDB)](https://codesandbox.io/p/github/algolia/sitesearch)

## License

MIT License - see LICENSE.md file for details.
