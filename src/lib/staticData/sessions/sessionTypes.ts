// Shape of a session record in static-data/years/<token>.json.
type AttendeeAmazonBook = any; // Replace 'any' with the actual type if known

interface SessionPresenter {
  attendeeId: number;
  attendees: {
    attendeesAmazonBook: AttendeeAmazonBook[];
    company: string;
    facebookId: string;
    linkedInId: string;
    principleJob: string;
    twitterHandle: string;
    userFirstName: string;
    userLastName: string;
  };
  id: number;
  sessionId: number;
}

interface SessionTag {
  tags: {
    tagName: string;
  };
}

interface SessionLevel {
  description: string;
}

interface LectureRoom {
  number: string;
}

interface SessionTime {
  id: number;
  startTime: Date;
  startTimeFriendly: string;
  endTime: Date;
  endTimeFriendly: string;
  sessionMinutes: number;
  codeCampYearId: number;
}

interface SessionVideo {
  id: number;
  youTubeUrl: string;
}

export interface Session {
  codeCampYearId: number;
  allowHtml: boolean;
  description: string;
  descriptionShort: string;
  id: number;
  lectureRoomsId: number;
  sessionLevels: SessionLevel;
  sessionPresenter: SessionPresenter[];
  sessionTags: SessionTag[];
  sessionTimesId: number;
  sessionsMaterialUrl: string;
  title: string;
  trackSession: any[]; // Replace 'any' with the actual type if known
  lectureRoom: LectureRoom;
  sessionTime: SessionTime;
  sessionVideo: SessionVideo;
}
