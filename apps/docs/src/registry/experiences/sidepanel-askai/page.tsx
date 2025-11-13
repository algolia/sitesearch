"use client";

import SidepanelExperience from "@/registry/experiences/sidepanel-askai/components/sidepanel-askai";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[100px] md:min-h-[400px] relative p-4">
      <SidepanelExperience
        applicationId="06YAZFOHSQ"
        apiKey="94b6afdc316917b6e6cdf2763fa561df"
        indexName="algolia_podcast_sample_dataset"
        assistantId="UpR727VnXnoG"
      />
    </div>
  );
}
