"use client";
import { Sidepanel } from "@algolia/sidepanel-react";
import { Search, SearchWithAskAI } from "@algolia/sitesearch-react";
import { cn } from "@/lib/utils";
import { GridPattern } from "./ui/grid-pattern";

export function PreviewSiteSearch() {
  return (
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
      <SearchWithAskAI
        applicationId="betaHAXPMHIMMC"
        apiKey="8b00405cba281a7d800ccec393e9af24"
        indexName="algolia_podcast_sample_dataset"
        assistantId="Z03Eno3oLaXI"
        placeholder="Search for podcasts..."
        hitsPerPage={6}
        keyboardShortcut="cmd+k"
        buttonText="🎧 Search Podcasts"
      />
    </div>
  );
}

export function PreviewSearchNoAskAI() {
  return (
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
        applicationId="betaHAXPMHIMMC"
        apiKey="8b00405cba281a7d800ccec393e9af24"
        indexName="algolia_podcast_sample_dataset"
        placeholder="Search for podcasts..."
        hitsPerPage={15}
        keyboardShortcut="cmd+k"
        buttonText="🎧 Search Podcasts"
      />
    </div>
  );
}

export function PreviewSidepanel() {
  return (
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
      <Sidepanel
        config={{
          applicationId: "betaHAXPMHIMMC",
          apiKey: "8b00405cba281a7d800ccec393e9af24",
          indexName: "algolia_podcast_sample_dataset",
          assistantId: "Z03Eno3oLaXI",
        }}
        pushSelector="main"
        suggestions={[
          "What are the trending podcast episodes this week?",
          "Show me episodes about product management",
          "What is the latest episode about AI?",
          "What is the latest episode about StartUps?",
        ]}
      />
    </div>
  );
}
