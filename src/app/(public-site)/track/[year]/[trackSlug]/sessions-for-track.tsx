import React from "react";
import {getSessionsData} from "@/lib/staticData/sessions/sessionsUtils";
import {getSessionIdsForTrack} from "@/lib/staticData/sessions/trackDetail";
import SessionExpandedItem from "@/app/(public-site)/session/[year]/SessionExpandedItem";

export default async function SessionsForTrack({ trackId, year }: { trackId: number; year: string }) {
  const sessionIdsForTrack = await getSessionIdsForTrack(year, trackId);
  const allSessions = await getSessionsData(year);
  const sessionsForTrack = allSessions?.filter((session) => sessionIdsForTrack?.includes(session.id));

  return (
    <section className="rd-band rd-band--tight rd-ss-list" aria-labelledby="rd-ss-track-sessions-title">
      <div className="rd-wrap">
        <h2 id="rd-ss-track-sessions-title" className="rd-h2 rd-section-title">
          Sessions in this track
          {sessionsForTrack && sessionsForTrack.length > 0 && <span className="rd-chip rd-chip--g">{sessionsForTrack.length}</span>}
        </h2>
        <ul className="rd-grid rd-ss-grid">
          {sessionsForTrack?.map((sessionItem: any) => {
            return (
              <SessionExpandedItem
                session={sessionItem}
                key={sessionItem.id}
                year={year}
                sessionInterestCounts={0}
                interestLevel={0}
                profile={{}}
                width100={false}
                configDataDict={{}}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );

  // return (
  // <div className="container-main">
  //   <div className="sessions">
  //     <SessionFilterView sessions={sessions} />
  //     <div className="events-session-list js-list-view active">
  //       <SessionListViewClientWrapper>
  //         <SessionsNotExpanded
  //           year={year}
  //           sessions={sessionsSorted}
  //           sessionInterestTotalDict={sessionInterestTotalDict}
  //           sessionInterestLevelDict={sessionInterestLevelDict}
  //           profile={profile}
  //           configDataDict={configDataDict}
  //         />
  //       </SessionListViewClientWrapper>
  //       <SessionGridViewClientWrapper>
  //         <SessionsExpanded
  //           year={year}
  //           sessions={sessionsSorted}
  //           sessionInterestTotalDict={sessionInterestTotalDict}
  //           sessionInterestLevelDict={sessionInterestLevelDict}
  //           profile={profile}
  //           configDataDict={configDataDict}
  //         />
  //       </SessionGridViewClientWrapper>
  //     </div>
  //   </div>
  // </div>
  // );

  // return (
  //   <div>
  //     {sessionsForTrack.map((session) => (
  //       <div key={session.id}>
  //         <div>{session.title}</div>
  //       </div>
  //     ))}
  //   </div>
  // )
  //
  //
  //
  // return (
  //   <div>
  //     trackId: {trackId} sessions: {JSON.stringify(sessionsForTrack)}
  //   </div>
  // );
}
