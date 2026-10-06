import EventHeader from "@/app/(public-site)/event/[year]/event-header";
import "server-only";
import React from "react";
import EventPage from "@/app/(public-site)/event/[year]/event-page";
import { getAllYearTokens } from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export default async function Event(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  //const {year} = await getCurrentCodeCampYear();
  const year = params?.year;
  return (
    <>
      <EventHeader year={year} />
      <EventPage year={year} />
    </>
  );
}
