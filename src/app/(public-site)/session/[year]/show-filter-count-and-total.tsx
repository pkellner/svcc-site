"use client";

import {FilterBarContext} from "@/app/contexts/FilterBarContext";
import {useContext} from "react";
import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import {getSpeakerNames} from "@/lib/utils";

export default function ShowFilterCountAndTotal({ sessions }: { sessions: any }) {
  const { query } = useContext(FilterBarContext);
  const totalCount = sessions?.length ?? 0;

  function checkForMatchQueryString(session: Session, query: string) {
    return (getSpeakerNames(session).toLowerCase() + session?.title?.toLowerCase()).includes(query.toLowerCase());
  }

  const filteredCount: number =
    sessions?.reduce((accumulator: number, currentSession: Session) => {
      return checkForMatchQueryString(currentSession, query) ? accumulator + 1 : accumulator;
    }, 0) ?? 0;

  return (
    <p className="rd-ss-results results" aria-live="polite">
      {filteredCount != totalCount ? (
        <>
          {filteredCount ?? "0"} out of {totalCount ?? "0"} sessions filtered
        </>
      ) : (
        <>{totalCount ?? "0"} sessions</>
      )}
    </p>
  );
}
