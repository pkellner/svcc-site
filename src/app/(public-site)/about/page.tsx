
import "server-only";
import React from "react";
import AboutHeader from "@/app/(public-site)/about/AboutHeader";
import AboutPage from "@/app/(public-site)/about/AboutPage";

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
