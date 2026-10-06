import "server-only";

import React from "react";
import SessionListItem from "@/app/(public-site)/session/[year]/SessionListItem";
import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import {SessionInterest} from "@/app/(public-site)/session/[year]/page";

export default function SessionsNotExpanded({
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
    <div className="rd-stack rd-ss-stack">
      {sessions?.map((sessionItem: any) => {
        return (
          <SessionListItem
            session={sessionItem}
            key={sessionItem.id}
            year={year}
            sessionInterestCounts={sessionInterestTotalDict[sessionItem.id] ?? 0}
            interestLevel={sessionInterestLevelDict[sessionItem.id] ?? 0}
            profile={profile}
            configDataDict={configDataDict}
          ></SessionListItem>
        );
      })}
    </div>
  );
}
