
import "server-only";
import React from "react";
import AboutHeader from "@/app/(public-site)/about/AboutHeader";
import AboutPage from "@/app/(public-site)/about/AboutPage";
import type {Metadata} from "next";
import {HOME_CARD, pageMetadata} from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "About Silicon Valley Code Camp: who runs it, how it started in 2006, and how developers come together to learn from each other.",
  path: "/about/",
  image: HOME_CARD,
});

export default async function About() {
  return (
    <>
      {
        // @ts-expect-error AboutHeader without a year shows the latest event, as before
        <AboutHeader />
      }
      <AboutPage />
    </>
  );
}
