import React from "react";
import Link from "next/link";
import {News} from "@/app/common/CodeCampInterfaces";
import {getAllNewsData} from "@/lib/staticData/news/news";
import {sanitizeNewsHtml} from "@/lib/sanitize";
import {withBasePathIfSiteRelative} from "@/lib/basePath";

export default async function NewsDetail({ newsUrl }: { newsUrl: string }) {
  const news = await getAllNewsData();

  const createMarkup: (rawHtml: string) => { __html: string } = (rawHtml) => ({
    __html: rawHtml,
  });

  const newsOneArray = news.filter(function (rec: News) {
    return rec.titleSlug === newsUrl;
  });
  if (newsOneArray && newsOneArray.length === 1) {
    const newsItem = newsOneArray[0];

    const contentData = newsItem.contentData?.replaceAll("http://", "https://") ?? "";

    let descr = newsItem?.description;
    if (descr.length < 5) {
      descr = "...";
    }

    return (
      <>
        <section className="rd-band rd-band--y rd-dots rd-pagehead">
          <i className="rd-deco rd-deco--a" aria-hidden="true" />
          <i className="rd-deco rd-deco--b" aria-hidden="true" />
          <div className="rd-wrap">
            <ul className="rd-nae-chips">
              <li>
                <span className="rd-chip rd-chip--paper">News</span>
              </li>
              <li>
                <span className="rd-chip rd-chip--ink">{newsItem.postDateString}</span>
              </li>
            </ul>
            <h1 className="rd-h1">{newsItem.title}</h1>
            <p className="rd-sub rd-mono">By {newsItem.authors}</p>
            <p className="rd-nae-back">
              <Link className="rd-btn rd-btn--sm" href="/news">
                <span aria-hidden="true">&larr;</span> back to all news
              </Link>
            </p>
          </div>
        </section>

        <section className="rd-nae-body">
          <div className="rd-wrap">
            <article className="rd-card rd-news-detail">
              <div className="rd-news-lead" dangerouslySetInnerHTML={createMarkup(sanitizeNewsHtml(descr))} />

              <div className="rd-prose" dangerouslySetInnerHTML={createMarkup(sanitizeNewsHtml(contentData))} />

              {newsItem.pictureUrl ? (
                <div className="rd-news-figure">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, basePath applied by hand */}
                  <img src={withBasePathIfSiteRelative(newsItem.pictureUrl)} alt="news detail" />
                </div>
              ) : null}
            </article>
          </div>
        </section>
      </>
    );
  } else {
    return (
      <section className="rd-band rd-band--y rd-dots rd-pagehead">
        <div className="rd-wrap">
          <h1 className="rd-h1">News item not found</h1>
          <p className="rd-sub">ERROR: can not find {newsUrl}</p>
        </div>
      </section>
    );
  }
}
