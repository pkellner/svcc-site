import Link from "next/link";
import React from "react";
import HtmlNotSafe from "@/gql/common/HtmlNotSafe";
import type {SpeakerData} from "@/lib/staticData/speakers/speakersUtils";
import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import {SpeakerNamesCsv} from "@/app/common/SpeakerNameCsv";
import {getUserProfile} from "@/lib/staticData/common/utils/getUserProfile";
import {getConfigDataDict} from "@/lib/staticData/configData";
import {getCodeCampYearIdByYear} from "@/lib/staticData/common/utils/getCodeCampYearIdByYear";
import {notFound} from "next/navigation";
import {generateSlug} from "@/app/common/generate-slug";

// The photo, name, company and social links are in SpeakerHeader (the page
// header band); this renders the bio and the speaker's sessions.
export default async function SpeakerContent({
  speaker,
  year,
  sessionList,
}: {
  speaker: SpeakerData;
  sessionList: Session[];
  sessionsAll: unknown; // Session[] | undefined | null;
  year: string;
}) {
  const { isAdmin } = await getUserProfile();

  const codeCampYearId = await getCodeCampYearIdByYear(year);

  if (!codeCampYearId) {
    notFound();
  }

  const configDataDict = await getConfigDataDict(codeCampYearId);
  const showTime = configDataDict["ShowAgendaOnSchedule"] === "true" || isAdmin;
  const showRoom = configDataDict["ShowRoomOnSchedule"] === "true" || isAdmin;

  return (
    <section className="rd-band rd-band--tight">
      <div className="rd-wrap rd-spk-body">
        <div>
          <h2 className="rd-h2 rd-section-title">About {speaker.userFirstName}</h2>
          <div className="rd-card">
            <div className="rd-prose">
              <HtmlNotSafe htmlData={speaker.userBio} allowHtml={speaker?.allowHtml} />
            </div>
          </div>
        </div>

        {sessionList && sessionList.length > 0 && (
          <div>
            <h2 className="rd-h2 rd-section-title">Speaking Sessions</h2>
            <ul className="rd-stack rd-spk-sessions">
              {sessionList.map((session) => {
                const hasVideos: number | boolean = !!session?.sessionVideo;
                const youTubeCode = session?.sessionVideo ? session?.sessionVideo?.youTubeUrl : undefined;
                const showSchedule = session?.sessionTime?.id != 10 && (showTime || showRoom);
                const multiSpeaker = !!(session.sessionPresenter && session.sessionPresenter?.length > 1);

                return (
                  <li key={session?.id} className="rd-card rd-spk-session">
                    <h3 className="rd-h3">
                      <Link
                        as={`/session/${year}/${generateSlug(session?.title)}`}
                        href={{
                          pathname: "/session",
                          query: {
                            sessionId: session?.id,
                            year: year,
                          },
                        }}
                      >
                        {session?.title}
                      </Link>
                    </h3>

                    {showSchedule && (
                      <ul className="rd-tags">
                        {showTime && <li className="rd-tag rd-tag--y">{session?.sessionTime?.startTimeFriendly}</li>}
                        {showRoom && (
                          <li className="rd-tag rd-tag--b">
                            <i>Room</i> {session?.lectureRoom?.number}
                          </li>
                        )}
                      </ul>
                    )}

                    <div className="rd-prose">
                      <HtmlNotSafe htmlData={session?.description} allowHtml={session?.allowHtml} />
                    </div>

                    {(multiSpeaker || hasVideos) && (
                      <div className="rd-spk-session-foot">
                        {multiSpeaker && (
                          <div>
                            <b>Speakers:</b>
                            <SpeakerNamesCsv session={session} year={year} className="" />
                          </div>
                        )}
                        {hasVideos && (
                          <a className="rd-btn rd-btn--sm rd-btn--o" href={`https://www.youtube.com/watch?v=${youTubeCode}`}>
                            <i className="fa fa-youtube-play" aria-hidden="true"></i> Watch video
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/*NEED TO FIX BOOKRESULTS TO MAKE FOR THIS SPEAKER ONLY*/}
        {/*<BookResultsList bookResults={bookResults} />*/}
      </div>
    </section>
  );
}
