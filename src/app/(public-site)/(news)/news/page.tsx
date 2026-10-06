import React from "react";
import NewsList from "@/app/(public-site)/(news)/news/NewsList";
import NewsHeader from "@/app/(public-site)/(news)/news/NewsHeader";

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
