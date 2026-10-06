
import React from "react";

import {FirstYearsNoData} from "@/app/(public-site)/home/FirstYearsNoData";
import {getSponsorsData} from "@/lib/staticData/sponsors/sponsorsUtils";
import SponsorPage from "@/app/(public-site)/sponsor/[year]/SponsorPage";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  const sponsors = await getSponsorsData(year);
  return eventListingMetadata(year, "Sponsors", "sponsor", (e) =>
    sponsors.length ? `The ${sponsors.length} sponsors who made ${e.label}, ${e.date}, possible.` : `The sponsors who made ${e.label}, ${e.date}, possible.`,
  );
}
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {eventListingMetadata} from "@/lib/seo";

export default async function PageSponsor(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  const sponsorsData = await getSponsorsData(params.year);

  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, params.year);
  if (!ccy) {
    notFound();
  }
  const ccyName = getCodeCampNameWithDate(ccy);

  if (params.year === "2006" || params.year === "2007") {
    return <FirstYearsNoData />;
  }

  return (
    <>
      <SponsorPage year={params.year} sponsorsList={sponsorsData} ccyName={ccyName} />
    </>
  );
}
