import React from "react";
import NewsDetail from "@/app/(public-site)/(news)/news/[year]/[newsSlug]/NewsDetail";
import {getAllNewsData} from "@/lib/staticData/news/news";

export async function generateStaticParams() {
  const news = await getAllNewsData();
  const seen = new Set<string>();
  const params: { year: string; newsSlug: string }[] = [];
  for (const item of news) {
    const key = `${item.codeCampYear}/${item.titleSlug}`;
    if (item.titleSlug && !seen.has(key)) {
      seen.add(key);
      params.push({ year: item.codeCampYear, newsSlug: item.titleSlug });
    }
  }
  return params;
}
export const dynamicParams = false;

export default async function Page(props: { params: Promise<{ newsSlug: string; year: string }> }) {
  const params = await props.params;
  return (
    // @ts-expect-error NewsDetail takes only newsUrl; year is passed through unused, as before
    <NewsDetail newsUrl={params.newsSlug} year={params.year}></NewsDetail>
  );
}
