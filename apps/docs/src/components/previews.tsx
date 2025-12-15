"use client";

import { cn } from "@/lib/utils";
import DropdownSearch from "@/registry/experiences/dropdown-search/components/dropdown-search";
import { HighlightAskAI } from "@/registry/experiences/highlight-to-askai/components/highlight-to-askai";
import Search from "@/registry/experiences/search/components/search";
import SearchWithAskAi from "@/registry/experiences/search-askai/components/search-ai";
import SidepanelExperience from "@/registry/experiences/sidepanel-askai/components/sidepanel-askai";
import { CopyCodeButton } from "./copy-code-button";
import { OpenInV0Button } from "./open-in-v0";
import { GridPattern } from "./ui/grid-pattern";

export function PreviewSiteSearch() {
  return (
    <>
      <div className="flex justify-between items-center mb-2 ">
        <div>
          <CopyCodeButton
            code={`npx shadcn@latest add @algolia/search-ai`}
            title="Copy install command"
          ></CopyCodeButton>
        </div>
        <div>
          <OpenInV0Button name="search-ai"></OpenInV0Button>
        </div>
      </div>
      <div className="bg-background relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg border p-20">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <SearchWithAskAi
          applicationId="06YAZFOHSQ"
          apiKey="94b6afdc316917b6e6cdf2763fa561df"
          indexName="algolia_podcast_sample_dataset"
          assistantId="UpR727VnXnoG"
          placeholder="Search for podcasts..."
          hitsPerPage={6}
          buttonText="🎧 Search Podcasts"
          suggestedQuestionsEnabled={true}
          attributes={{
            primaryText: "title",
            secondaryText: "description",
            tertiaryText: "itunesAuthor",
            url: "url",
            image: "imageUrl",
          }}
        />
      </div>
    </>
  );
}

export function PreviewSearchNoAskAI() {
  return (
    <>
      <div className="flex justify-between items-center mb-2 ">
        <div>
          <CopyCodeButton
            code={`npx shadcn@latest add @algolia/search`}
            title="Copy install command"
          ></CopyCodeButton>
        </div>
        <div>
          <OpenInV0Button name="search"></OpenInV0Button>
        </div>
      </div>
      <div className="bg-background relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg border p-20">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <Search
          applicationId="06YAZFOHSQ"
          apiKey="94b6afdc316917b6e6cdf2763fa561df"
          indexName="algolia_podcast_sample_dataset"
          placeholder="Search for podcasts..."
          hitsPerPage={15}
          buttonText="🎧 Search Podcasts"
          attributes={{
            primaryText: "title",
            secondaryText: "description",
            tertiaryText: "itunesAuthor",
            image: "imageUrl",
            url: "url",
          }}
        />
      </div>
    </>
  );
}

export function PreviewHighlightToAskAI() {
  return (
    <>
      <div className="flex justify-between items-center mb-2 ">
        <div>
          <CopyCodeButton
            code={`npx shadcn@latest add @algolia/highlight-to-askai`}
            title="Copy install command"
          ></CopyCodeButton>
        </div>
        <div>
          <OpenInV0Button name="highlight-to-askai"></OpenInV0Button>
        </div>
      </div>
      <div className="bg-background relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg border p-20">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <div className=" ">
          <HighlightAskAI
            excludeElements={["pre", "code"]}
            applicationId="06YAZFOHSQ"
            apiKey="94b6afdc316917b6e6cdf2763fa561df"
            indexName="algolia_podcast_sample_dataset"
            assistantId="UpR727VnXnoG"
            askAiBaseUrl="https://askai.algolia.com"
            side="top"
            sideOffset={8}
          >
            <article className="prose dark:prose-invert">
              <h3>Try it</h3>
              <p>
                Select any text in this block to see a small tooltip. Click
                <em> Ask AI?</em> to expand the panel. We'll wire streaming
                later.
              </p>
              <p>
                The tooltip respects excluded elements like <code>pre</code> and
                <code>code</code>, and it uses smart placement to avoid viewport
                edges.
              </p>
            </article>
          </HighlightAskAI>
          <p className="mt-2 text-right text-xs opacity-60">
            Tip: Try selecting a sentence across multiple lines.
          </p>
        </div>
      </div>
    </>
  );
}

export function PreviewDropdownSearch() {
  return (
    <>
      <div className="flex justify-between items-center mb-2 ">
        <div>
          <CopyCodeButton
            code={`npx shadcn@latest add @algolia/dropdown-search`}
            title="Copy install command"
          ></CopyCodeButton>
        </div>
        <div>
          <OpenInV0Button name="dropdown-search"></OpenInV0Button>
        </div>
      </div>
      <div className="bg-background relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg border p-20">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <div className="w-full max-w-md">
          <DropdownSearch
            applicationId="06YAZFOHSQ"
            apiKey="94b6afdc316917b6e6cdf2763fa561df"
            indexName="algolia_podcast_sample_dataset"
            placeholder="Search podcasts..."
            hitsPerPage={5}
            attributes={{
              primaryText: "title",
              secondaryText: "description",
              tertiaryText: "itunesAuthor",
              image: "imageUrl",
              url: "url",
            }}
          />
        </div>
      </div>
    </>
  );
}

export function PreviewSidepanelAskAI() {
  return (
    <>
      <div className="flex justify-between items-center mb-2 ">
        <div>
          <CopyCodeButton
            code={`npx shadcn@latest add @algolia/sidepanel-askai`}
            title="Copy install command"
          ></CopyCodeButton>
        </div>
        <div>
          <OpenInV0Button name="sidepanel-askai"></OpenInV0Button>
        </div>
      </div>
      <div className="bg-background relative flex h-[400px] items-center justify-center overflow-hidden rounded-lg border p-20">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <div className="flex gap-4">
          <SidepanelExperience
            applicationId="06YAZFOHSQ"
            apiKey="94b6afdc316917b6e6cdf2763fa561df"
            indexName="algolia_podcast_sample_dataset"
            assistantId="UpR727VnXnoG"
            buttonText="Ask AI (floating)"
            variant="floating"
            suggestedQuestionsEnabled={true}
          />
          <SidepanelExperience
            applicationId="06YAZFOHSQ"
            apiKey="94b6afdc316917b6e6cdf2763fa561df"
            indexName="algolia_podcast_sample_dataset"
            assistantId="UpR727VnXnoG"
            buttonText="Ask AI (inline)"
            variant="inline"
            suggestedQuestionsEnabled={true}
          />
        </div>
      </div>
    </>
  );
}
