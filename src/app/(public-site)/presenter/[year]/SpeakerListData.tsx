"use client";

import React from "react";
import {Speaker} from "@/app/common/CodeCampInterfaces";
import SpeakerListItem from "./SpeakerListItem";

export default function SpeakerListData({
  speakers,
  query,
  hasErrored,
  year,
}: {
  speakers: Speaker[];
  query: string;
  hasErrored: boolean;
  loading: boolean;
  year: string;
}) {
  const queryString = query.toLocaleLowerCase();
  const compareSearchString = (val: Speaker) => {
    const str = `${val?.userFirstName ?? ""} ${val?.userLastName ?? ""} ${val?.company ?? ""}`;
    return str.toLowerCase().includes(queryString.trim());
  };

  if (hasErrored) {
    return <div className="rd-card rd-card--flat">Error Returned From Loading Speaker Data</div>;
  }

  const filterSpeakers = (val: Speaker) => {
    return compareSearchString(val);
  };
  return (
    <ul className="rd-grid rd-spk-grid">
      {speakers.filter(filterSpeakers).map((speaker) => (
        <SpeakerListItem speaker={speaker} key={speaker.id} year={year} />
      ))}
    </ul>
  );
}
