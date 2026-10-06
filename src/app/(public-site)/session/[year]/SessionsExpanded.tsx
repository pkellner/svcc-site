import "server-only";

import React from "react";

import SessionExpandedItem from "@/app/(public-site)/session/[year]/SessionExpandedItem";
import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import {SessionInterest} from "@/app/(public-site)/session/[year]/page";

export default function SessionsExpanded({
  year,
  sessions,
  sessionInterestTotalDict,
  profile,
  configDataDict,
  sessionInterestLevelDict,
}: {
  year: string | undefined;
  sessions: Session[];
  sessionInterestTotalDict: Record<number, SessionInterest>;
  profile: any;
  configDataDict: any;
  sessionInterestLevelDict: any;
}) {
  return (
    <ul className="rd-grid rd-ss-grid">
      {sessions?.map((sessionItem: Session) => {
        return (
          // @ts-ignore
          <SessionExpandedItem
            session={sessionItem}
            key={sessionItem.id}
            year={year}
            sessionInterestCounts={sessionInterestTotalDict[sessionItem.id] ?? 0}
            interestLevel={sessionInterestLevelDict[sessionItem.id] ?? 0}
            profile={profile}
            configDataDict={configDataDict}
          />
        );
      })}
    </ul>
  );
}
