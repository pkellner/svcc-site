import "server-only";
import React, {Suspense} from "react";
import Link from "next/link";

import SessionListItemClientWrapper from "@/app/(public-site)/session/[year]/SessionListItemClientWrapper";
import {generateSlug} from "@/app/common/generate-slug";
import {getSpeakerNames} from "@/lib/utils";
import {withBasePath} from "@/lib/basePath";
//import SessionToggleInterestedButton from "@/app/(public-site)/session/[year]/[sessionSlug]/SessionToggleInterestedButton";

export default function SessionListItem({
  session,
  year,
  sessionInterestCounts,
  interestLevel,
  profile,
  configDataDict,
}: {
  session: any | undefined;
  year: string | undefined;
  sessionInterestCounts: any | undefined;
  interestLevel: number | undefined;
  profile: any;
  configDataDict: any;
}) {
  const speakerNames = getSpeakerNames(session);

  const hasVideos: number | boolean = !!session?.sessionVideo;
  // const youTubeCode = session?.sessionVideo

  // console.log("session:", hasVideos,session);
  //   ? session?.sessionVideo?.youTubeUrl
  //   : undefined;

  const renderShowSessionInterestCount = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionInterestCount"] === "true");

  const renderShowSessionPlanAheadCount = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionPlanAheadCount"] === "true");

  const renderShowSessionInterest = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionInterest"] === "true");

  const renderShowSessionPlanAhead = profile.isAdmin || (profile.isLoggedIn && configDataDict["ShowSessionPlanAhead"] === "true");

  // if (session.id === 7579 || session.id === 7506) {
  //   console.log("sessionInterestCounts:", sessionInterestCounts);
  //   console.log("interestLevel:", interestLevel);
  //   console.log(
  //     "ConfigDataDict for ShowSessionPlanAheadCount:",
  //     configDataDict["ShowSessionPlanAheadCount"],
  //     session.name
  //   );
  //   console.log(
  //     "ConfigDataDict for ShowSessionInterestCount:",
  //     configDataDict["ShowSessionInterest"],
  //     session.name
  //   );
  // }

  return (
    <SessionListItemClientWrapper speakerNames={speakerNames} sessionTitle={session.title ?? ""} sessionId={session.id}>
      <article className="rd-card rd-ss-row">
        <div>
          <h3 className="rd-h3 rd-ss-title session-title">
            <Link href={`/session/${year}/${(session.slug ?? generateSlug(session.title))}`}>{session.title}</Link>
          </h3>
          <p className="rd-ss-names">
            <span className="rd-ss-sr">
              speaker
              {session && session.sessionPresenter && session.sessionPresenter.length > 1 ? "s: " : ": "}
            </span>
            {speakerNames}
          </p>
          <Suspense
            fallback={
              <div>
                <img src={withBasePath("/images/busy-indicator.gif")} width="20" height="20" alt="loading" />
              </div>
            }
          >
            <ul className="rd-tags rd-ss-meta">
              {configDataDict["ShowRoomOnSchedule"] === "true" && (
                <li className="rd-tag rd-tag--b">
                  <i>Room</i> {session?.lectureRoom?.number}
                </li>
              )}
              {configDataDict["ShowAgendaOnSchedule"] === "true" && (
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
            </ul>
          </Suspense>
        </div>

        <div className="rd-ss-actions">
          {hasVideos && (
            <a className="rd-tag rd-tag--o" href={session?.sessionVideo?.youTubeUrl} aria-label={`Watch the video of ${session.title}`}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
              Video
            </a>
          )}
          <Link className="rd-btn rd-btn--sm rd-btn--b" href={`/session/${year}/${(session.slug ?? generateSlug(session.title))}`} aria-label={`Details: ${session.title}`}>
            Details {profile.isAdmin && `(${session.id})-interestLevel-${interestLevel}`}
          </Link>
        </div>
      </article>
    </SessionListItemClientWrapper>
  );
}
