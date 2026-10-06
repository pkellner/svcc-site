import type {Session} from "@/lib/staticData/sessions/sessionTypes";

export function prismaDateToIsoString(incomingPrismaDate: any, stripTimezoneOffset = false) {
  //console.log("prismaDateToIsoString:incomingPrismaDate", incomingPrismaDate);

  const startTimeLocal = new Date(incomingPrismaDate);
  //console.log("prismaDateToIsoString:startTimeLocal", startTimeLocal);

  let offset = startTimeLocal.getTimezoneOffset() * 60000; // Convert offset to milliseconds
  //console.log("prismaDateToIsoString:offset", offset, "hours", offset / 3600000);

  const adjustedDate = new Date(startTimeLocal.getTime() - offset); // Add the offset
  //console.log("prismaDateToIsoString:adjustedDate", adjustedDate);

  return stripTimezoneOffset ? adjustedDate.toISOString().slice(0, 16) : adjustedDate.toISOString();
}

export function isoStringDateToPrismaDate(incomingDate: string | Date) {
  //console.log("isoStringDateToPrismaDate:incomingDate", incomingDate);
  return typeof incomingDate === "string" ? new Date(incomingDate) : incomingDate;
}

export function getCodeCampNameWithDate(codeCampYear: any) {
  if (!codeCampYear) {
    return "ccy not found";
  }
  const name = `${codeCampYear?.name.replace(codeCampYear?.urlPostToken, "")} : ${codeCampYear?.codeCampDateString}`;
  return parseInt(codeCampYear.id) > 1000 ? name + " at Silicon Valley Code Campfire" : name;
}

export function getCodeCampYearByYearOrCcyId(codeCampYears: any, year: string) {
  const codeCampYear = codeCampYears
    ?.filter((rec: any) => rec.id != "999")
    ?.filter((rec: any) => {
      return year === undefined ? true : rec.urlPostToken === year;
    })
    .sort((a: any, b: any) => {
      return parseInt(a.id) <= parseInt(b.id) ? 1 : -1;
    });
  return codeCampYear && codeCampYear.length > 0 ? codeCampYear[0] : undefined;
}

export function getSpeakerNames(sessionRec: Session): string {
  try {
    const namesArray = sessionRec.sessionPresenter.map((presenter: any) => {
      return `${presenter?.attendees?.userFirstName} ${presenter?.attendees?.userLastName}`;
    });
    return namesArray.join(", ");
  } catch (err) {
    console.error("Something went wrong while extracting names: ", err);
    return "Error";
  }
}

// Uses the platform CSPRNG via the global (not node:crypto), because client
// components import this module. These ids end up in password-reset links, so
// Math.random() is not good enough - it is predictable from earlier outputs.
export function uuidv4() {
  return globalThis.crypto.randomUUID();
}

/**
 * Freshness check for the guid links mailed out (password reset, opt-in/out).
 * A missing/never-sent date parses to an invalid Date and is treated as stale.
 */
export function isWithin24Hours(sentDateTime: string | Date | null | undefined): boolean {
  if (!sentDateTime) {
    return false;
  }
  const sent = new Date(sentDateTime).getTime();
  if (Number.isNaN(sent)) {
    return false;
  }
  const hoursDiff = (Date.now() - sent) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

export function isDateInPast(compareDate: string): boolean {
  const currentDate = new Date();
  const startDate = new Date(compareDate);

  // getTime() returns the time in milliseconds since the Unix Epoch
  return startDate.getTime() < currentDate.getTime();
}

type Result = {
  numbersArray: number[];
  updatedString?: string;
  arrayString?: string;
};

export function extractArrayOfNumbers(inputString: string, stripArray = false): Result {
  if (!inputString || inputString.length === 0) {
    return {
      numbersArray: [],
      updatedString: undefined,
    };
  }

  let start = inputString?.indexOf("[");
  let end = inputString?.indexOf("]");

  // console.log("start:", start, "end:", end);

  let numbersArray: number[] = [];
  let arrayString = "";

  if (start !== -1 && end !== -1) {
    arrayString = inputString.substring(start + 1, end);
    numbersArray = arrayString
      .split(",")
      .map((str) => parseInt(str.trim()))
      .filter((num) => !isNaN(num));
  }

  let updatedString;
  if (stripArray && start !== -1 && end !== -1) {
    updatedString = inputString.substring(end + 1).trim();
  }

  return {
    numbersArray,
    arrayString,
    updatedString: stripArray ? updatedString : undefined,
  };
}
