import EventHeader from "@/app/(public-site)/event/[year]/event-header";
import "server-only";
import React from "react";
import EventPage from "@/app/(public-site)/event/[year]/event-page";
import { getAllYearTokens } from "@/lib/staticData/allYearTokens";
import type {Metadata} from "next";
import {eventCard, eventInfo, eventSentence, pageMetadata} from "@/lib/seo";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  const e = await eventInfo(year);
  if (!e) return {};
  const people = e.attendees ? ` ${e.attendees.toLocaleString("en-US")} people came.` : "";
  return pageMetadata({ title: e.label, description: eventSentence(e) + people, path: `/event/${year}/`, image: eventCard(year), imageAlt: `${e.label}, ${e.date}` });
}

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
