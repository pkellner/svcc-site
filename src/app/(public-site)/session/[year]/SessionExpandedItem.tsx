import "server-only";

import Link from "next/link";
import React from "react";
import SessionExpandedItemClientWrapper from "@/app/(public-site)/session/[year]/SessionExpandedItemClientWrapper";
import {getSpeakerNames} from "@/lib/utils";
import getYouTubeDetail from "@/lib/getYouTubeDetail";
import ImageWithFallback from "@/app/common/ImageWithFallback";
import {generateSlug} from "@/app/common/generate-slug";
import {speakerSlug} from "@/lib/slugs";
import {withBasePath} from "@/lib/basePath";
import {getUserProfile} from "@/lib/staticData/common/utils/getUserProfile";
import {sanitizeBasicHtml} from "@/lib/sanitize";

async function getYouTubeDetails(id: string | undefined) {
  return await getYouTubeDetail(id ?? "");
}

export default async function SessionExpandedItem({
  session,
  year,
  sessionInterestCounts,
  interestLevel,
  profile,
  configDataDict,
  width100,
}: {
  session: any | undefined;
  year: string | undefined;
  sessionInterestCounts: any | undefined;
  interestLevel: number | undefined;
  profile: any;
  configDataDict: any;
  width100: boolean;
}) {
  const { isAdmin } = await getUserProfile();

  const createMarkup: (rawHtml: string) => { __html: any } = (rawHtml) => ({
    __html: rawHtml,
  });

  const hasVideos: number | boolean = session?.sessionVideo ? true : false;
  const youTubeCode = session?.sessionVideo ? session?.sessionVideo?.youTubeUrl : undefined;

  const descrEllipsized = () => {
    return session?.descriptionShort;
  };

  function sessionDescriptionRaw() {
    // Same allowlist as HtmlNotSafe: session descriptions are stored HTML, so
    // allowHtml means "render the formatting", not "render anything".
    return <div className="rd-prose rd-ss-desc" dangerouslySetInnerHTML={createMarkup(sanitizeBasicHtml(descrEllipsized()))}></div>;
  }

  function sessionDescriptionSafe() {
    return <div className="rd-prose rd-ss-desc">{descrEllipsized()}</div>;
  }

  //console.log(`SessionExpandedItem sessionId: ${session.id} allowHtml:${session.allowHtml}`);

  const youTubeVideoObj = await getYouTubeDetails(youTubeCode?.toString());
  // console.log("thumb:", youTubeVideoObj[0].snippet.thumbnails.medium.url);
  // console.log("length:", youTubeVideoObj[0].contentDetails.duration);
  // console.log("views:", youTubeVideoObj[0].statistics.viewCount);
  // console.log("likes:", youTubeVideoObj[0].statistics.likeCount);

  const videoUrl = session.sessionVideo?.youTubeUrl ?? "";
  // hasVideos &&
  // session &&
  // session?.sessionVideos &&
  // session.sessionVideos.length > 0
  //   ? session.sessionVideos[0]?.youTubeUrl
  //   : "https://youtu.be/m7ElVFWSByA?list=PL7hKLAqgemJCCkbYd8WxDmiHOU0JWikNY"; // ChatGPT playlist

  const speakerNames = getSpeakerNames(session);

  const renderShowSessionInterestCount = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionInterestCount"] === "true");

  const renderShowSessionPlanAheadCount = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionPlanAheadCount"] === "true");

  const showRoom = configDataDict["ShowRoomOnSchedule"] === "true" || isAdmin;
  const showTime = configDataDict["ShowAgendaOnSchedule"] === "true" || isAdmin;

  return (
    <SessionExpandedItemClientWrapper speakerNames={speakerNames} sessionTitle={session.title ?? ""}>
      <li key={session.id} className={width100 ? "rd-card rd-ss-wide" : "rd-card"}>
        <div className="rd-ss-body">
          <h3 className="rd-h3 rd-ss-title">
            <Link href={`/session/${year}/${(session.slug ?? generateSlug(session.title))}`}>{session?.title}</Link>
          </h3>

          <ul className="rd-ss-speakers" aria-label="Speakers">
            {session?.sessionPresenter?.map(function (sp: any) {
              const firstName = sp?.attendees?.userFirstName || "";
              const lastName = sp?.attendees?.userLastName || "";
              const speakerImageUrl = sp?.attendees?.hasImage ? `/static-images/speakers/${sp?.attendeeId}.webp` : "/images/404-not-found-error.jpg";
              return (
                <li key={`sp2-${sp.id}`}>
                  <ImageWithFallback src={speakerImageUrl} width={75} height={75} alt="" className="rd-avatar rd-avatar--sm" />
                  <a href={withBasePath(`/presenter/${year ?? ""}/${speakerSlug(firstName, lastName, sp.attendeeId)}`)}>
                    {firstName} {lastName}
                  </a>
                </li>
              );
            })}
          </ul>

          {session.allowHtml ? sessionDescriptionRaw() : sessionDescriptionSafe()}
        </div>

        <ul className="rd-tags rd-ss-meta">
          {showRoom && (
            <li className="rd-tag rd-tag--b">
              <i>Room</i> {session?.lectureRoom?.number}
            </li>
          )}
          {showTime && (
            <li className="rd-tag rd-tag--y">
              <i>Time</i> {session?.sessionTime?.startTimeFriendly}
            </li>
          )}

          {renderShowSessionInterestCount && (
            <li className="rd-tag">
              <i>Interested</i> {sessionInterestCounts?.InterestLevel2Count}
            </li>
          )}

          {renderShowSessionPlanAheadCount && (
            <li className="rd-tag">
              <i>Plan to Attend</i> {sessionInterestCounts?.InterestLevel3Count}
            </li>
          )}

          {hasVideos && (
            <li>
              <a className="rd-tag rd-tag--o" href={`https://www.youtube.com/watch?v=${youTubeCode}`} aria-label={`Watch the video of ${session?.title}`}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
                Video
              </a>
            </li>
          )}
        </ul>
      </li>
    </SessionExpandedItemClientWrapper>
  );
}
