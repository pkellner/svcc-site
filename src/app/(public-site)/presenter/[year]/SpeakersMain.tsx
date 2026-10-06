import "server-only";
import React from "react";
import SpeakerListMinimal from "./SpeakerListMinimal";
import {getUniquePresenters} from "@/lib/staticData/speakers/speakersUtils";

export default async function SpeakersMain({ year }: { year: string }) {
  const speakers = await getUniquePresenters(year);

  return (
    <section className="rd-band rd-band--tight">
      <div className="rd-wrap">
        <SpeakerListMinimal speakers={speakers} year={year} />
      </div>
    </section>
  );
}
