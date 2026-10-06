import "server-only";
import React from "react";
import AboutHeader from "@/app/(public-site)/about/AboutHeader";
import AboutPage from "@/app/(public-site)/about/AboutPage";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";
import type {Metadata} from "next";
import {eventListingMetadata} from "@/lib/seo";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  return eventListingMetadata(year, "About", "about", (e) => `About ${e.label}, ${e.date}: who runs Silicon Valley Code Camp and how developers come together to learn from each other.`);
}

export default async function About(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  return (
    <>
      <AboutHeader year={params.year} />
      <AboutPage />
    </>
  );
}
