// The 17 events as the event dock (global-nav.tsx) shows them. A client-side module, so the list ships
// once in a cached script instead of being serialized into the RSC payload of every page (~15.7k files).
// The archive is frozen; the counts come from static-data (sessions, unique presenters, tracks per event).

export type Venue = "foothill" | "evergreen" | "paypal" | "campfire";

export interface DockEvent {
  token: string;
  title: string;
  stamp: string;
  date: string;
  venue: Venue;
  counts: { session: number; presenter: number; track: number };
}

export const VENUE_NAMES: Record<Venue, string> = {
  paypal: "PayPal Town Hall",
  evergreen: "Evergreen Valley College",
  foothill: "Foothill College",
  campfire: "Online Campfire",
};

function camp(y: number, venue: Venue, date: string, session: number, presenter: number, track: number): DockEvent {
  return { token: String(y), title: `Code Camp ${y}`, stamp: "'" + String(y).slice(2), date, venue, counts: { session, presenter, track } };
}
function fire(n: number, title: string, stamp: string, date: string, session: number): DockEvent {
  return { token: `campfire-${n}`, title, stamp, date, venue: "campfire", counts: { session, presenter: session, track: 0 } };
}

/** Oldest first, so "previous" and "next" step through time. */
export const DOCK_EVENTS: readonly DockEvent[] = [
  camp(2006, "foothill", "September 2006", 0, 0, 0),
  camp(2007, "foothill", "September 2007", 0, 0, 0),
  camp(2008, "foothill", "November 8 & 9, 2008", 111, 78, 0),
  camp(2009, "foothill", "October 3 & 4, 2009", 146, 94, 7),
  camp(2010, "foothill", "October 9 & 10, 2010", 193, 147, 9),
  camp(2011, "foothill", "October 8 & 9, 2011", 209, 175, 9),
  camp(2012, "foothill", "October 6 & 7, 2012", 213, 184, 10),
  camp(2013, "foothill", "October 5 & 6, 2013", 229, 185, 12),
  camp(2014, "foothill", "October 11 & 12, 2014", 221, 185, 7),
  camp(2015, "evergreen", "October 3 & 4, 2015", 190, 155, 4),
  camp(2016, "evergreen", "October 1 & 2, 2016", 158, 128, 5),
  camp(2017, "paypal", "October 7 & 8, 2017", 128, 112, 7),
  camp(2018, "paypal", "October 13 & 14, 2018", 98, 90, 10),
  camp(2019, "paypal", "October 19 & 20, 2019", 106, 97, 7),
  fire(1001, "Managing Programmers", "Oct '21", "October 2, 2021", 2),
  fire(1002, "Everything ChatGPT", "Feb '23", "February 25, 2023", 4),
  fire(1003, "Software Architecture", "Nov '23", "November 18, 2023", 5),
];

/** The picker groups events by where they happened, newest home first, as the home page does. */
export const DOCK_GROUPS: { venue: Venue; years: string; tokens: string[] }[] = [
  { venue: "paypal", years: "2017–2019", tokens: ["2019", "2018", "2017"] },
  { venue: "evergreen", years: "2015–2016", tokens: ["2016", "2015"] },
  { venue: "foothill", years: "2006–2014", tokens: ["2014", "2013", "2012", "2011", "2010", "2009", "2008", "2007", "2006"] },
  { venue: "campfire", years: "2021–2023", tokens: ["campfire-1003", "campfire-1002", "campfire-1001"] },
];
