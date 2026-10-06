import {generateSlug} from "@/app/common/generate-slug";

type Session = {
  slug?: string;
  sessionTime: any;
  id: number;
  title: string;
  description: string;
  descriptionShort: string;
  sessionsMaterialUrl: string;
  lectureRoomsId: number;
  sessionTimesId: number;
  codeCampYearId: number;
  sessionPresenter: Presenter[];
};

type Presenter = {
  id: number;
  sessionId: number;
  attendeeId: number;
  attendees: Attendee;
};

type Attendee = {
  id: number;
  userFirstName: string;
  userLastName: string;
  twitterHandle: string;
  principleJob: string;
  company: string;
  userBioShort: string;
};

export function getSessionYouTubeWords(session: Session, codeCampYear: string) {
  if (!session) {
    throw new Error("Session record is null");
  }

  let strTalks = session.sessionPresenter.length > 1 ? " Talks" : " Talk";

  let sessionUrl = `/session/${codeCampYear}/${(session?.slug ?? generateSlug(session?.title))}`;

  let sessionMaterial = session.sessionsMaterialUrl ? `Session Materials:\n${session.sessionsMaterialUrl}\n` : "";
  let sb: string[] = [];

  if (session.codeCampYearId > 1000) {
    // ts-ignore
    const date = new Date(session?.sessionTime?.startTime);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = " on " + date.toLocaleDateString("en-US", options);
    sb.push(`${session.title} at Silicon Valley Code Campfire ${formattedDate} `);
  } else {
    sb.push(`${session.title} at Silicon Valley Code Camp ${codeCampYear}`);
  }
  sb.push(" ");

  let speakersNamesCsv = session.sessionPresenter.map((p) => `${p.attendees.userFirstName} ${p.attendees.userLastName}`).join(", ");
  let formattedSpeakers = speakersNamesCsv.replace(",", ", ") + strTalks;

  let str = `
${formattedSpeakers} about '${session.title}' at https://siliconvalley-codecamp.com

${session.descriptionShort}

Session Details:
https://siliconvalley-codecamp.com${sessionUrl}
${sessionMaterial}

Silicon Valley Code Camp site:
https://siliconvalley-codecamp.com

Subscribe to the Silicon Valley Code Camp Youtube Channel
https://www.youtube.com/c/SiliconValleyCodeCampVideos

Follow Silicon Valley Code Camp on X: https://x.com/sv_code_camp
`;

  sb.push(str);

  // Add speaker bios
  session.sessionPresenter.forEach((sp) => {
    if (sp.attendees.userBioShort) {
      sb.push("");
      if (sp.attendees.twitterHandle) {
        sb.push(
          `Follow ${sp.attendees.userFirstName} ${sp.attendees.userLastName} on X: https://x.com/${sp.attendees.twitterHandle.replace("@", "")}`,
        );

        sb.push(`Follow ${sp.attendees.userFirstName} ${sp.attendees.userLastName}`);
      }

      sb.push("");
      sb.push(`Speaker Biography for ${sp.attendees.userFirstName} ${sp.attendees.userLastName}`);
      sb.push("");
      sb.push(sp.attendees.userBioShort);
      sb.push(" ");
    }
  });

  return sb.join("\n");
}
