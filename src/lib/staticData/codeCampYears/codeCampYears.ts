// Static mirror of src/lib/prismaData/codeCampYears/codeCampYears.ts
// (STATIC-SITE-PLAN.md Step 3). Same exported names and shapes, read from
// static-data/global.json instead of the database.
import { global } from "@/lib/staticData/load";
import type { CodeCampYear } from "@/app/common/CodeCampInterfaces";

export async function getCodeCampYears(): Promise<CodeCampYear[]> {
  return global().codeCampYears;
}

export async function getCodeCampYearsWithSessions() {
  return global().codeCampYearsWithSessions;
}

export async function getAttendeeCountsByYear() {
  return global().attendeeCountsByYear;
}

// Pure helpers, copied verbatim from prismaData (no DB access there either).
export function getCodeCampParagraphOnSessionAndSpeakersCount(codeCampArray: any, codeCampYearId: number, pastOrCurrent: string): string {
  const event = codeCampArray.find((camp: any) => camp.codeCampYearId === codeCampYearId);

  if (!event) {
    return "Event not found.";
  }

  const { CodeCampDateString, totalSessions, totalUniquePresenters, locationName } = event;

  let locationText;
  if (locationName === "Virtual") {
    locationText = "hosted online";
  } else if (locationName) {
    locationText = `hosted at ${locationName}`;
  } else {
    locationText = "hosted at Foothill College";
  }

  return pastOrCurrent === "past"
    ? `This event was ${locationText} on <b>${CodeCampDateString}</b>. There were ${totalSessions} sessions with a total of ${totalUniquePresenters} speakers in those sessions.`
    : `This event will be ${locationText} on <b>${CodeCampDateString}</b>.`;
}

type AttendeeCount = {
  _count: { _all: number };
  CodeCampYearId: number;
};

export function getCountByYearId(attendeeCounts: AttendeeCount[], codeCampYearId: number): number | null {
  const found = attendeeCounts.find((rec: AttendeeCount) => rec.CodeCampYearId === codeCampYearId);
  return found ? found._count._all : null;
}
