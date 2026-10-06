import "server-only";
import React from "react";
import AboutHeader from "@/app/(public-site)/about/AboutHeader";
import AboutPage from "@/app/(public-site)/about/AboutPage";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export default async function About(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  return (
    <>
      <AboutHeader year={params.year} />
      <AboutPage />
    </>
  );
}
