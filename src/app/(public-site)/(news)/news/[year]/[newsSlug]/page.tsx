import React from "react";
import NewsDetail from "@/app/(public-site)/(news)/news/[year]/[newsSlug]/NewsDetail";
import {getAllNewsData} from "@/lib/staticData/news/news";
import type {Metadata} from "next";
import {eventInfo, newsCard, pageMetadata, plainText} from "@/lib/seo";

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

export async function generateMetadata(props: { params: Promise<{ newsSlug: string; year: string }> }): Promise<Metadata> {
  const { year, newsSlug } = await props.params;
  const item = (await getAllNewsData()).find((n) => n.codeCampYear === year && n.titleSlug === newsSlug);
  if (!item) return {};
  const e = await eventInfo(year);
  const title = plainText(item.title, 120);
  return pageMetadata({
    title,
    description: plainText(item.description) || plainText(item.contentData) || `News from ${e?.label ?? "Silicon Valley Code Camp"}.`,
    path: `/news/${year}/${newsSlug}/`,
    image: newsCard(year, newsSlug),
    imageAlt: title,
    type: "article",
  });
}

export default async function Page(props: { params: Promise<{ newsSlug: string; year: string }> }) {
  const params = await props.params;
  return (
    // @ts-expect-error NewsDetail takes only newsUrl; year is passed through unused, as before
    <NewsDetail newsUrl={params.newsSlug} year={params.year}></NewsDetail>
  );
}
