
import React from "react";
import SessionsHeader from "@/app/(public-site)/session/[year]/SessionsHeader";
import SessionList from "@/app/(public-site)/session/[year]/SessionList";
import {getSessionsData} from "@/lib/staticData/sessions/sessionsUtils";
import {FirstYearsNoData} from "@/app/(public-site)/home/FirstYearsNoData";
import {getSessionInterestData} from "@/lib/staticData/sessions/sessionInterest";
import {getUserProfile} from "@/lib/staticData/common/utils/getUserProfile";
import {getCodeCampYear} from "@/lib/staticData/common/utils/getCodeCampYear";
import CcyProvider from "@/app/contexts/CcyContext";
import {getCodeCampYearIdByYear} from "@/lib/staticData/common/utils/getCodeCampYearIdByYear";
import ConfigDataProvider from "@/app/contexts/ConfigDataContext";
import {getConfigDataDict} from "@/lib/staticData/configData";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  return eventListingMetadata(year, "Sessions", "session", (e) => `Every session at ${eventSentence(e)}`);
}
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {eventListingMetadata, eventSentence} from "@/lib/seo";

export interface SessionInterest {
  sessionId: number;
  InterestLevel2Count: number;
  InterestLevel3Count: number;
}

export default async function PageSession(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  const codeCampYearId = await getCodeCampYearIdByYear(params.year);

  if (!codeCampYearId) {
    notFound();
  }

  const sessionsUnsorted = await getSessionsData(params.year);

  const sessions =
    codeCampYearId > 1000
      ? sessionsUnsorted?.sort((a: any, b: any) => {
          return a?.sessionTime.startTime > b?.sessionTime.startTime ? 1 : -1;
        })
      : sessionsUnsorted?.sort((a: any, b: any) => {
          return a?.title.toLowerCase() > b?.title.toLowerCase() ? 1 : -1;
        });

  const profileInfo = await getUserProfile();

  let sessionInterestTotalDict: Record<number, SessionInterest> = {};
  if (profileInfo.isLoggedIn) {
    const sessionInterestTotals: any = await getSessionInterestData(codeCampYearId);
    sessionInterestTotalDict = sessionInterestTotals.reduce((acc: Record<number, SessionInterest>, entry: SessionInterest) => {
      acc[entry.sessionId] = entry;
      return acc;
    }, {});
  }

  const configDataDict = await getConfigDataDict(codeCampYearId);

  if (params.year === "2006" || params.year === "2007") {
    return <FirstYearsNoData />;
  }

  const codeCampYearRec = await getCodeCampYear(codeCampYearId);

  return (
    <CcyProvider year={params.year} value={codeCampYearRec}>
      {
        // @ts-ignore
        <SessionsHeader year={params.year} count={sessions?.length} />
      }
      <ConfigDataProvider year={params.year} value={configDataDict}>
        {
          // @ts-ignore   (not sure why we need this ts-ignore, seems like I have my export default (async) correct
          <SessionList sessions={sessions} year={params.year} sessionInterestTotalDict={sessionInterestTotalDict} configDataDict={configDataDict} />
        }
      </ConfigDataProvider>

    </CcyProvider>
  );
}
