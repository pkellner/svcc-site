
import React from "react";
import SpeakersMain from "@/app/(public-site)/presenter/[year]/SpeakersMain";
import SpeakersHeader from "./SpeakersHeader";
import {FirstYearsNoData} from "@/app/(public-site)/home/FirstYearsNoData";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";
import type {Metadata} from "next";
import {eventListingMetadata, eventSentence} from "@/lib/seo";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  return eventListingMetadata(year, "Speakers", "presenter", (e) => `The speakers at ${eventSentence(e)}`);
}

export default async function Page(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  if (params.year === "2006" || params.year === "2007") {
    return <FirstYearsNoData />;
  }

  return (
    <>
      <SpeakersHeader year={params.year} />
      <SpeakersMain year={params.year} />
    </>
  );
}
