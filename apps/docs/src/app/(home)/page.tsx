"use client";

import Link from "fumadocs-core/link";
import { ArrowRightIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { WordRotate } from "@/components/ui/word-rotate";
import Search from "@/registry/experiences/search/components/search";
import SearchAskAI from "@/registry/experiences/search-askai/components/search-ai";

export default function HomePage() {
  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 dark:from-indigo-500 dark:to-sky-500 dark:opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
        />
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-balance text-gray-900 sm:text-4xl lg:text-6xl dark:text-white font-sora">
              <WordRotate
                className="text-[#003dff] dark:text-indigo-400"
                words={[
                  "Modern",
                  "Lightning-fast",
                  "Vanilla",
                  "Conversational",
                  "Keyboard-first",
                  "Extensible",
                  "Accessible",
                  "Framework-agnostic",
                  "Developer-first",
                  "Enterprise-grade",
                  "Intuitive",
                  "Powerful",
                  "Production-ready",
                  "Beautiful",
                  "AI-Native",
                  "Customizable",
                  "Developer-first",
                  "Enterprise-grade",
                  "Intuitive",
                  "Powerful",
                ]}
              />{" "}
              search component library
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 font-sora dark:text-gray-400 max-w-2xl mx-auto">
              The ultimate{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                search experience resource.
              </span>{" "}
              Essential UI components, advanced patterns, and{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                AI integrations
              </span>
              . From buttons to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                AI chat interfaces
              </span>{" "}
              - everything you need to build{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                modern search experiences
              </span>
              .
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Link
                href="/docs/experiences/search"
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
              >
                Browse components
              </Link>
              <Link
                href="/docs/"
                className="rounded-lg px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Learn more
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              Community-driven registry powered by Algolia
            </p>
          </div>
        </div>

        {/* Components Showcase Section */}
        <div className="mx-auto max-w-7xl pb-24 sm:pb-32">
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Production-ready search components
                </h2>
                <p className="mt-2 text-lg max-w-2xl text-gray-600 dark:text-gray-400">
                  Our search components are designed to be fully composable so
                  you can build, customize and extend them to your own needs.
                </p>
              </div>
              <Link
                href="/docs"
                className="hidden lg:flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Explore components
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Component Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Component Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <SearchIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Instant Search
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Lightning-fast search with real-time results and keyboard
                    navigation
                  </p>
                </div>
              </div>

              {/* Interactive Demo */}
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 overflow-hidden">
                <Search
                  applicationId="06YAZFOHSQ"
                  apiKey="94b6afdc316917b6e6cdf2763fa561df"
                  indexName="algolia_podcast_sample_dataset"
                  attributes={{
                    primaryText: "title",
                    secondaryText: "description",
                    tertiaryText: "itunesAuthor",
                    url: "url",
                    image: "imageUrl",
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/docs/experiences/search"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  View details
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Search AI Component Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Search with Ask AI
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    AI-powered conversational search with natural language
                    understanding
                  </p>
                </div>
              </div>

              {/* Interactive Demo */}
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 overflow-hidden">
                <SearchAskAI
                  applicationId="06YAZFOHSQ"
                  apiKey="94b6afdc316917b6e6cdf2763fa561df"
                  indexName="algolia_podcast_sample_dataset"
                  assistantId="UpR727VnXnoG"
                  attributes={{
                    primaryText: "title",
                    secondaryText: "description",
                    tertiaryText: "title",
                    url: "url",
                    image: "imageUrl",
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/docs/experiences/search-askai"
                  className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-1"
                >
                  View details
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-8 lg:hidden flex justify-center">
            <Link
              href="/docs"
              className="flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Explore components
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          <div className="flex-wrap">
            <p>Built with 💙 by Algolia.</p>{" "}
            {/* GitHub Discussions CTA Section */}
            <div className="mx-auto max-w-7xl">
              <div className="text-center">
                <p>
                  Looking for a specific experience but don't see it?{" "}
                  <Link
                    href="https://github.com/algolia/sitesearch/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
                  >
                    Let us know on GitHub Discussions
                  </Link>
                </p>
              </div>
            </div>
            <p className="flex mt-2 items-center justify-center gap-2">
              Sourced on
              <a
                href="https://github.com/algolia/sitesearch"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white"
                  alt="View on GitHub"
                  className="h-5"
                />
              </a>
              <span>& Edit in</span>
              <a
                href="https://codesandbox.io/p/github/algolia/sitesearch"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://img.shields.io/badge/Codesandbox-040404?style=for-the-badge&logo=codesandbox&logoColor=DBDBDB"
                  alt="Edit in CodeSandbox"
                  className="h-5"
                />
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
