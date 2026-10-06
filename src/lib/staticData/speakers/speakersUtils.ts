// Static mirror of src/lib/prismaData/speakers/speakersUtils.ts
import { year } from "@/lib/staticData/load";

export { generateSpeakerSlug, speakerSlug } from "@/lib/slugs";

export interface SpeakerAmazonBook {
  title: string;
  author: string;
  isbn: string;
  publishDate: Date;
}

export interface SpeakerSession {
  sessionId: number;
  topic: string;
  duration: number;
  abstract: string;
}

export interface SpeakerData {
  id: number;
  userLastName: string;
  userFirstName: string;
  creationDate: Date;
  company: string;
  principleJob: string;
  twitterHandle: string;
  blueskyHandle: string;
  facebookId: string;
  linkedInId: string;
  allowHtml: boolean;
  userBio: string;
  userWebsite: string;
  userZipCode: string;
  city: string;
  state: string;
  attendeesAmazonBook: SpeakerAmazonBook[];
  sessionsList: SpeakerSession[];
}

// The export already computed and attached `slug` (speakerSlug(...)) to each
// presenter, and dropped userZipCode/city/state/creationDate -- see
// scripts/export-static-data.ts's sanitizePresenter(). getSpeakerSlugs() is
// not mirrored: the only public caller looked up a presenter by matching its
// full slug, which this round replaces with a lookup by trailing id instead
// (STATIC-SITE-PLAN.md Step 4) -- see presenter/[year]/[presenterSlug]/page.tsx.
export async function getUniquePresenters(urlPostToken: string): Promise<any[]> {
  return year(urlPostToken)?.uniquePresenters ?? [];
}
