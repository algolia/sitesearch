"use client";
import { SearchWithAskAI } from "@algolia/sitesearch-react";

export function PreviewSiteSearch() {
  return (
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
  );
}
