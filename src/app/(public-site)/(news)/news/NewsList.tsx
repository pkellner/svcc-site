import React from "react";
import Link from "next/link";
import {getAllNewsData} from "@/lib/staticData/news/news";
import {sanitizeNewsHtml} from "@/lib/sanitize";
import {withBasePathIfSiteRelative} from "@/lib/basePath";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- all news is shown regardless of year (see below)
export default async function NewsList({ year }: { year?: string }) {
  const newsData = await getAllNewsData();
  const createMarkup: (rawHtml: string) => { __html: string } = (rawHtml) => ({
    __html: rawHtml,
  });

  const list =
    newsData === undefined
      ? []
      : newsData
          // ALWAYS SHOW ALL NEWS REGARDLESS OF WHETHER A YEAR IS SELECTED
          // .filter((item: any) => {
          //   return year ? year === item.codeCampYear : true;
          // })
          .map((item) => {
            const pictureUrl = item.pictureUrl?.replace("none", "");

            const youTubeUrl = item.youTubeUrl ? item.youTubeUrl : item.youTubeCode ? `https://youtube.com/embed/${item.youTubeCode}` : undefined;

            // this is all about the content inside each news article only
            let descr = item.description?.replaceAll("http://", "https://") ?? "";
            if (descr.length < 5) {
              descr = "...";
            }

            return (
              <li key={item.id} className="rd-card rd-card--link rd-news-card">
                <div className="rd-news-meta">
                  <span className="rd-chip rd-chip--y">{item.postDateString}</span>
                  <span className="rd-news-by">By {item.authors}</span>
                </div>
                <h2 className="rd-h3">{item.title}</h2>
                <div className="rd-prose" dangerouslySetInnerHTML={createMarkup(sanitizeNewsHtml(descr))}></div>

                {youTubeUrl && (
                  <div className="rd-news-media">
                    <iframe src={youTubeUrl} allow="autoplay; encrypted-media" allowFullScreen width={250} title="video" />
                  </div>
                )}

                {item.pictureUrl && (
                  <div className="rd-news-media">
                    {/* NOT USING IMAGE BECAUSE THIS COMES FROM SILICONVALLEY-CODECAMP AND ALSO NO HEIGHT CALLED OUT */}
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, basePath applied by hand */}
                    <img width="200" src={withBasePathIfSiteRelative(pictureUrl)} alt="news" />
                  </div>
                )}

                <Link className="rd-btn rd-btn--sm rd-news-more" href={`/news/${item.codeCampYear}/${item.titleSlug}`}>
                  Click for Details
                </Link>
              </li>
            );
          });

  return <ul className="rd-grid rd-news-grid">{list}</ul>;
}
