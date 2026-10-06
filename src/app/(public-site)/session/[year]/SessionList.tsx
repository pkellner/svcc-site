import "server-only";

import SessionsNotExpanded from "@/app/(public-site)/session/[year]/SessionsNotExpanded";
import SessionsExpanded from "@/app/(public-site)/session/[year]/SessionsExpanded";
import React from "react";
import SessionFilterView from "@/app/(public-site)/session/[year]/SessionFilterView";
import {SessionListViewClientWrapper} from "@/app/(public-site)/session/[year]/SessionListViewClientWrapper";
import {SessionGridViewClientWrapper} from "@/app/(public-site)/session/[year]/SessionGridViewClientWrapper";
import FilterBarProvider from "@/app/contexts/FilterBarContext";
import {SessionInterest} from "@/app/(public-site)/session/[year]/page";
import {getUserProfile} from "@/lib/staticData/common/utils/getUserProfile";
import getSessionsWithInterestLevelDict from "@/lib/staticData/sessions/sessionsWithInterestLevelDict";

export default async function SessionList(props: any) {
  return (
    <FilterBarProvider year={props?.year}>
      <Page {...props} />
    </FilterBarProvider>
  );
}

async function Page({
  sessions,
  year,
  sessionInterestTotalDict,
  configDataDict,
}: {
  sessions: any;
  year: string;
  sessionInterestTotalDict: Record<number, SessionInterest>;
  configDataDict: any;
}) {
  const profile = await getUserProfile();

  const sessionInterestLevelDict = await getSessionsWithInterestLevelDict(year, profile.name);

  return (
    <section className="rd-band rd-band--tight rd-ss-list" aria-labelledby="rd-ss-all-sessions">
      <div className="rd-wrap">
      <h2 id="rd-ss-all-sessions" className="rd-ss-sr">
        All sessions
      </h2>
      <SessionFilterView sessions={sessions} />
      <SessionListViewClientWrapper>
        <SessionsNotExpanded
          year={year}
          sessions={sessions}
          sessionInterestTotalDict={sessionInterestTotalDict}
          sessionInterestLevelDict={sessionInterestLevelDict}
          profile={profile}
          configDataDict={configDataDict}
        />
      </SessionListViewClientWrapper>
      <SessionGridViewClientWrapper>
        <SessionsExpanded
          year={year}
          sessions={sessions}
          sessionInterestTotalDict={sessionInterestTotalDict}
          sessionInterestLevelDict={sessionInterestLevelDict}
          profile={profile}
          configDataDict={configDataDict}
        />
      </SessionGridViewClientWrapper>
      </div>
    </section>
  );
}
