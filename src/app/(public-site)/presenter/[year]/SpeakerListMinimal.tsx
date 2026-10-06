"use client";

import React, {useState} from "react";
import {Speaker} from "@/app/common/CodeCampInterfaces";
import SpeakerListData from "@/app/(public-site)/presenter/[year]/SpeakerListData";

export default function SpeakerListMinimal({ speakers, year }: { speakers: Speaker[]; year: string }) {
  const [query, setQuery] = useState("");
  const shown = speakers.slice(0, parseInt(process.env.NEXT_PUBLIC_UI_SPEAKERS_TO_SHOW ?? "999"));

  return (
    <div>
      <div className="rd-spk-tools">
        <div className="rd-section-title" style={{ margin: 0 }}>
          <h2 className="rd-h2">Speakers</h2>
          <span className="rd-chip rd-chip--y">{shown.length} speakers</span>
        </div>
        <div className="rd-spk-search">
          <i className="fa fa-search" aria-hidden="true" />
          <input
            onChange={(e) => {
              return setQuery(e.target.value);
            }}
            type="text"
            className="rd-input"
            placeholder="Search for a name or company"
            aria-label="Search for a name or company"
          />
        </div>
      </div>
      <SpeakerListData query={query} speakers={shown} hasErrored={false} loading={false} year={year} />
    </div>
  );
}
