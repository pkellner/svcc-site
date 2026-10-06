import {jobLine} from "@/lib/displayText";
import "server-only";
import React from "react";

import SessionDetailHeader from "./SessionDetailHeader";
import BookResultsList from "@/app/common/BookResultsList";
import HtmlNotSafe from "@/gql/common/HtmlNotSafe";
import ImageWithFallback from "@/app/common/ImageWithFallback";
import { speakerSlug } from "@/lib/slugs";
import { withBasePath, withBasePathIfSiteRelative } from "@/lib/basePath";
import { getConfigDataDict } from "@/lib/staticData/configData";
import { getCodeCampYearIdByYear } from "@/lib/staticData/common/utils/getCodeCampYearIdByYear";
import { notFound } from "next/navigation";
import { AllSocial } from "@/app/common/all-social";

export default async function SessionDetail({ session, year }: { session: any; year: string | undefined }) {
  const codeCampYearId = await getCodeCampYearIdByYear(year);
  if (!codeCampYearId) {
    notFound();
  }
  const configDataDict = await getConfigDataDict(codeCampYearId);

  const youTubeUrl = session?.sessionVideo && session?.sessionVideo.youTubeUrl ? session?.sessionVideo?.youTubeUrl : undefined;
  const urlParts = youTubeUrl?.split("watch?v=") ?? [];
  const youTubeCode = urlParts.length > 1 ? urlParts[1] : undefined;

  const bookResults: any = [];
  session?.sessionPresenters?.forEach(function (spRec: any) {
    const books = spRec?.speaker?.attendeesAmazonBooks;
    books?.forEach(function (book: any) {
      bookResults.push(book);
    });
  });

  const showRegisterButton = false;

  const hasMaterials = !!session?.sessionsMaterialUrl;

  return (
    <>
      {
        // @ts-ignore
        <SessionDetailHeader session={session} year={year} />
      }

      <div className="rd-band rd-band--tight">
        <div className="rd-wrap">
          <div className={hasMaterials ? "rd-ss-detail" : "rd-ss-detail rd-ss-detail--single"}>
            <div className="rd-ss-main">
              <section className="rd-card rd-ss-about" aria-labelledby="rd-ss-about-title">
                <h2 id="rd-ss-about-title" className="rd-h2">
                  About This Session
                </h2>

                <div className="rd-prose">
                  <HtmlNotSafe htmlData={session?.description} allowHtml={session?.allowHtml} />
                </div>

                {youTubeCode && (
                  <div className="rd-ss-video">
                    <iframe src={"https://www.youtube.com/embed/" + youTubeCode} allow="autoplay; encrypted-media" allowFullScreen title="video" />
                  </div>
                )}

                {session?.sessionTime?.id != 10 &&
                  (configDataDict["ShowAgendaOnSchedule"] === "true" || configDataDict["ShowRoomOnSchedule"] === "true") && (
                    <ul className="rd-tags rd-ss-meta">
                      {configDataDict["ShowAgendaOnSchedule"] === "true" && (
                        <li className="rd-tag rd-tag--y">
                          <i>Time</i> {session?.sessionTime?.startTimeFriendly}
                        </li>
                      )}
                      {configDataDict["ShowRoomOnSchedule"] === "true" && (
                        <li className="rd-tag rd-tag--b">
                          <i>Room</i> {session?.lectureRoom?.number}
                        </li>
                      )}
                    </ul>
                  )}

                {showRegisterButton && (
                  <p style={{ marginTop: 22 }}>
                    <button className="rd-btn rd-btn--o">Register</button>
                  </p>
                )}
              </section>

              {session?.sessionPresenter?.length > 0 && (
                <section aria-labelledby="rd-ss-speakers-title">
                  <h2 id="rd-ss-speakers-title" className="rd-h2">
                    The Speaker(s)
                  </h2>

                  <div className="rd-stack">
                    {session?.sessionPresenter?.map(function (speaker: any) {
                      // Picked at render time, not in onError, which can fire
                      // before hydration (STATIC-SITE-PLAN.md Step 4).
                      const imageUrl = speaker.attendees?.hasImage
                        ? `/static-images/speakers/${speaker.attendeeId}.webp`
                        : "/images/404-not-found-error.jpg";

                      return (
                        <article className="rd-card rd-ss-person" key={speaker.attendeeId}>
                          <ImageWithFallback
                            src={imageUrl}
                            width={200}
                            height={200}
                            alt={`${speaker.attendees?.userFirstName ?? ""} ${speaker.attendees?.userLastName ?? ""}`}
                            className="rd-avatar rd-avatar--lg"
                          />

                          <div>
                            <h3 className="rd-h3">
                              <a
                                href={withBasePath(
                                  `/presenter/${year}/${speakerSlug(
                                    speaker.attendees.userFirstName,
                                    speaker.attendees.userLastName,
                                    speaker.attendeeId
                                  )}`
                                )}
                              >
                                {speaker.attendees.userFirstName} {speaker.attendees.userLastName}
                              </a>
                            </h3>
                            {jobLine(speaker.attendees.principleJob, speaker.attendees.company, ", ") && (
                              <p className="rd-ss-job">{jobLine(speaker.attendees.principleJob, speaker.attendees.company, ", ")}</p>
                            )}
                            {speaker.attendees.userBioShort && <p className="rd-ss-bio">{speaker.attendees.userBioShort}</p>}

                            <div className="rd-ss-social">
                              <AllSocial
                                twitterHref={speaker.attendees?.twitterHandle}
                                twitterSize="medium"
                                noLeftMarginTwitter
                                facebookHref={speaker.attendees?.facebookId}
                                facebookSize="medium"
                                linkedinHref={speaker.attendees?.linkedInId}
                                linkedinSize="medium"
                                blueskyHref={speaker.attendees?.blueskyHandle}
                                blueskySize="medium"
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <BookResultsList bookResults={bookResults} />
            </div>

            {hasMaterials ? (
              <aside className="rd-card rd-ss-aside" aria-labelledby="rd-ss-download-title">
                <h2 id="rd-ss-download-title" className="rd-h3">
                  Download
                </h2>
                <a className="rd-btn rd-btn--y rd-btn--sm" href={withBasePathIfSiteRelative(session.sessionsMaterialUrl)}>
                  Download the materials
                </a>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
