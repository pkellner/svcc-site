interface SessionUser {
  email: string | undefined;
  name: string | undefined;
  isAdmin: boolean | undefined;
  id: number | undefined;
  isLoggedIn: boolean | undefined;
}

export interface SessionStorage {
  user: SessionUser;
  iat: number;
  exp: number;
  jti: string;
}

/****************/
export interface AuthInfo {
  viewingYearEventName?: string;
  eventName?: string;
  codeCampYear?: string;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  username?: string;
  cloudFrontCacheServer?: string;
  cloudFrontServerEnabled?: boolean;
  codeCampDateString?: string;
  currentCodeCampYear?: string;
  viewingCodeCampYear?: string;
  hostedBy?: string;
  jwtToken?: string;
  codeCampYears: CodeCampYear[];
}

export interface BookResult {
  id: number;
  attendeesId: number;
  amazonBookNumber?: number;
  bookTitle?: string;
  active?: boolean;
  approved?: boolean;
  sequence?: string;
  detailPageUrl?: string;
  authors?: string;
  amazonImageSmall?: string;
  amazonImageMedium?: string;
  amazonImageLarge?: string;
  bookPublishedDate?: string;
}

export interface Track {
  sessions?: Session[] | null;
  codeCampYearId?: number;
  year: string;
  codeCampYear?: string;
  trackUrl?: string;
  named?: string;
  description?: string;
  creationDate?: string;
  modifiedDate?: string;
  sequence?: string;
  namedAdmin?: string;
  id: number;
}

export interface Sponsor {
  id: number;
  sponsorListId: number;
  codeCampYear: string;
  sponsorName: string;
  sponsorLevelId: number;
  sponsorSupportLevel: string;
  imageUrl: string;
  webSite: string;
  showFeatured: boolean;
  hoverOverText: string;
  underLogoText: string;
  sponsorSupportLevelSmallGold: boolean;
  horizontalValue?: number;
  verticalValue?: number;
}

export interface Room {
  number: string; // this is really the room name
  description: string;
  capacity: number;
  projector: boolean;
  screen: boolean;
  available: boolean;
  building: string;
  roomNumberWithCapacity: string;
  roomNumberSort: string;
  id: number;
}

export interface TagFavorite {
  selected: boolean;
  id: number;
  tagName: string;
  count: number;
}

export interface Speaker {
  presenterSessions: Session[];
  attendeesAmazonBooks: BookResult[];
  codeCampYear: string;
  urlPostToken: string;
  nameSlug: string;
  speakerLocalUrl: string;
  allowHtml: boolean;
  favorite: boolean;
  userBio: string;
  userBioShort: string;
  id: number;
  userFirstName: string;
  userLastName: string;
  company: string;
  twitterUrl: string;
  linkedInUrl: string;
  facebookUrl: string;
  principleJob: string;
  employment: string;
  sessions: Session[];
}

export interface SessionSlug {
  sessionId: number;
  sessionSlugName: string;
}

export interface SpeakerSlug {
  id: number;
  nameSlug: string;
}

export interface News {
  id: number;
  codeCampYearId: number;
  codeCampYear: string;
  pictureUrl?: string;
  youTubeCode?: string;
  visible: boolean;
  description: string;
  authors: string;
  createdDate: string;
  contentData: string;
  updatedDate: string;
  postDate: string;
  authorEmail: string;
  titleSlug: string;
  urlWithTitle: string;
  postDateString: string;
  title: string;
}

export interface Tags {
  tagName: string;
  id: number;
}

// should really have used Partial<SessionSpeaker> instead of doing all the ?s
// export interface SessionSpeaker {
//     linkedInUrl?: string;
//     facebookUrl?: string;
//     twitterUrl?: string;
//     userBio?: string;
//     allowHtml?: boolean;
//     occupation?: string;
//     firstName?: string,
//     lastName?: string,
//     company?: string,
//     codeCampYear?: string,
//     imageUrl?: string,
//     speakerLocalUrl?: string,
//     id: number
// }

export interface SessionTime {
  id: number;
  startTimeFriendly: string;
  startTime: string;
}

export interface LectureRoom {
  id: number;
  number: string;
  capacity: string;
}

export interface TrackSession {
  id: number;
  sessionId: number;
  trackId: number;
}

export interface SessionPresenter {
  sessionId: string;
  speaker: Speaker;
}

export interface Session {
  slug?: string; // the stored URL slug, attached as the year file is read (load.ts)
  level: string;
  approved: boolean;
  codeCampYearId: number;
  lectureRoom: LectureRoom;
  sessionTime: SessionTime;
  session: Session;
  planToAttendTop3?: boolean;
  planToAttendTop10?: boolean;
  planToAttendTop15?: boolean;
  planToAttendTop25?: boolean;
  interestTop3?: boolean;
  interestTop10?: boolean;
  interestTop15?: boolean;
  interestTop25?: boolean;
  id: number;
  codeCampYear?: string;
  trackSessions?: TrackSession[];
  room?: string;
  presenters?: Speaker[];
  sessionPresenters?: SessionPresenter[];
  bookResults?: BookResult[];
  tagResults?: Tags[];
  sessionVideos?: Video[];
  sessionUrl?: string;
  isUpdating?: boolean;
  title?: string;
  sessionSlug?: string;
  description?: string;
  descriptionEllipsized?: string;
  isOpenSource?: boolean;
  sessionLevel?: string;
  sessionSequence?: string;
  speakersNamesCsv?: string;
  createdate?: string;
  sessionsMaterialUrl?: string;
  sessionTrackName?: string;
  sessionTrackUrl?: string;
  descriptionShort?: string;
  allowHtml?: boolean;
  date?: any;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  googleplus?: string;
  avatar?: string;
  profession?: string;
  interestLevel?: number;
  status?: string;
  showInterestCnt?: boolean;
  showPlanAheadCnt?: boolean;
  showPlanToAttendOption?: boolean;
  showInterestedInOption?: boolean;
  showNotInterestedInOption?: boolean;
  planAheadCountInt?: number;
  interestCountInt?: number;
  sessionTimeDateTime?: string;
  startTime?: string;
  startTimePretty?: string;
  sessionTimesId?: number;
  roomNumber?: string;
  roomCapacity?: number;
  sessionGuid?: string;
  planAheadCount?: number;
  interestCount?: number;
}

export interface Video {
  id?: number;
  sessionId?: number;
  youTubeUrl?: string;
  createdDate?: string;
}

export interface VolunteerForJobType {
  volunteerJobId: number;
  codeCampYearId: number;
  description: string;
  numberNeededTotal: number;
  numberSignedUp: number;
  jobStartTime: string;
  jobEndTime: string;
  jobTimeString: string;
}

export interface CodeCampYear {
  id: string;
  codeCampYearTypeId: number;
  siteLocked: boolean;
  codeCampYearTypeDescription?: string;
  name: string;
  campStartDate: string;
  campEndDate: string;
  urlPostToken: string;
  codeCampDateString: string;
  locationName: string;
  codeCampSaturdayString: string;
  codeCampSundayString: string;
}

export interface EmailDetailTopics {
  createDate: string;
  title: string;
  emailSubject: string;
  emailHtml: string;
  subject: string;
  baseUrl: string;
  codeCampYearId: number;
  emailFrom: string;
  mailBatchLabel: string;
  sqlStatement: string;
  sponsorPlatinum: boolean;
  sponsorGold: boolean;
  sponsorSilver: boolean;
  sponsorBronze: boolean;
  sponsorCommunity: boolean;
  sponsorKidsPremiere: boolean;
  sponsorKidsSupporting: boolean;
  pastSponsor: boolean;
  generalCCMailings: boolean;
  sponsorCCMailings: boolean;
  supressEmailIfNoNextActionDate: boolean;
  excludeCriticalOnlyPeople: boolean;
  excludeOptOutCurrentYearPeople: boolean;
  excludeAllOptOutPeople: boolean;
  diceTechJobs: boolean;
  sponsoredEmail: boolean;
  codeCampType: string;
  processedStatus: boolean;
  currentRegisteredOnly: boolean;
  emailBcc: string;
  speakerApprovedOnly: boolean;
  emailTemplateId: number;
  emailAndTextNow: boolean;
  sponsorPremiere: boolean;
  sqlStatementAddToExisting: boolean;
  sponsorNotInterestedCurrentYear: boolean;
  sponsorsOnly: boolean;
  whichYears: string;
  sqlStatementFull: string;
  sqlStatementExclude: string;
  speakerApprovedExclude: boolean;
  readCnt: number;
  totalCnt: number;
  sentCnt: number;
  bounce: number;
  click: number;
  deferred: number;
  delivered: number;
  dropped: number;
  open: number;
  processed: number;
  spamReport: number;
  id: number;
}

export interface UrlsByTopicGrouped {
  emailDetailsTopicId: number;
  emailTo: string;
  url: string;
  cnt: number;
  subject: string;
}

export interface EmailDetails {
  attendeesId: number;
  sponsorListContactId: number;
  emailSendStatus: string;
  emailSendLogMessage: string;
  sentDateTime: string;
  emailFrom: string;
  emailTo: string;
  emailDetailsTopicId: number;
  emailDetailsGuid: string;
  emailReadCount: number;
  emailSendPriority: number;
  textTo: string;
  email: string;
  firstName: string;
  lastName: string;
  id: number;
}

export interface AttendeesByUrlAndEmailDetailTopic {
  id: number;
  attendeeId: number;
  userFirstName: string;
  userLastName: string;
  url: string;
}
