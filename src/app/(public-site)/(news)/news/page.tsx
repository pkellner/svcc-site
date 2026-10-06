import React from "react";
import NewsList from "@/app/(public-site)/(news)/news/NewsList";
import NewsHeader from "@/app/(public-site)/(news)/news/NewsHeader";
import type {Metadata} from "next";
import {HOME_CARD, pageMetadata} from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "News",
  description: "Announcements, recaps and updates from every Silicon Valley Code Camp and Code Campfire, newest first.",
  path: "/news/",
  image: HOME_CARD,
});

export default async function Page() {
  return (
    <>
      <NewsHeader />
      <section className="rd-nae-body">
        <div className="rd-wrap">
          <NewsList />
        </div>
      </section>
    </>
  );
}
