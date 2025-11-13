"use client";

import { SearchIcon, SparklesIcon } from "lucide-react";
import Search from "@/registry/experiences/search/components/search";
import SearchAskAI from "@/registry/experiences/search-askai/components/search-ai";
import SidePanel from "@/registry/experiences/sidepanel-askai/components/sidepanel-askai";

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-7xl pb-24 sm:pb-32">
      <div className="my-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Component Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <SearchIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Instant Search
              </h3>
            </div>

            {/* Interactive Demo */}
            <div className="mt-4 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 overflow-hidden">
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
          </div>

          {/* Search AI Component Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search with Ask AI
              </h3>
            </div>

            {/* Interactive Demo */}
            <div className="mt-4 rounded-xl items-center flex justify-center gap-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 overflow-hidden">
              <SearchAskAI
                applicationId="06YAZFOHSQ"
                apiKey="94b6afdc316917b6e6cdf2763fa561df"
                indexName="algolia_podcast_sample_dataset"
                assistantId="UpR727VnXnoG"
                attributes={{
                  primaryText: "title",
                  secondaryText: "description",
                  tertiaryText: "itunesAuthor",
                  url: "url",
                  image: "imageUrl",
                }}
              />
              <SidePanel
                applicationId="06YAZFOHSQ"
                apiKey="94b6afdc316917b6e6cdf2763fa561df"
                indexName="algolia_podcast_sample_dataset"
                assistantId="UpR727VnXnoG"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
