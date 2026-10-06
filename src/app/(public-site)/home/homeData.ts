// REDESIGN-PLAN.md: the home page datasets, taken from the "SVCC Home Redesign" prototype.
// The figures were verified against static-data (2,013 sessions / 930 speakers / 305 returning /
// 17 events / 4,996 people in 2014 / Crockford 12 for 12). The past events' data doesn't change, so they are
// kept here instead of being recomputed at build time.

export type VenueKey = "paypal" | "evergreen" | "foothill" | "campfire";
export type ThemeKey = "cloud" | "web" | "ms" | "mobile" | "java" | "cpp" | "data" | "people" | "google" | "other";

/**
 * [name, mask, sessions, slug, sessions per event, has a photo]. Bit i of mask = spoke at
 * WHO_YEAR_LABELS[i] (2008..2019, then Campfires 1001, 1002, 1003). The slug is the same in every
 * year and ends in the speaker id, which names their photo. "Sessions per event" has one base-36
 * digit for each set bit of mask, oldest first. Most events first. The last three fields are
 * written by scripts/build-home-data.mjs.
 */
export type SpeakerRow = readonly [name: string, mask: number, talks: number, slug: string, per: string, photo: 0 | 1];
/** [track name, sessions, track slug, theme]. */
export type TrackRow = readonly [name: string, sessions: number, slug: string, theme: ThemeKey];
/** [sponsor id, name, size, years label, number of years]. */
export type SponsorRow = readonly [id: number, name: string, size: "l" | "m" | "s", years: string, count: number];

export interface HomeEvent {
  slug: string;
  tile: string;
  mon?: string;
  stamp: string;
  title: string;
  v: VenueKey;
  date: string;
  se: number | null;
  sp: number | null;
  img: number;
}

/** Fallbacks for the --rd-* tokens the canvases read (the logo colors, then the fourth ring color). */
export const COLORS = { ink: "#0c1226", paper: "#ffffff", g: "#39b449", o: "#f7931d", b: "#23abe1", p: "#91268f", p2: "#bb52b8", y: "#ffd23f", speck: "#9fdcf7" };
/** Ring colors on the speaker marks, innermost first: green, orange, blue, light purple. */
export const RING_COLORS = [COLORS.g, COLORS.o, COLORS.b, COLORS.p2];

/** People at the 14 Code Camps, 2006 to 2019. The three online Campfires are not counted (39,096 with them). */
export const PEOPLE = 37954;

export const VENUES: Record<VenueKey, { name: string; years: string }> = {
  paypal: { name: "PayPal Town Hall", years: "2017–2019" },
  evergreen: { name: "Evergreen Valley College", years: "2015–2016" },
  foothill: { name: "Foothill College", years: "2006–2014" },
  campfire: { name: "Online Campfires", years: "2021–2023" },
};

function camp(y: number, v: VenueKey, date: string, se: number | null, sp: number | null, img: number): HomeEvent {
  const yy = String(y).slice(2);
  return { slug: String(y), tile: yy, stamp: "'" + yy, title: "Code Camp " + y, v, date, se, sp, img };
}
function fire(n: number, mon: string, yy: string, title: string, date: string, se: number): HomeEvent {
  return { slug: "campfire-" + n, tile: yy, mon, stamp: "'" + yy, title, v: "campfire", date, se, sp: se, img: n };
}

/** Code Camps newest first, then the three online Campfires. */
export const EVENTS: readonly HomeEvent[] = [
  camp(2019, "paypal", "October 19 & 20, 2019", 106, 97, 14),
  camp(2018, "paypal", "October 13 & 14, 2018", 98, 90, 13),
  camp(2017, "paypal", "October 7 & 8, 2017", 128, 112, 12),
  camp(2016, "evergreen", "October 1 & 2, 2016", 158, 128, 11),
  camp(2015, "evergreen", "October 3 & 4, 2015", 190, 155, 10),
  camp(2014, "foothill", "October 11 & 12, 2014", 221, 185, 9),
  camp(2013, "foothill", "October 5 & 6, 2013", 229, 185, 8),
  camp(2012, "foothill", "October 6 & 7, 2012", 213, 184, 7),
  camp(2011, "foothill", "October 8 & 9, 2011", 209, 175, 6),
  camp(2010, "foothill", "October 9 & 10, 2010", 193, 147, 5),
  camp(2009, "foothill", "October 3 & 4, 2009", 146, 94, 4),
  camp(2008, "foothill", "November 8 & 9, 2008", 111, 78, 3),
  camp(2007, "foothill", "September 2007", null, null, 2),
  camp(2006, "foothill", "September 2006", null, null, 1),
  fire(1003, "Nov", "23", "Software Architecture", "November 18, 2023", 5),
  fire(1002, "Feb", "23", "Everything ChatGPT", "February 25, 2023", 4),
  fire(1001, "Oct", "21", "Managing Programmers", "October 2, 2021", 2),
];

/** Site-relative links for an event (the caller adds basePath). */
export function eventLinks(e: HomeEvent): { l1: string; l1Text: string; l2: string | null } {
  if (e.se == null) return { l1: "/about/" + e.slug + "/", l1Text: "About this year", l2: null };
  return { l1: "/session/" + e.slug + "/", l1Text: "Sessions", l2: "/presenter/" + e.slug + "/" };
}

/** The year cells on the speaker card: bit i of a speaker's mask is cell i. */
export const WHO_YEAR_LABELS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "23", "23"];
/** The event slug behind each year cell, oldest first. This is also the order of the session tiles and of public/home/sessions.json. */
export const WHO_YEAR_SLUGS = ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "campfire-1001", "campfire-1002", "campfire-1003"];
/** What to call year cell i in a sentence: "2014", or "Feb 2023" for a Campfire. */
export function yearName(i: number): string {
  const e = EVENTS.find((x) => x.slug === WHO_YEAR_SLUGS[i]);
  return e && e.mon ? e.mon + " 20" + e.tile : WHO_YEAR_SLUGS[i];
}
/** Site-relative link to a speaker's page for year cell i (the caller adds basePath). */
export function speakerLink(slug: string, i: number): string {
  return "/presenter/" + WHO_YEAR_SLUGS[i] + "/" + slug + "/";
}

export function bits(m: number): number {
  let n = 0;
  while (m) {
    n += m & 1;
    m >>>= 1;
  }
  return n;
}
export function speakerMeta(y: number, talks: number): string {
  return y + (y === 1 ? " event" : " events") + " · " + talks + (talks === 1 ? " session" : " sessions");
}

export const THEMES: ReadonlyArray<readonly [ThemeKey, string]> = [
  ["cloud", "Cloud"],
  ["web", "Web"],
  ["ms", "Microsoft stack"],
  ["mobile", "Mobile"],
  ["java", "Java & JVM"],
  ["cpp", "C++"],
  ["data", "Data & AI"],
  ["people", "Careers & teams"],
  ["google", "Google"],
];
export const THEME_REST = "Silverlight in 2009, Windows 8 in 2012, Kotlin in 2017, React in 2019.";

/** Every track from 2009 to 2019. */
export const TRACKS: Record<string, readonly TrackRow[]> = {
  "2009": [
    ["Agile",5,"agile","people"],
    ["Cloud Computing",3,"cloud-computing-saturday","cloud"],
    ["CloudCamp",6,"cloudcamp-sunday","cloud"],
    ["JavaScript",5,"javascript","web"],
    ["Oracle Fusion Middleware",9,"oracle-fusion-middleware","other"],
    ["Silverlight",5,"silverlight","ms"],
    ["Windows Mobile Dev",7,"windows-mobile-dev","mobile"],
  ],
  "2010": [
    ["Agile",7,"agile","people"],
    ["Cloud",9,"cloud","cloud"],
    ["SharePoint 2010",5,"getting-started-with-development-on-sharepoint-2010","ms"],
    ["Google Developer Tools",8,"google-developer-tools--platforms","google"],
    ["HTML5",7,"html5","web"],
    ["Java",7,"java","java"],
    ["SharePoint Sunday",3,"sharepoint-sunday","ms"],
    ["Web Services",5,"web-services","web"],
    ["Windows Phone 7",9,"windows-phone-7","mobile"],
  ],
  "2011": [
    ["Career",8,"career","people"],
    ["Even More HTML5",4,"even-more-html5-sunday","web"],
    ["Google Developer Tools",8,"google-developer-tools--platforms","google"],
    ["Java",9,"java","java"],
    ["Mobile",9,"mobile","mobile"],
    ["Mobile HTML5",5,"mobile-html5-saturday","web"],
    ["Other Languages on the JVM",8,"other-languages-on-the-jvm","java"],
    ["Windows 8",3,"windows-8-track","ms"],
    ["Windows Azure",5,"windows-azure-saturday","cloud"],
  ],
  "2012": [
    ["Azure Cloud",5,"azure-cloud","cloud"],
    ["C++ and C++11",11,"c-and-c11","cpp"],
    ["Career",6,"career","people"],
    ["Google Developers",8,"google-developers","google"],
    ["NoSQL, APIs & Mobile",5,"intuit-development-presents-nosql-apis--mobile","data"],
    ["Java",8,"java","java"],
    ["MySQL",3,"mysql","data"],
    ["Product Management",2,"product-management-track","people"],
    ["Sencha",4,"sencha","web"],
    ["Windows 8 with JavaScript",5,"windows-8-design-monetization-and-development-with-javascript","ms"],
  ],
  "2013": [
    ["Azure",5,"azure","cloud"],
    ["C++ and C++11",9,"c-and-c11","cpp"],
    ["Google Developers",5,"google-developers","google"],
    ["HTML5, ARIA & Mobile Apps",6,"html5-aria-mobile-apps-by-intuit-development-teams","web"],
    ["Java",5,"java","java"],
    ["Kids",16,"kids","other"],
    ["Business Intelligence & Big Data",9,"microsoft-business-intelligence-and-big-data-by-pass","data"],
    ["Pivotal",8,"pivotal","cloud"],
    ["Sencha",3,"sencha","web"],
    ["SQL Server",9,"sql-server-developers-and-dbas-by-pass","data"],
    ["Windows 8",9,"windows-8","ms"],
    ["Windows Phone",5,"windows-phone","mobile"],
  ],
  "2014": [
    ["C++ is Hot!",11,"c-is-hot","cpp"],
    ["F#: Full Stack Functional",4,"f-full-stack-functional","ms"],
    ["Microsoft Azure",8,"microsoft-azure","cloud"],
    ["Open PaaS Cloud",4,"open-paas-cloud-solution","cloud"],
    ["Pivotal",5,"pivotal","cloud"],
    ["Web Track",6,"web-track","web"],
    ["Windows Client",7,"windows-client","ms"],
  ],
  "2015": [
    ["Gaming & Virtual Reality",4,"build-to-play-gaming--virtual-reality-track","other"],
    ["Web Development",5,"casting-a-wide-net-web-development-track","web"],
    ["Windows 10",3,"the-best-windows-yet-building-for-windows-10","ms"],
    ["Windows Azure",9,"windows-azure","cloud"],
  ],
  "2016": [
    ["IBM Cloud Platform",6,"accelerating-innovation-with-ibm-cloud-platform","cloud"],
    ["Azure",11,"azure","cloud"],
    ["Develop All the Things",7,"develop-all-the-things","other"],
    ["Interactive Technologies",5,"interactive-technologies","other"],
    ["Web and Apps",5,"web-and-apps","web"],
  ],
  "2017": [
    ["Agile",4,"agile","people"],
    ["Azure",7,"azure","cloud"],
    ["C++",5,"c","cpp"],
    ["IBM Cloud",11,"ibm-cloud","cloud"],
    ["Kotlin",3,"kotlin","java"],
    ["Microservices and Containers",5,"microservices-and-containers","cloud"],
    ["Microsoft Development",12,"microsoft-development","ms"],
  ],
  "2018": [
    ["Android Binder",3,"android-device-drivers-with-emphasis-on-android-binder","mobile"],
    ["Containers",5,"containers","cloud"],
    ["HERE Technologies",2,"here-technologies","other"],
    ["IBM Cloud",3,"ibm-cloud","cloud"],
    ["JavaScript",6,"javascript","web"],
    ["Machine Learning & AI",5,"machine-learning---ai","data"],
    ["Management",5,"management","people"],
    ["Microservices",5,"microservices","cloud"],
    ["Mobile",4,"mobile","mobile"],
    ["Speaker Panels",3,"speaker-panels","people"],
  ],
  "2019": [
    ["Agile",5,"agile","people"],
    ["AI and Machine Learning",6,"ai-and-machine-learning","data"],
    ["IBM",11,"ibm","cloud"],
    ["Interview Kickstart",6,"interview-kickstart","people"],
    ["Management",6,"management","people"],
    ["React",6,"react","web"],
    ["Samsung Wearables",2,"samsung-wearables","mobile"],
  ],
};
/** Track years, newest first. */
export const TRACK_YEARS: readonly string[] = Object.keys(TRACKS).sort().reverse();
/** For each theme, the number of years it had a track. */
export const THEME_COUNT = Object.fromEntries(
  THEMES.map(([k]) => [k, TRACK_YEARS.filter((y) => TRACKS[y].some((t) => t[3] === k)).length]),
) as Record<ThemeKey, number>;
export function themeSay(t: ThemeKey | null): string {
  if (!t) return THEME_REST;
  const label = THEMES.find((th) => th[0] === t)?.[1] ?? t;
  const n = THEME_COUNT[t];
  const total = TRACK_YEARS.length;
  return label + (n === total ? " was a track in every one of the " + total + " years." : " was a track in " + n + " of the " + total + " years.");
}

export const SPONSORS: readonly SponsorRow[] = [
  [747,"Microsoft","l","2008–2017",10],
  [918,"Dropbox","m","2014",1],
  [735,"Google","l","2009–2017",9],
  [729,"JetBrains","m","2010–2018",9],
  [792,"Cloud Foundry","s","2011–2012",2],
  [902,"IBM","l","2014–2019",6],
  [718,"Adobe","m","2012, 2016",2],
  [748,"PayPal","l","2009–2011, 2013–2015, 2017–2019",9],
  [785,"TiVo","m","2011",1],
  [781,"10gen","s","2011",1],
  [761,"Facebook","l","2009",1],
  [855,"O'Reilly","m","2013",1],
  [739,"Box","m","2010–2013",4],
  [764,"LinkedIn","l","2008–2009",2],
  [788,"Lumosity","s","2011",1],
  [939,"Neo4j","m","2014",1],
  [746,"Oracle","l","2008–2013",6],
  [817,"HP","m","2012–2013",2],
  [807,"Dr. Dobb's","s","2012",1],
  [708,"Twilio","l","2010–2012, 2014–2019",9],
  [737,"Yahoo Developer Network","m","2010",1],
  [849,"New Relic","m","2015",1],
  [962,"Samsung Developer Program","l","2015, 2018–2019",3],
  [784,"Bitbucket","s","2011",1],
  [815,"Intuit","m","2012–2013",2],
  [981,"Okta","l","2017",1],
  [723,"Palm","m","2010",1],
  [989,"HERE","s","2017–2018",2],
  [948,"Couchbase","m","2015, 2017",2],
  [854,"HTC","m","2013",1],
  [744,"Carnegie Mellon University Silicon Valley","s","2013",1],
  [861,"Pivotal","m","2013–2014",2],
  [791,"Pluralsight","m","2017–2019",3],
  [995,"Real World React","s","2019",1],
  [960,"Redis Labs","m","2015",1],
  [834,"OpenShift by Red Hat","m","2014",1],
  [752,"Sprint Developer Program","s","2009–2010, 2012",3],
  [991,"Redfin","m","2018",1],
  [799,"AT&T Developer Program","m","2012, 2014–2015",3],
  [725,"Dice","s","2010–2013, 2016",5],
  [917,"Xero","m","2014",1],
  [994,"Algorand","m","2019",1],
  [983,"Thermo Fisher Scientific","s","2017",1],
  [821,"Esri","s","2012–2014",3],
];

export const SPEAKERS: readonly SpeakerRow[] = [
  ["Douglas Crockford",4095,26,"douglas-crockford-1124","222222222332",1], ["Dave Nielsen",3583,32,"dave-nielsen-187","26811232331",1], ["Arun Gupta",3839,25,"arun-gupta-1269","33321343111",1],
  ["Roman Zhovtulya",2047,18,"roman-zhovtulya-32","22222221111",1], ["Wesley Chun",3551,21,"wesley-chun-251","2343212121",1], ["Siamak Ashrafi",4092,17,"siamak-ashrafi-410","1111222232",1],
  ["Robin Shahan",2046,16,"robin-shahan-1533","1322211211",1], ["Deborah Kurata",1023,13,"deborah-kurata-653","2121112111",1], ["Theo Jungeblut",3068,22,"theo-jungeblut-1405","222233332",1],
  ["Mathias Brandewinder",511,18,"mathias-brandewinder-583","222322212",1], ["Ted Young",3503,16,"ted-young-1211","331112122",1], ["Ron Lichty",8176,15,"ron-lichty-2920","122211231",1],
  ["Bruno Terkaly",895,11,"bruno-terkaly-565","122111111",1], ["Steve Mylroie",4088,11,"steve-mylroie-391","212111111",1], ["Manish Pandit",1790,10,"manish-pandit-1430","112111111",1],
  ["Stephen Chin",510,21,"stephen-chin-1419","11413452",1], ["Doris Chen",1020,16,"doris-chen-4087","12222232",1], ["Steve Evans",503,16,"steve-evans-385","23322112",1],
  ["Oswald Campesato",2040,15,"oswald-campesato-953","33212211",1], ["Chris Richardson",4080,12,"chris-richardson-8590","12211131",1], ["David McCarter",1016,19,"david-mccarter-5995","3334231",1],
  ["Dave Briccetti",127,16,"dave-briccetti-1078","1332142",1], ["Beth Massi",223,15,"beth-massi-1995","3232221",1], ["Gayle McDowell",2032,13,"gayle-mcdowell-8367","1122223",1],
  ["Juval Lowy",17330,13,"juval-lowy-1415","2222221",1], ["Massimo Paolini",254,12,"massimo-paolini-2867","1322211",1], ["Bernie Maloney",508,9,"bernie-maloney-3768","1112211",1],
  ["Ramnivas Laddad",2238,9,"ramnivas-laddad-1426","3111111",1], ["Ward Bell",382,9,"ward-bell-2000","1211121",1], ["Kevin Nilson",1255,8,"kevin-nilson-823","1121111",1],
  ["Nima Dilmaghani",191,7,"nima-dilmaghani-1164","1111111",1], ["Sunil Sabat",4064,7,"sunil-sabat-2925","1111111",1], ["Jon Kalb",1656,12,"jon-kalb-7164","133221",1],
  ["Mark Abramson",760,10,"mark-abramson-5443","222211",1], ["Craig Berntson",1512,8,"craig-berntson-5996","221111",1], ["Llewellyn Falco",2362,8,"llewellyn-falco-3133","211112",1],
  ["Eugene Chuvyrov",2016,7,"eugene-chuvyrov-10803","111112",1], ["Manoj Kumar",486,7,"manoj-kumar-672","121111",1], ["Sastry Vedantam",3696,6,"sastry-vedantam-8637","111111",1],
  ["Daniel Egan",872,14,"daniel-egan-6414","22352",1], ["Jeremy Clark",496,11,"jeremy-clark-8502","22322",1], ["Jeremy Foster",1456,11,"jeremy-foster-8345","32231",1],
  ["Nuri Halperin",3520,9,"nuri-halperin-19830","12222",1], ["Ami Levin",3744,8,"ami-levin-11243","21212",1], ["Athol Foden",62,8,"athol--foden-1453","11222",1],
  ["Matt Harrington",248,7,"matt-harrington-913","11221",1], ["Sumant Tambe",752,7,"sumant-tambe-8503","21211",1], ["Paul Cassidy",110,6,"paul-cassidy-697","12111",1],
  ["Ron Kleinman",19713,6,"ron-kleinman-620","11112",1], ["Russell Fustino",3128,6,"russell-fustino-6353","21111",1], ["Troy Miles",1888,6,"troy-miles-10801","12111",1],
  ["Bill Enright",1264,5,"bill-enright-8573","11111",1], ["David Spark",1592,5,"david-spark-4509","11111",1], ["Neil Mackenzie",248,5,"neil-mackenzie-3608","11111",1],
  ["Nik Kalyani",1067,5,"nik-kalyani-1278","11111",1], ["Sam Bowne",992,5,"sam-bowne-10812","11111",1], ["Lino Tadros",15,13,"lino-tadros-529","2344",1],
  ["Soham Mehta",3840,9,"soham-mehta-8668","1116",1], ["Steve Bockman",58,9,"steve-bockman-3019","4212",1], ["Gene Snider",92,8,"gene-snider-4276","2222",1],
  ["Jerry Nixon",8800,7,"jerry-nixon-11370","2221",1], ["Todd McLeod",2944,7,"todd-mcleod-11625","1222",1], ["Uday Gajendar",29,7,"uday-gajendar-411","1222",1],
  ["Alice Pang",120,6,"alice-pang-4442","1221",1], ["Devin Rader",240,6,"devin-rader-8006","1221",1], ["John Waters",30,6,"john-waters-2852","2211",1],
  ["Pieter Humphrey",15,6,"pieter-humphrey-194","1212",1], ["Tobiah Zarlez",960,6,"tobiah-zarlez-12591","2112",1], ["Antony Ross",3840,5,"antony-ross-10808","1211",1],
  ["Hien Luu",2566,5,"hien-luu-2991","1112",1], ["Peter Kellner",16454,5,"peter-kellner-903","2111",1], ["Peter Thoeny",1672,5,"peter-thoeny-5364","2111",1],
  ["Rakesh Ranjan",960,5,"rakesh-ranjan-21405","1112",1], ["Ramona Maxwell",1728,5,"ramona-maxwell-4816","1211",1], ["Ryan Greenlee",643,5,"ryan-greenlee-509","2111",1],
  ["Slava Imeshev",281,5,"slava-imeshev-169","1121",1], ["Vlad Patryshev",116,5,"vlad-patryshev-4121","1121",1], ["Cindy Solomon",624,4,"cindy-solomon-5062","1111",1],
  ["Claudia Galvan",3456,4,"claudia-galvan-14918","1111",1], ["James Williams",43,4,"james-williams-1357","1111",1], ["Martin Omander",3084,4,"martin-omander-4395","1111",1],
  ["Ryan Michela",960,4,"ryan-michela-13162","1111",1], ["Sean Murphy",54,4,"sean-murphy-1499","1111",1], ["Tom Becker",2704,4,"tom-becker-8575","1111",1],
  ["Chris Sims",38,7,"chris-sims-1661","322",1], ["Pradeep Bhatter",448,7,"pradeep-bhatter-17453","322",1], ["Andres Almiray",25,6,"andres-almiray-1221","321",1],
  ["Jeancarl Bisson",896,6,"jeancarl-bisson-2885","114",1], ["Aditya Gupta",448,5,"aditya-gupta-11541","221",1], ["Anoop Trivedi",448,5,"anoop-trivedi-17478","221",1],
  ["Bary Nusz",28,5,"bary-nusz-3983","311",1], ["Bhakti Mehta",112,5,"bhakti-mehta-8473","221",1], ["Brad Irby",1044,5,"brad-irby-1725","122",1],
  ["Eishay Smith",22,5,"eishay-smith-14","212",1], ["Jessica Deen",896,5,"jessica-deen-36223","122",1], ["Jonathan LeBlanc",112,5,"jonathan-leblanc-8228","122",1],
  ["Lynn Langit",11,5,"lynn-langit-1252","113",1], ["Marek Sadowski",3584,5,"marek--sadowski-46014","212",1], ["Michael Galpin",14,5,"michael-galpin-100","221",1],
  ["Bess Ho",7,4,"bess-ho-571","211",1], ["Gabi Zuniga",328,4,"gabi-zuniga-110","211",1], ["Joseph Ackerman",7,4,"joseph-ackerman-753","121",1],
  ["Kenny Spade",28,4,"kenny-spade-203","211",1], ["Kirsten Hunter",200,4,"kirsten-hunter-6464","112",1], ["Lenny Markus",672,4,"lenny-markus-11661","121",1],
  ["Nic Raboy",1664,4,"nic-raboy-32901","211",1], ["Shadaj Laddad",224,4,"shadaj-laddad-11098","112",1], ["Sidney Maestre",56,4,"sidney-maestre-5989","121",1],
  ["Tim Child",536,4,"tim-child-731","121",1], ["Vishal Saxena",448,4,"vishal-saxena-18613","112",1], ["Adwait Ullal",1168,3,"adwait-ullal-370","111",1],
  ["Alyson Harrold",112,3,"alyson-harrold-7997","111",1], ["Bill Glosser",224,3,"bill-glosser-821","111",1], ["Bruce Schechter",56,3,"bruce-schechter-1620","111",1],
  ["Daniel Coupal",448,3,"daniel-coupal-2978","111",1], ["Elena Eberhard",448,3,"elena-eberhard-15080","111",1], ["Eric Courville",704,3,"eric-courville-17424","111",1],
  ["Gautam Gupta",3584,3,"gautam-gupta-43911","111",1], ["Greg Geracie",112,3,"greg-geracie-8684","111",1], ["Jennelle Crothers",896,3,"jennelle-crothers-36228","111",1],
  ["Jerry Kurata",832,3,"jerry-kurata-225","111",1], ["Jim Driscoll",74,3,"jim-driscoll-539","111",1], ["Joel Champagne",100,3,"joel-champagne-4503","111",1],
  ["John Brinnand",200,3,"john-brinnand-6417","111",1], ["John David Duncan",168,3,"john-david-duncan-6558","111",1], ["Joseph Reynolds",224,3,"joseph-reynolds-10398","111",1],
  ["Manoj Agarwal",2432,3,"manoj-agarwal-32604","111",1], ["Marshall Clow",112,3,"marshall-clow-8294","111",1], ["Masashi Katsumata",336,3,"masashi-katsumata-6582","111",1],
  ["Mike North",1664,3,"mike-north-39062","111",1], ["Mohit Goenka",2816,3,"mohit-goenka-8891","111",1], ["Paran Sonthalia",448,3,"paran-sonthalia-9274","111",1],
  ["Paras Wadehra",104,3,"paras-wadehra-1434","111",1], ["Pragati Rai",76,3,"pragati--rai-4231","111",1], ["Rahul Agarwal",70,3,"rahul-agarwal-3073","111",1],
  ["Raju Shreewastava",2688,3,"raju-shreewastava-37898","111",1], ["Randall Degges",704,3,"randall-degges-20985","111",1], ["Randy Shen",28,3,"randy--shen-4478","111",1],
  ["Ratnakar Malla",196,3,"ratnakar-malla-2059","111",1], ["Roy Yu",224,3,"roy-yu-5083","111",1], ["Scott Stanfield",13,3,"scott-stanfield-302","111",1],
  ["Steven Chamberlin",448,3,"steven-chamberlin-21406","111",1], ["Steven Hoffman",224,3,"steven-hoffman-6765","111",1], ["Suyash Joshi",1296,3,"suyash-joshi-3305","111",1],
  ["Tam Nguyen",448,3,"tam-nguyen-3701","111",1], ["Tammy Baker",19456,3,"tammy-baker-1530","111",1], ["Zafar Shahid",3584,3,"zafar-shahid-44431","111",1],
  ["Robert Biggs",3,6,"robert-biggs-451","24",1], ["Lynn Langit",48,5,"lynn-langit-7983","23",1], ["Abdelmonaim Remani",3,4,"abdelmonaim-remani-613","22",1],
  ["Andrew Moll",384,4,"andrew-moll-36196","31",1], ["Duane Nickull",12,4,"duane-nickull-4540","22",1], ["Patrick Mundy",96,4,"patrick-mundy-11337","13",1],
  ["Alex Ruiz",5,3,"alex-ruiz-155","12",1], ["Ben Hoelting",48,3,"ben-hoelting-8629","21",1], ["Beth Massi",288,3,"beth-massi-552","21",1],
  ["Bill Venners",3,3,"bill-venners-718","21",1], ["Bryan Hughes",1536,3,"bryan-hughes-45872","12",1], ["Chander Dhall",288,3,"chander-dhall-10913","12",1],
  ["David Pollak",3,3,"david-pollak-297","21",0], ["Estelle Weyl",24,3,"estelle-weyl-4761","21",1], ["Josh Long",96,3,"josh-long-11212","21",1],
  ["Karl Beutner",24,3,"karl-beutner-6236","21",1], ["Lance Bullock",12,3,"lance-bullock-3984","21",1], ["Livi Erickson",384,3,"livi-erickson-36201","12",1],
  ["Mark Miller",36,3,"mark-miller-3987","12",1], ["Matt Ingenthron",130,3,"matt-ingenthron-3211","12",1], ["Menka Gupta",192,3,"menka-gupta-11573","21",1],
  ["Michael Litchard",40,3,"michael-litchard-3483","12",1], ["Mickey Mantle",5120,3,"mickey-mantle-18805","21",1], ["Noel Rice",24,3,"noel-rice-572","21",1],
  ["Philip Japikse",48,3,"philip-japikse-8620","21",1], ["Richard Haven",20,3,"richard-haven-4080","21",1], ["Ronn Black",6,3,"ronn-black-545","12",1],
  ["Ryan Riley",192,3,"ryan-riley-17364","21",1], ["Symon Chang",5,3,"symon-chang-482","21",1], ["Tab Atkins Jr.",20,3,"tab-atkins-jr-4508","21",1],
  ["Van Riper",3,3,"van-riper-592","21",1], ["Vidal Graupera",3072,3,"vidal-graupera-46667","12",1], ["Woody Pewitt",12,3,"woody-pewitt-4720","12",1],
  ["shay shmeltzer",3,3,"shay-shmeltzer-177","12",1], ["Aaron Sahagun",3072,2,"aaron-sahagun-46749","11",1], ["Aaron Schlesinger",288,2,"aaron-schlesinger-10267","11",1],
  ["Abbas Raza",24,2,"abbas-raza-1214","11",1], ["Abhinav Shroff",1536,2,"abhinav-shroff-44372","11",1], ["Andrew Bellay",1152,2,"andrew-bellay-7840","11",1],
  ["Andrew Karcher",3072,2,"andrew-karcher-44419","11",1], ["Andrew Webster",2560,2,"andrew-webster-45758","11",1], ["Ansel Halliburton",192,2,"ansel-halliburton-2505","11",1],
  ["Arivoli Tirouvingadame",40,2,"arivoli-tirouvingadame-6494","11",1], ["Ariya Hidayat",48,2,"ariya-hidayat-8299","11",1], ["Arthur O'Dwyer",576,2,"arthur-odwyer-8764","11",1],
  ["Bala Paranj",3,2,"bala-paranj-1276","11",0], ["Baruch Sadogursky",384,2,"baruch-sadogursky-37923","11",1], ["Basil Shikin",768,2,"basil-shikin-43097","11",1],
  ["Ben Foden",516,2,"ben-foden-3299","11",1], ["Bill Scott",18,2,"bill-scott-2875","11",1], ["Bob Zeidman",96,2,"bob-zeidman-106","11",1],
  ["Breandan Considine",320,2,"breandan-considine-15075","11",1], ["Chris Schalk",6,2,"chris-schalk-3347","11",1], ["Christopher Bedford",2052,2,"christopher-bedford-4236","11",1],
  ["Christopher Rhodes",96,2,"christopher-rhodes-11334","11",1], ["Claudia Galvan",576,2,"claudia-galvan-18653","11",1], ["Corey Weathers",1536,2,"corey-weathers-45737","11",1],
  ["Craig Russell",40,2,"craig-russell-6560","11",1], ["Dan Holevoet",48,2,"dan-holevoet-8679","11",1], ["Dario Laverde",48,2,"dario-laverde-8479","11",1],
  ["Derrick Burke",48,2,"derrick-burke-8285","11",1], ["Don Robins",3,2,"don-robins-159","11",1], ["Donn Lee",640,2,"donn-lee-11752","11",1],
  ["Donovan Follette",12,2,"donovan-follette-4370","11",1], ["Doris Chen",3,2,"doris-chen-65","11",1], ["Doug Goldie",132,2,"doug-goldie-4241","11",1],
  ["Ed Sweeney",24,2,"ed-sweeney-6005","11",1], ["Elaine Wherry",48,2,"elaine-wherry-8704","11",1], ["Forbes Hedges",384,2,"forbes-hedges-37723","11",1],
  ["Greg Stachnick",6,2,"greg-stachnick-2921","11",0], ["Guinder Bhangoo",3072,2,"guinder-bhangoo-46187","11",1], ["Guy Vider",544,2,"guy-vider-6395","11",1],
  ["J. Tower",24,2,"j-tower-5988","11",1], ["Jack Fox",80,2,"jack-fox-8689","11",1], ["Jae Yang",192,2,"jae-yang-9715","11",1],
  ["James Tatum",24,2,"james-tatum-5351","11",1], ["Jamini Samantaray",48,2,"jamini-samantaray-5750","11",1], ["Jarek Wilkiewicz",12,2,"jarek-wilkiewicz-4413","11",1],
  ["Jennifer Wong",24,2,"jennifer-wong-4553","11",1], ["Jeremy Walker",48,2,"jeremy-walker-8482","11",1], ["Jim Downey",3,2,"jim-downey-22","11",1],
  ["Joe Mayo",258,2,"joe-mayo-1497","11",1], ["Joe Sondow",40,2,"joe-sondow-4037","11",1], ["Joe Wells",96,2,"joe--wells-11401","11",1],
  ["Jon Reid",2560,2,"jon-reid-43243","11",1], ["Jorg Janke",192,2,"jorg-janke-4578","11",1], ["Juanita Dion-Chiang",3072,2,"juanita-dion-chiang-45927","11",1],
  ["Juris Vecvanags",48,2,"juris-vecvanags-8645","11",1], ["Kathryn Hurley",12,2,"kathryn-hurley-4431","11",0], ["Keith Aytch",384,2,"keith-aytch-37868","11",1],
  ["Keithen Hayenga",40,2,"keithen-hayenga-7159","11",1], ["Ken Rutsky",272,2,"ken-rutsky-8205","11",1], ["Ken Yagen",6,2,"ken-yagen-1032","11",1],
  ["Kevin Ashley",80,2,"kevin-ashley-8480","11",1], ["Kevin Van Gundy",384,2,"kevin-van-gundy-36101","11",1], ["Lena Tran",384,2,"lena-tran-37645","11",1],
  ["Luba Gloukhova",3072,2,"luba-gloukhova-41582","11",1], ["Luca Candela",160,2,"luca-candela-6444","11",1], ["MAULIN VASAVADA",3072,2,"maulin-vasavada-46865","11",1],
  ["Manu Mukerji",12,2,"manu-mukerji-4219","11",1], ["Marcus Stephan",1536,2,"marcus-stephan-25761","11",1], ["Mary Mills",24,2,"mary-mills-6449","11",1],
  ["Megan O'Neill",576,2,"megan-oneill-9576","11",1], ["Michael Caisse",96,2,"michael-caisse-11106","11",1], ["Michael Carter",5,2,"michael-carter-160","11",1],
  ["Mike Baily",24,2,"mike-baily-6575","11",1], ["Mike Borozdin",48,2,"mike-borozdin-6189","11",1], ["Mohammed Guller",384,2,"mohammed-guller-28462","11",1],
  ["Muhammad Siddiqi",544,2,"muhammad-siddiqi-10871","11",1], ["Naga Addagadde",48,2,"naga-addagadde-8705","11",1], ["Nagappan Alagappan",24,2,"nagappan-alagappan-6061","11",1],
  ["Nate Barbettini",768,2,"nate-barbettini-41355","11",1], ["Newton Chan",6,2,"newton-chan-1128","11",1], ["Nicholas Vargas",384,2,"nicholas-vargas-24588","11",1],
  ["Nikita IVANOV",12,2,"nikita-ivanov-3968","11",1], ["Nilesh Junnarkar",3,2,"nilesh-junnarkar-550","11",1], ["Nir Alfasi",2176,2,"nir-alfasi-9018","11",1],
  ["PJ Gupta",136,2,"pj-gupta-341","11",1], ["Paul Bertucci",160,2,"paul-bertucci-11366","11",1], ["Paul Everitt",1280,2,"paul-everitt-41808","11",1],
  ["Paul Hacker",1280,2,"paul-hacker-41315","11",1], ["Peter Pilgrim",24,2,"peter-pilgrim-6326","11",1], ["Poornima Vijayashanker",3,2,"poornima-vijayashanker-961","11",1],
  ["Randall Koutnik",768,2,"randall-koutnik-41650","11",1], ["Riccardo Terrell",320,2,"riccardo-terrell-18752","11",1], ["Ron Vergis",96,2,"ron-vergis-921","11",1],
  ["Rowan-James Tran",384,2,"rowan-james-tran-36206","11",1], ["Ryan Jarvinen",96,2,"ryan-jarvinen-10286","11",1], ["Ryan Singer",36,2,"ryan-singer-5272","11",1],
  ["Saishruthi Swaminathan",3072,2,"saishruthi-swaminathan-46861","11",1], ["Samantha Langit",48,2,"samantha-langit-7989","11",1], ["Sanjana Shah",384,2,"sanjana-shah-27993","11",1],
  ["Sanjeev Mishra",48,2,"sanjeev-mishra-5101","11",1], ["Sara Ford",768,2,"sara-ford-27961","11",1], ["Scott Haines",2056,2,"scott-haines-6300","11",1],
  ["Scott Smith",192,2,"scott-smith-10295","11",1], ["Sebastian Stadil",12,2,"sebastian-stadil-4524","11",1], ["Seth Ladd",48,2,"seth-ladd-8135","11",1],
  ["Shamod Lacoul",6,2,"shamod-lacoul-888","11",1], ["Shaun Abram",1152,2,"shaun-abram-777","11",1], ["Sherman Lee",96,2,"sherman-lee-10569","11",1],
  ["Simon Law",24,2,"simon-law-6619","11",1], ["Sridhar Reddy",65,2,"sridhar-reddy-502","11",1], ["Stephen Boesch",192,2,"stephen-boesch-2872","11",1],
  ["Steve Marx",96,2,"steve-marx-10983","11",1], ["Steve Souders",1032,2,"steve-souders-6548","11",1], ["Steven Pousty",96,2,"steven-pousty-488","11",1],
  ["Sudha Jamthe",9,2,"sudha-jamthe-80","11",1], ["Sungyeol Choi",1536,2,"sungyeol-choi-12474","11",1], ["Ted Drake",48,2,"ted-drake-8586","11",1],
  ["Tim Hobson",96,2,"tim-hobson-11306","11",1], ["Tony Nguyen",3072,2,"tony-nguyen-1014","11",1], ["Una Daly",12,2,"una-daly-4364","11",1],
  ["Upkar Lidder",3072,2,"upkar-lidder-46677","11",1], ["Vasu Durgavarjhula",24,2,"vasu-durgavarjhula-4054","11",1], ["Vic Cekvenich",3,2,"vic-cekvenich-1299","11",0],
  ["Vince Mansel",48,2,"vince-mansel-7248","11",1], ["Yorick Phoenix",192,2,"yorick-phoenix-11757","11",1], ["giovanni gallucci",2,10,"giovanni-gallucci-3153","a",1],
  ["Daniel Egan",4,8,"daniel-egan-4759","8",0], ["Christine Matheney",128,6,"christine--matheney-12586","6",1], ["Neil Brown",32,4,"neil-brown-11514","4",1],
  ["Paul King",1,4,"paul-king-907","4",1], ["Jim Bears",16,3,"jim-bears-8504","3",1], ["Will Strohl",4,3,"will-strohl-3986","3",1],
  ["Adam Tuliper",32,2,"adam-tuliper-11140","2",1], ["Alex Keh",8,2,"alex-keh-6489","2",1], ["Annie Bubinski",256,2,"annie-bubinski-39907","2",1],
  ["Ash DCosta",16,2,"ash-dcosta-8235","2",1], ["Brian Kennish",2,2,"brian-kennish-3319","2",1], ["Burr Sutter",1024,2,"burr-sutter-46688","2",1],
  ["Cal Schrotenboer",1,2,"cal-schrotenboer-1081","2",1], ["Cornelia Davis",64,2,"cornelia-davis-21151","2",1], ["Danielle Morrill",4,2,"danielle-morrill-5786","2",0],
  ["Danny Riddell",8,2,"danny-riddell-7570","2",0], ["Daren May",512,2,"daren-may-45807","2",1], ["Dave Nugent",2048,2,"dave-nugent-16170","2",1],
  ["Dave Stokes",16,2,"dave-stokes-8583","2",1], ["Diego Lizarazo Rivera",2048,2,"diego-lizarazo-rivera-47503","2",1], ["Emil Ong",1,2,"emil-ong-928","2",1],
  ["Eric Braun",2048,2,"eric-braun-273","2",1], ["Guido Rosso",8,2,"guido-rosso-7381","2",0], ["Hugo Kornelis",32,2,"hugo-kornelis-11346","2",1],
  ["Ike Ellis",32,2,"ike-ellis-10607","2",1], ["James Pearce",8,2,"james-pearce-6547","2",1], ["Jason Mauer",1,2,"jason-mauer-1222","2",1],
  ["Jerry Cellilo",4,2,"jerry-cellilo-4291","2",1], ["Jerry Krikheli",2048,2,"jerry-krikheli-47323","2",1], ["Jim Weaver",32,2,"jim-weaver-10622","2",1],
  ["Joe Rowley",256,2,"joe-rowley-37731","2",1], ["Jorge Garifuna",16,2,"jorge-garifuna-8287","2",0], ["Julien Wetterwald",4,2,"julien-wetterwald-1763","2",0],
  ["Justin James",128,2,"justin-james-30461","2",1], ["Justin Woo",128,2,"justin-woo-36216","2",1], ["Kai Wu",64,2,"kai-wu-18656","2",1],
  ["Karl Shifflett",1,2,"karl-shifflett-1083","2",1], ["Katherine Harris",128,2,"katherine-harris-30656","2",1], ["Keith Sutton",2,2,"keith-sutton-2845","2",1],
  ["Keith Sutton",8,2,"keith-sutton-6363","2",1], ["Kevin Boles",128,2,"kevin-boles-30473","2",1], ["Kristan Uccello",16,2,"kristan-uccello-8701","2",1],
  ["Lars Thorup",8,2,"lars-thorup-6056","2",1], ["Leslie Stevens-Huffman",8,2,"leslie-stevens-huffman-6518","2",1], ["Mano Marks",4,2,"mano-marks-4429","2",0],
  ["Marcus Blankenship",2048,2,"marcus-blankenship-46678","2",1], ["Mark Simms",64,2,"mark-simms-17473","2",1], ["Mark Tabladillo",32,2,"mark-tabladillo-11113","2",1],
  ["Masa K Maeda",4,2,"masa-k-maeda-3252","2",1], ["Matthew Burnett",4,2,"matthew-burnett-4363","2",0], ["Matthew Neeley",16,2,"matthew-neeley-8068","2",1],
  ["Mehul Harry",32,2,"mehul-harry-5890","2",1], ["Michael Lucaccini",8,2,"michael-lucaccini-6621","2",0], ["Pascal-Louis Perez",4,2,"pascal-louis-perez-4004","2",1],
  ["Paul Litwin",4,2,"paul-litwin-4092","2",1], ["Paul Sheriff",8,2,"paul-sheriff-462","2",1], ["Paul Stubbs",4,2,"paul-stubbs-4361","2",1],
  ["Peter Niederwieser",16,2,"peter-niederwieser-8617","2",1], ["Praveen Alavilli",4,2,"praveen-alavilli-4129","2",1], ["Raheel Zubairy",512,2,"raheel-zubairy-46056","2",1],
  ["Rani Desai",256,2,"rani-desai-43332","2",1], ["Rinat Shagisultanov",2,2,"rinat-shagisultanov-2974","2",1], ["Rob Vieira",1024,2,"rob-vieira-46645","2",1],
  ["Roshan Naik",16,2,"roshan-naik-8428","2",0], ["Ryan Wick",4,2,"ryan-wick-4410","2",1], ["Sachet Hegde",512,2,"sachet-hegde-46090","2",1],
  ["Sara Ford",8,2,"sara-ford-6119","2",1], ["Shaun O'Brien",4,2,"shaun-obrien-4108","2",1], ["Somik Raha",64,2,"somik-raha-11711","2",1],
  ["Stefania Kaczmarczyk",256,2,"stefania-kaczmarczyk-43102","2",1], ["Steve Andrews",4,2,"steve-andrews-4427","2",1], ["Steve Putz",64,2,"steve-putz-6163","2",1],
  ["Steve Trefethen",2,2,"steve-trefethen-1347","2",1], ["Steven Edouard",64,2,"steven-edouard-16209","2",1], ["Sujee Maniyam",64,2,"sujee-maniyam-12015","2",1],
  ["Tenaya Hurst",64,2,"tenaya-hurst-18792","2",1], ["Thomas Mueller",8,2,"thomas-mueller-6159","2",0], ["Tim Reilly",256,2,"tim-reilly-37321","2",1],
  ["Timothy Ng",1,2,"timothy-ng-179","2",0], ["Tracy Lee",256,2,"tracy-lee-41649","2",1], ["Travis Cook",512,2,"travis-cook-46086","2",1],
  ["Yannis Minadakis",2048,2,"yannis-minadakis-47538","2",1], ["monu pradhan",512,2,"monu-pradhan-46069","2",1], ["pyounguk cho",1,2,"pyounguk-cho-686","2",0],
  ["sara ford",4,2,"sara-ford-1508","2",1], ["sharan kadagad",512,2,"sharan-kadagad-46138","2",1], ["ASHISH KELKAR",8,1,"ashish-kelkar-6534","1",0],
  ["Aaditya Bhatia",4,1,"aaditya-bhatia-2888","1",1], ["Aaron Griffith",128,1,"aaron-griffith-8966","1",1], ["Aaron Sahagun",4,1,"aaron-sahagun-4732","1",1],
  ["Aarti Parikh",1024,1,"aarti-parikh-47181","1",1], ["Adam Anderson",16,1,"adam-anderson-6517","1",1], ["Adam Kalsey",4,1,"adam-kalsey-4512","1",1],
  ["Adam Rosien",4,1,"adam-rosien-4110","1",0], ["Adam Sbeta",2048,1,"adam-sbeta-44142","1",1], ["Agnew Kernalinux",128,1,"agnew-kernalinux-18687","1",1],
  ["Ahmed Charles",32,1,"ahmed-charles-11090","1",1], ["Aidan Ryan",32,1,"aidan-ryan-10721","1",1], ["Ajoy Chattopadhyay",16,1,"ajoy-chattopadhyay-8722","1",0],
  ["Akansh Murthy",512,1,"akansh-murthy-41638","1",1], ["Aki Taha",16,1,"aki-taha-8655","1",1], ["Akshaya Mahapatra",32,1,"akshaya-mahapatra-3605","1",1],
  ["Alan Cobb",1,1,"alan-cobb-579","1",1], ["Alan Cobb",4,1,"alan-cobb-4795","1",1], ["Alan Souza",128,1,"alan-souza-12960","1",1],
  ["Albert Chen",4,1,"albert-chen-4304","1",1], ["Alejandra Quetzalli",1024,1,"alejandra-quetzalli-46642","1",1], ["Alex Donn",64,1,"alex-donn-21162","1",1],
  ["Alex Fabijanic",16,1,"alex-fabijanic-8696","1",1], ["Alex Peake",16,1,"alex-peake-8509","1",1], ["Alexander Graebe",64,1,"alexander-graebe-19920","1",1],
  ["Ali Afshar",16,1,"ali-afshar-8688","1",1], ["Alison Chaiken",8,1,"alison-chaiken-378","1",1], ["Allan Sahagun",4,1,"allan-sahagun-4733","1",0],
  ["Alok Govil",64,1,"alok-govil-1273","1",1], ["Alok Sonthalia",1,1,"alok-sonthalia-819","1",0], ["Amarnath Kulkarni",2048,1,"amarnath-kulkarni-47223","1",1],
  ["Amir Barylko",512,1,"amir-barylko-45627","1",1], ["Amit Chachra",16,1,"amit--chachra-4500","1",1], ["Amit Sarkar",4,1,"amit-sarkar-3415","1",1],
  ["Amrit Jassal",16,1,"amrit-jassal-8609","1",1], ["Anand Raja",16,1,"anand-raja-8984","1",1], ["Andreas Kollegger",16,1,"andreas-kollegger-8533","1",0],
  ["Andrew Brogdon",1024,1,"andrew-brogdon-46626","1",1], ["Andrew Champagne",1024,1,"andrew-champagne-45466","1",1], ["Andrew Eichenbaum",64,1,"andrew-eichenbaum-18713","1",1],
  ["Andrew Siemer",64,1,"andrew-siemer-21436","1",1], ["Andrey Nikiforov",16,1,"andrey-nikiforov-8576","1",0], ["Angel Abundez",32,1,"angel-abundez-10984","1",1],
  ["Ansel Sermersheim",256,1,"ansel-sermersheim-21062","1",1], ["Anthony Bishopric",16,1,"anthony-bishopric-8664","1",1], ["Anthony Fabbricino",128,1,"anthony-fabbricino-37707","1",1],
  ["Anthony van der Hoorn",64,1,"anthony-van-der-hoorn-17385","1",1], ["Antoine Boulanger",8,1,"antoine-boulanger-6180","1",1], ["Aravind Kalavagattu",2048,1,"aravind-kalavagattu-47289","1",1],
  ["Arun Sriraman",512,1,"arun-sriraman-37620","1",1], ["Ash Murthy",2048,1,"ash-murthy-47315","1",1], ["Asif Khan",512,1,"asif-khan-45463","1",1],
  ["Asim Siddiqui",256,1,"asim-siddiqui-43765","1",0], ["Aswani Nerella",1024,1,"aswani-nerella-8268","1",1], ["Aysegul Yonet",128,1,"aysegul-yonet-11388","1",1],
  ["Aza Tulepbergenov",1024,1,"aza-tulepbergenov-46566","1",1], ["Bakh Inamov",64,1,"bakh-inamov-20951","1",1], ["Balachander Keelapudi",32,1,"balachander-keelapudi-12811","1",1],
  ["Balamurugan Thinagarajan",128,1,"balamurugan-thinagarajan-39659","1",1], ["Bao Chau Nguyen",16,1,"bao-chau--nguyen-8633","1",1], ["Barbara Geller",256,1,"barbara-geller-21061","1",1],
  ["Barry Boudreau",16,1,"barry-boudreau-8930","1",0], ["Basil Shikin",128,1,"basil-shikin-31998","1",1], ["Ben Gremillion",32,1,"ben--gremillion-10357","1",1],
  ["Ben Ilegbodu",2048,1,"ben-ilegbodu-47349","1",1], ["Ben Trombley",8,1,"ben-trombley-4144","1",0], ["Bhavana Bhasker",512,1,"bhavana-bhasker-44367","1",1],
  ["Bill Crow",8,1,"bill-crow-2012","1",1], ["Bill Odom",8,1,"bill-odom-6492","1",1], ["Bill Venners",4,1,"bill-venners-1761","1",0],
  ["Bob Smith",2,1,"bob-smith-1438","1",0], ["Brandon Brown",4,1,"brandon-brown-4514","1",0], ["Brandon Leach",256,1,"brandon-leach-41419","1",1],
  ["Branka Kranjac",32,1,"branka-kranjac-374","1",1], ["Brent Schooley",32,1,"brent-schooley-11040","1",1], ["Bret Stateham",4,1,"bret-stateham-4079","1",1],
  ["Brian Miner",16,1,"brian-miner-1177","1",1], ["Brian Schulman",128,1,"brian-schulman-37328","1",1], ["Bruno Tavares",16,1,"bruno-tavares-7981","1",1],
  ["Bryce Verdier",16,1,"bryce-verdier-5205","1",0], ["Carmen J. Sandoval",512,1,"carmen-j-sandoval-45663","1",1], ["Carson Lam",8192,1,"carson-lam-48197","1",1],
  ["Carsten Jacobsen",2048,1,"carsten-jacobsen-45882","1",1], ["Cathy Simpson",512,1,"cathy-simpson-45630","1",1], ["Chad Austin",8,1,"chad-austin-4661","1",1],
  ["Chandler Carruth",16,1,"chandler-carruth-8658","1",1], ["Charles Jolley",2,1,"charles-jolley-3013","1",1], ["Chi Chang",4,1,"chi-chang-4479","1",0],
  ["Chris Bailey",2048,1,"chris-bailey-47513","1",1], ["Chris Bannon",8,1,"chris-bannon-6278","1",1], ["Chris Baumbauer",2048,1,"chris-baumbauer-12525","1",1],
  ["Chris Kasso",16,1,"chris-kasso-8498","1",0], ["Chris Love",256,1,"chris-love-43098","1",1], ["Chris Patterson",32,1,"chris-patterson-10494","1",1],
  ["Chris Sutton",8,1,"chris-sutton-6072","1",1], ["Chris Woodruff",512,1,"chris-woodruff-45778","1",1], ["Christian Shay",8,1,"christian-shay-6490","1",0],
  ["Christian Wade",32,1,"christian-wade-11102","1",1], ["Christopher Vigna",1,1,"christopher-vigna-337","1",1], ["Clayton Peddy",256,1,"clayton-peddy-16226","1",1],
  ["Clem Freeman",2048,1,"clem-freeman-47706","1",1], ["Clive Boulton",2,1,"clive-boulton-352","1",1], ["Craig Sebenik",128,1,"craig-sebenik-36217","1",1],
  ["Curtiss Pope",4,1,"curtiss-pope-2967","1",0], ["Cyril Garcia",2048,1,"cyril-garcia-44178","1",1], ["Dale Western",16,1,"dale--western-8639","1",1],
  ["Damian Edwards",8,1,"damian-edwards-6788","1",1], ["Dan Arkind",16,1,"dan-arkind-8654","1",1], ["Dan Bikle",8,1,"dan-bikle-946","1",1],
  ["Dana Pratt",1024,1,"dana-pratt-46905","1",1], ["Daniel Cer",4,1,"daniel-cer-3972","1",0], ["Daniel Francisco",1,1,"daniel-francisco-193","1",0],
  ["Daniel Marashlian",8,1,"daniel-marashlian-3980","1",1], ["Darius Dunlap",32,1,"darius-dunlap-8177","1",1], ["Darrell Meyer",4,1,"darrell-meyer-4492","1",0],
  ["Dave Britton",1,1,"dave-britton-1343","1",1], ["Dave Duke",8,1,"dave-duke-6182","1",0], ["David Albrecht",32,1,"david-albrecht-6229","1",1],
  ["David Burrowes",64,1,"david-burrowes-4190","1",1], ["David Evans",2048,1,"david-evans-11618","1",1], ["David Kaneda",4,1,"david-kaneda-4493","1",1],
  ["David McCarter",512,1,"david-mccarter-32745","1",1], ["David Montag",16,1,"david-montag-8593","1",0], ["David Wake",8,1,"david-wake-6212","1",0],
  ["Dhananjay Ragade",8,1,"dhananjay-ragade-1212","1",1], ["Dinesh Murthy",256,1,"dinesh-murthy-43623","1",1], ["Diwakar Cherukumilli",128,1,"diwakar-cherukumilli-39006","1",1],
  ["Dominik Grolimund",1,1,"dominik-grolimund-172","1",1], ["Don Bullock",2048,1,"don-bullock-47348","1",1], ["Doug Holland",4,1,"doug-holland-4135","1",1],
  ["Drew Johnson",4,1,"drew-johnson-4409","1",1], ["Dylan Smith",64,1,"dylan-smith-18624","1",1], ["E John Feig",512,1,"e-john-feig-10893","1",1],
  ["Earl Malmrose",4,1,"earl--malmrose-4519","1",1], ["Ed Murphy",2048,1,"ed-murphy-2849","1",1], ["Edmund Leung",16,1,"edmund-leung-8794","1",1],
  ["Edward Cherlin",2,1,"edward-cherlin-1428","1",1], ["Edward Gibbs",8,1,"edward-gibbs-4014","1",1], ["Edward de Jong",16,1,"edward-de-jong-8587","1",0],
  ["Elaine Wherry",8,1,"elaine-wherry-6484","1",1], ["Elisabeth Hendrickson",32,1,"elisabeth-hendrickson-13070","1",1], ["Elizabeth K. Joseph",2048,1,"elizabeth-k-joseph-47496","1",1],
  ["Elizabeth Mezias",16,1,"elizabeth-mezias-3160","1",1], ["Emily Wu",16,1,"emily-wu-8724","1",0], ["Eneko Alonso",2,1,"eneko-alonso-1338","1",0],
  ["Eric Anderson",8,1,"eric-anderson-7051","1",0], ["Eric Bidelman",4,1,"eric-bidelman-4401","1",1], ["Eric Bishard",2048,1,"eric-bishard-46988","1",1],
  ["Eric Vandenberg",16,1,"eric-vandenberg-8667","1",1], ["Erick Tai",16,1,"erick-tai-8087","1",1], ["Erik Lindeman",128,1,"erik-lindeman-39108","1",1],
  ["Erik van Zijst",64,1,"erik-van-zijst-2002","1",1], ["Ernest Delgado",4,1,"ernest-delgado-4464","1",0], ["Esther Lee",64,1,"esther-lee-21132","1",1],
  ["Eugene Krivopaltsev",32,1,"eugene-krivopaltsev-10941","1",1], ["Eve Porcello",2048,1,"eve-porcello-47343","1",1], ["Fabien Lavocat",32,1,"fabien-lavocat-6041","1",1],
  ["Felix Rieseberg",32,1,"felix-rieseberg-11501","1",1], ["Fernando Wong",1024,1,"fernando-wong-19923","1",1], ["Fletcher Johnson",4,1,"fletcher-johnson-426","1",1],
  ["Florian Nierhaus",256,1,"florian-nierhaus-43234","1",1], ["Frank Stratton",32,1,"frank-stratton-10258","1",1], ["Fred Sauer",2,1,"fred-sauer-3224","1",1],
  ["Frisco Del Rosario",256,1,"frisco-del-rosario-6310","1",1], ["Fuad Malikov",128,1,"fuad-malikov-37623","1",1], ["Gabe Abinante",512,1,"gabe-abinante-45454","1",1],
  ["Gabriel Gramajo",16,1,"gabriel-gramajo-4327","1",1], ["Gareth Bowles",32,1,"gareth-bowles-4124","1",1], ["Gary Campbell",8,1,"gary-campbell-5594","1",1],
  ["Gaurav Chodwadia",2048,1,"gaurav-chodwadia-43785","1",1], ["Geoffrey Lee",4,1,"geoffrey-lee-4734","1",1], ["Ghaida Zahran",32,1,"ghaida-zahran-10394","1",1],
  ["Gianpiero Napoli",128,1,"gianpiero-napoli-36173","1",1], ["Gilles de Bordeaux",256,1,"gilles-de-bordeaux-1158","1",1], ["Glenn Block",8192,1,"glenn-block-48196","1",1],
  ["Gopi Vadlamudi",2048,1,"gopi-vadlamudi-45647","1",1], ["Gorav Taneza",32,1,"gorav-taneza-4387","1",1], ["Gordon Zhu",64,1,"gordon-zhu-18802","1",1],
  ["Greg Law",64,1,"greg-law-21030","1",1], ["Gustavo Cavalcanti",4,1,"gustavo-cavalcanti-2951","1",1], ["Gustavo Cavalcanti",8,1,"gustavo-cavalcanti-4091","1",1],
  ["Hans Boehm",16,1,"hans-boehm-8545","1",1], ["Helen Zeng",32,1,"helen-zeng-13354","1",1], ["Heraldo Memelli",2048,1,"heraldo--memelli-47992","1",1],
  ["Hinkmond Wong",32,1,"hinkmond-wong-10716","1",1], ["Ilayaperumal Gopinathan",64,1,"ilayaperumal-gopinathan-18621","1",1], ["Ilya Dmitrichenko",512,1,"ilya-dmitrichenko-46088","1",1],
  ["Imran Qureshi",256,1,"imran-qureshi-17423","1",1], ["Ina Yosun Chang",16,1,"ina-yosun-chang-6508","1",1], ["Ioannis Verdelis",32,1,"ioannis--verdelis-10376","1",1],
  ["Ishai Hachlili",256,1,"ishai-hachlili-8506","1",1], ["Issac Roth",4,1,"issac-roth-5310","1",1], ["Ivan Wallis",512,1,"ivan-wallis-6674","1",1],
  ["J David Eisenberg",256,1,"j-david-eisenberg-43122","1",1], ["JImmy Guerrero",16,1,"jimmy-guerrero-8760","1",1], ["JImmy Tobin",8,1,"jimmy-tobin-7284","1",0],
  ["Jack Deslippe",4,1,"jack-deslippe-4518","1",0], ["Jack Ha",2,1,"jack-ha-1442","1",1], ["James Bender",32,1,"james-bender-10800","1",1],
  ["James Cha",256,1,"james-cha-10674","1",1], ["James Downey",4,1,"james-downey-1978","1",1], ["James Johnson",4,1,"james-johnson-4421","1",1],
  ["James Weaver",256,1,"james-weaver-43249","1",1], ["Jason Cooper",2,1,"jason-cooper-3345","1",1], ["Jason Goecke",4,1,"jason-goecke-4301","1",1],
  ["Jason Poon",256,1,"jason-poon-43109","1",1], ["Jason Singh",64,1,"jason-singh-17416","1",1], ["Jayson DeLancey",1024,1,"jayson-delancey-46535","1",1],
  ["Jean-Baptiste Volta",16,1,"jean-baptiste-volta-8673","1",0], ["Jeanne Bradford",64,1,"jeanne-bradford-18820","1",1], ["Jeff Anderson",64,1,"jeff-anderson-21283","1",1],
  ["Jeff Atwood",4,1,"jeff-atwood-1654","1",1], ["Jeff Brewer",64,1,"jeff-brewer-16283","1",1], ["Jeff Brown",1,1,"jeff-brown-966","1",1],
  ["Jeff Geisler",16,1,"jeff-geisler-8641","1",1], ["Jeff Green",8,1,"jeff-green-4055","1",0], ["Jeff Handley",32,1,"jeff-handley-10614","1",1],
  ["Jeff Harrell",32,1,"jeff-harrell-8797","1",1], ["Jeff McKenna",4,1,"jeff-mckenna-4456","1",1], ["Jeff McWherter",1,1,"jeff--mcwherter-967","1",1],
  ["Jeff Prestes",128,1,"jeff-prestes-36214","1",1], ["Jeff Trull",64,1,"jeff-trull-5111","1",1], ["Jeff Winner",16,1,"jeff-winner-8662","1",0],
  ["Jeffrey Rennie",256,1,"jeffrey-rennie-41565","1",1], ["Jennifer Davis",256,1,"jennifer-davis-10670","1",1], ["Jennifer Hickey",16,1,"jennifer-hickey-8445","1",0],
  ["Jerome Etienne",128,1,"jerome-etienne-37331","1",1], ["Jim McKeeth",64,1,"jim-mckeeth-18763","1",1], ["Jitendra Kotamraju",4,1,"jitendra-kotamraju-4122","1",0],
  ["Joe Arnold",4,1,"joe-arnold-5159","1",1], ["Joe Brinkman",512,1,"joe-brinkman-45432","1",1], ["Joe Chang",32,1,"joe-chang-11351","1",1],
  ["Joe Enos",16,1,"joe-enos-8412","1",1], ["Joe Gershgorin",2,1,"joe-gershgorin-470","1",0], ["Johan Euphrosine",32,1,"johan-euphrosine-11314","1",1],
  ["John Brinnand",32,1,"john-brinnand-1514","1",1], ["John Ceccarelli",16,1,"john-ceccarelli-8331","1",1], ["John Hann",64,1,"john-hann-18590","1",1],
  ["John Knapp",32,1,"john-knapp-10904","1",1], ["John McFarlane",512,1,"john-mcfarlane-45875","1",1], ["John Mummert",64,1,"john-mummert-16174","1",1],
  ["John Ray Thomas",16,1,"john-ray-thomas-8518","1",1], ["John Sheehan",8,1,"john-sheehan-6011","1",1], ["John-Daniel Trask",128,1,"john-daniel-trask-37582","1",1],
  ["Johnny Chan",1,1,"johnny-chan-170","1",1], ["Jonathan Feuchtwang",8,1,"jonathan--feuchtwang-6396","1",0], ["Joonas Lehtinen",64,1,"joonas-lehtinen-18686","1",1],
  ["Jordan Humphreys",32,1,"jordan--humphreys-10392","1",1], ["Jordan Sterling",8,1,"jordan-sterling-6201","1",0], ["Joseph Kleinschmidt",64,1,"joseph-kleinschmidt-2039","1",1],
  ["Joshua Granick",8,1,"joshua-granick-6466","1",1], ["Joshua Woodward",32,1,"joshua-woodward-6565","1",1], ["Jossie Haines",2048,1,"jossie-haines-47459","1",1],
  ["Juan Camilo Ruiz",8,1,"juan-camilo-ruiz-6495","1",0], ["Junling Hu",8192,1,"junling-hu-48198","1",1], ["Justin Early",8,1,"justin-early-6176","1",1],
  ["Kari Finn",64,1,"kari-finn-21146","1",1], ["Karl Shifflett",4,1,"karl-shifflett-4128","1",1], ["Karthik Gurumurthy",1,1,"karthik-gurumurthy-918","1",0],
  ["Katherine Alberts",8,1,"katherine-alberts-6437","1",1], ["Kavita Laddad",2048,1,"kavita-laddad-3378","1",1], ["Keith Ball",16384,1,"keith-ball-2442","1",1],
  ["Ken Kruszka",64,1,"ken-kruszka-21117","1",1], ["Kenny Bastani",64,1,"kenny-bastani-8211","1",1], ["Kent Brewster",2,1,"kent-brewster-1427","1",1],
  ["Keshava Rangarajan",8,1,"keshava-rangarajan-6591","1",0], ["Keven Wang",128,1,"keven-wang-37702","1",1], ["Kevin Hague",4,1,"kevin-hague-4667","1",0],
  ["Kevin Lu",1024,1,"kevin-lu-46897","1",1], ["Kevin McNeish",8,1,"kevin-mcneish-6125","1",1], ["Kevin Peterson",4,1,"kevin-peterson-4038","1",1],
  ["Kevin Rohling",4,1,"kevin-rohling-4267","1",1], ["Kevin Schmidt",16,1,"kevin-schmidt-8926","1",0], ["Kevin Steineman",256,1,"kevin-steineman-9400","1",1],
  ["Kevin VanGrundy",64,1,"kevin-vangrundy-29179","1",1], ["Khurram Khan",2,1,"khurram--khan-3152","1",1], ["Kimber Lockhart",8,1,"kimber-lockhart-5373","1",1],
  ["Kirill Gavrylyuk",32,1,"kirill-gavrylyuk-11405","1",1], ["Kishore Subramanian",1,1,"kishore-subramanian-506","1",1], ["Kostya Serebryany",128,1,"kostya-serebryany-37711","1",1],
  ["Kris Lahiri",16,1,"kris-lahiri-8608","1",0], ["Kui Jia",16,1,"kui-jia-8983","1",0], ["Lak Sri",64,1,"lak-sri-21408","1",1],
  ["Lalitha Iyer",2048,1,"lalitha-iyer-47300","1",1], ["Lee Lukehart",16,1,"lee-lukehart-3009","1",1], ["Lennart Frantzell",2048,1,"lennart-frantzell-46026","1",1],
  ["Leonardo Brown",4,1,"leonardo-brown-4238","1",0], ["Les Hazlewood",32,1,"les-hazlewood-10645","1",1], ["Les Hazlewood",64,1,"les-hazlewood-12415","1",1],
  ["Les Hazlewood",256,1,"les-hazlewood-41591","1",1], ["Leslie Pound",512,1,"leslie-pound-46137","1",1], ["Liam Molloy",1,1,"liam-molloy-473","1",1],
  ["Lisa Huang-North",512,1,"lisa-huang-north-45481","1",1], ["Ludovic Champenois",4,1,"ludovic-champenois-4100","1",1], ["Luke Wroblewski",8,1,"luke-wroblewski-6584","1",1],
  ["Lyle Troxell",32,1,"lyle-troxell-10271","1",1], ["M David Green",2048,1,"m-david-green-47443","1",1], ["Maarten Balliauw",64,1,"maarten-balliauw-15072","1",1],
  ["Majd Taby",8,1,"majd-taby-6214","1",1], ["Malcolm Knapp",512,1,"malcolm-knapp-46171","1",1], ["Mandar Jog",512,1,"mandar-jog-46083","1",1],
  ["Marc Chanliau",2,1,"marc-chanliau-3220","1",0], ["Marc Grabanski",64,1,"marc-grabanski-17401","1",1], ["Marcus Hellberg",1024,1,"marcus-hellberg-29021","1",1],
  ["Marina Fisher",1,1,"marina-fisher-960","1",0], ["Marina Vatkina",16,1,"marina-vatkina-8223","1",1], ["Mario Hewardt",16,1,"mario-hewardt-8301","1",1],
  ["Mark Erdmann",2,1,"mark-erdmann-837","1",1], ["Mark Lavi",128,1,"mark-lavi-37813","1",1], ["Mark Nelson",8,1,"mark-nelson-6498","1",1],
  ["Mark Prichard",16,1,"mark--prichard-8477","1",1], ["Mark Terranova",4,1,"mark-terranova-4475","1",1], ["Mark Wilcox",1,1,"mark-wilcox-858","1",1],
  ["Markus Egger",64,1,"markus-egger-17414","1",1], ["Martin Vigo",64,1,"martin-vigo-6053","1",1], ["Mary Grygleski",2048,1,"mary-grygleski-46769","1",1],
  ["Mats Bryntse",1,1,"mats-bryntse-893","1",1], ["Matt Doar",16,1,"matt-doar-8553","1",1], ["Matt Hargett",32,1,"matt-hargett-10121","1",1],
  ["Matt Ingenthron",4,1,"matt-ingenthron-4208","1",0], ["Matt Kelly",16,1,"matt-kelly-9727","1",1], ["Matt Perez",128,1,"matt-perez-31779","1",1],
  ["Matt Vaznaian",16,1,"matt-vaznaian-8427","1",0], ["Matthew Cousens",2048,1,"matthew-cousens-47681","1",1], ["MengKe Li",128,1,"mengke-li-36290","1",1],
  ["Michael Cohen",32,1,"michael-cohen-3264","1",1], ["Michael Klose",512,1,"michael-klose-45914","1",1], ["Michael Ossou",64,1,"michael-ossou-11589","1",1],
  ["Michael Slinn",16,1,"michael-slinn-8127","1",1], ["Mickey Stuewe",512,1,"mickey-stuewe-46051","1",1], ["Miguel Torres",1024,1,"miguel-torres-46789","1",1],
  ["Mike Coast Development",2,1,"mike-coast-development-3346","1",1], ["Mike Hewett",4,1,"mike-hewett-2884","1",1], ["Mike Mintz",8,1,"mike-mintz-1232","1",0],
  ["Mike Wood",64,1,"mike-wood-16339","1",1], ["Mike Yeager",64,1,"mike-yeager-17360","1",1], ["Minesh B. Amin",8,1,"minesh-b-amin-5003","1",1],
  ["Mithun Dhar",64,1,"mithun-dhar-16243","1",1], ["Monal Daxini",2048,1,"monal-daxini-47991","1",1], ["Muhammad Ahmad Khan",128,1,"muhammad-ahmad-khan-31982","1",1],
  ["Murali Sangubhatla",16,1,"murali-sangubhatla-8663","1",0], ["Murat Yener",512,1,"murat-yener-45824","1",1], ["Na Yang",1024,1,"na-yang-46896","1",1],
  ["Nathan Yospe",64,1,"nathan-yospe-21098","1",1], ["Nazmul Idris",128,1,"nazmul-idris-39080","1",1], ["Neelakandan Rajesh",256,1,"neelakandan-rajesh-10720","1",1],
  ["Neeraj Gupta",8,1,"neeraj-gupta-5922","1",0], ["Neeraja Ganesan",256,1,"neeraja-ganesan-43117","1",1], ["Nelson Petracek",512,1,"nelson-petracek-45472","1",1],
  ["Nelz Carpentier",2,1,"nelz-carpentier-551","1",1], ["Nicholas Camilleri",2048,1,"nicholas-camilleri-47534","1",1], ["Nicholas Silva",16,1,"nicholas-silva-5939","1",0],
  ["Nick Breen",64,1,"nick-breen-16252","1",1], ["Nicolas Grenie",64,1,"nicolas-grenie-18642","1",1], ["Nicolas Morales",64,1,"nicolas-morales-21404","1",1],
  ["Nicole White",64,1,"nicole-white-21045","1",1], ["Nik Molnar",64,1,"nik-molnar-17347","1",1], ["Nikhil Mahajan",2048,1,"nikhil-mahajan-47990","1",1],
  ["Nikhil Rati",512,1,"nikhil-rati-44365","1",1], ["Nikita Ivanov",1,1,"nikita-ivanov-1225","1",1], ["Nikita Takru",128,1,"nikita-takru-37984","1",1],
  ["Nikolaus Baer",1,1,"nikolaus-baer-1072","1",1], ["Nisha Bhaskaran",2048,1,"nisha-bhaskaran-47502","1",1], ["Noah Kantrowitz",128,1,"noah-kantrowitz-37594","1",1],
  ["Nolan Wright",2,1,"nolan-wright-3033","1",1], ["Nolan Wright",4,1,"nolan-wright-1206","1",1], ["Norbert Lindenberg",16,1,"norbert-lindenberg-7600","1",1],
  ["Norman Boccone",8,1,"norman-boccone-7475","1",0], ["Obaidur Rashid",1024,1,"obaidur-rashid-46689","1",1], ["Oleg Polyakov",2048,1,"oleg-polyakov-2898","1",1],
  ["Om Bachu",64,1,"om-bachu-28103","1",1], ["Omar Venado",64,1,"omar-venado-19855","1",1], ["Omkar Deshpande",2048,1,"omkar-deshpande-47544","1",1],
  ["Omkar Govil-Nair",256,1,"omkar-govil-nair-43377","1",1], ["Orion Letizi",1,1,"orion-letizi-604","1",1], ["Orion Letizi",4,1,"orion-letizi-4465","1",0],
  ["Pankaj Mehra",8,1,"pankaj-mehra-4674","1",1], ["Paolo Bettoni",64,1,"paolo-bettoni-17454","1",1], ["Patrick Curran",8,1,"patrick-curran-6447","1",0],
  ["Paul Fryer",64,1,"paul-fryer-16189","1",1], ["Paul Keister",32,1,"paul-keister-123","1",1], ["Paul Nguyen",128,1,"paul-nguyen-16334","1",1],
  ["Paul Rashidi",32,1,"paul-rashidi-11333","1",1], ["Paul Stubbs",8,1,"paul--stubbs-6542","1",1], ["Pavi Bhatter",64,1,"pavi-bhatter-17461","1",1],
  ["Peng Ying",8,1,"peng-ying-6474","1",0], ["Petar Vucetin",1,1,"petar-vucetin-765","1",0], ["Pete Hodgson",64,1,"pete-hodgson-20976","1",1],
  ["Pete Ryan",64,1,"pete-ryan-18583","1",1], ["Peter Garst",8,1,"peter-garst-3927","1",1], ["Peter Harrington",4,1,"peter-harrington-3790","1",1],
  ["Peter Soderling",16,1,"peter-soderling-8659","1",1], ["Peter Tweed",4,1,"peter-tweed-4138","1",1], ["Peter White",8,1,"peter-white-1048","1",1],
  ["Pieter Humphrey",512,1,"pieter-humphrey-28628","1",1], ["Pradeep Pujari",32,1,"pradeep-pujari-3809","1",1], ["Pritam Mungse",256,1,"pritam-mungse-3279","1",1],
  ["Pritam Roy",1024,1,"pritam-roy-46003","1",1], ["Pritish Jacob",16,1,"pritish-jacob-8239","1",1], ["Priyanka Tyagi",2048,1,"priyanka-tyagi-1447","1",1],
  ["Qirfiraz Siddiqui",512,1,"qirfiraz-siddiqui-5960","1",1], ["Rachel Hagerman",16,1,"rachel-hagerman-8340","1",1], ["Rahul Choudhury",128,1,"rahul-choudhury-30466","1",1],
  ["Raj Lal",32,1,"raj-lal-11064","1",1], ["Raja Rao DV",16,1,"raja-rao-dv-8468","1",0], ["Rajiv Mordani",4,1,"rajiv-mordani-4101","1",0],
  ["Ramakrishna Kollipara",32,1,"ramakrishna-kollipara-11374","1",1], ["Randall Schulz",8,1,"randall-schulz-6211","1",0], ["Randy Knight",8,1,"randy-knight-6089","1",0],
  ["Rashi Ranjan",128,1,"rashi-ranjan-36058","1",1], ["Rasika Iyer",128,1,"rasika-iyer-37892","1",1], ["Ray Yang",128,1,"ray-yang-7352","1",1],
  ["Reggie Hutcherson",256,1,"reggie-hutcherson-43846","1",1], ["Rex Kerr",128,1,"rex-kerr-39399","1",1], ["Richard Suselbeck",512,1,"richard-suselbeck-45779","1",1],
  ["Rick Morelan",16,1,"rick-morelan-8286","1",1], ["Rizwan Ghaffar",2048,1,"rizwan-ghaffar-47281","1",1], ["Robert Evans",8,1,"robert-evans-1263","1",0],
  ["Robert Felten",32,1,"robert-felten-9970","1",1], ["Robert Harker",128,1,"robert-harker-37622","1",1], ["Robert Macdonald Smith",128,1,"robert-macdonald-smith-37519","1",1],
  ["Robert Oliver",512,1,"robert-oliver-45761","1",1], ["Robert Roeder",256,1,"robert-roeder-495","1",1], ["Rohit Dhamija",512,1,"rohit-dhamija-45649","1",1],
  ["Roland Krause",8,1,"roland-krause-6264","1",1], ["Roni Simonian",8,1,"roni-simonian-6258","1",1], ["Rupa Dachere",32,1,"rupa-dachere-4774","1",1],
  ["Rushabh Mehta",32,1,"rushabh-mehta-11477","1",1], ["Ryan Cuprak",16,1,"ryan-cuprak-7996","1",0], ["Ryan Delucchi",1024,1,"ryan-delucchi-46751","1",1],
  ["Ryan Desmond",64,1,"ryan-desmond-21033","1",1], ["Ryan Ehrenreich",256,1,"ryan-ehrenreich-1869","1",1], ["Ryan Olshan",1,1,"ryan-olshan-890","1",0],
  ["Ryan Riddle",32,1,"ryan-riddle-10273","1",1], ["Ryan Salva",64,1,"ryan-salva-21118","1",1], ["Ryan Valles",2048,1,"ryan-valles-47540","1",1],
  ["Sam Nasr",2,1,"sam-nasr-8","1",1], ["Samaira mehta",128,1,"samaira-mehta-36253","1",1], ["Samantha Ready",32,1,"samantha-ready-10810","1",1],
  ["Sanat Mastan Kumar Yelchuri",2048,1,"sanat-mastan-kumar-yelchuri-47381","1",1], ["Sangeeta Narang",32,1,"sangeeta-narang-8740","1",1], ["Sangeeta Narang",256,1,"sangeeta-narang-43202","1",1],
  ["Sara Daqiq",1024,1,"sara-daqiq-46537","1",1], ["Sarah Guller",256,1,"sarah-guller-43177","1",1], ["Sasha Ovsankin",64,1,"sasha-ovsankin-490","1",1],
  ["Saurabh Gupta",8,1,"saurabh-gupta-6155","1",0], ["Scott Deeg",32,1,"scott-deeg-11831","1",1], ["Scott Guthrie",16,2,"scott-guthrie-8431","2",1],
  ["Scott Mauvais",1,1,"scott-mauvais-714","1",1], ["Scott Stark",1,1,"scott-stark-1402","1",1], ["Sebastian Meine",128,1,"sebastian-meine-32070","1",1],
  ["Seemant Kulleen",32,1,"seemant-kulleen-10257","1",1], ["Senthilkumar Gopal",1024,1,"senthilkumar-gopal-46205","1",1], ["Sergey Gorbaty",64,1,"sergey-gorbaty-19831","1",1],
  ["Shamod Lacoul",2048,1,"shamod-lacoul-45568","1",1], ["Shane Powser",4,1,"shane-powser-707","1",1], ["Shani Zuniga",8,1,"shani-zuniga-6778","1",1],
  ["Sharada Bose",256,1,"sharada-bose-36286","1",1], ["Sharada Bose",2048,1,"sharada-bose-12839","1",1], ["Shashank Tiwari",8,1,"shashank-tiwari-6528","1",1],
  ["Shawn Parker",4,1,"shawn-parker-3611","1",1], ["Shawn Van Ittersum",8,1,"shawn-van-ittersum-6459","1",1], ["Shawn Wang",2048,1,"shawn-wang-47384","1",1],
  ["Shilpi Agarwal",256,1,"shilpi-agarwal-29387","1",1], ["Shiraz Kanga",2,1,"shiraz-kanga-1169","1",0], ["Sidharth Rajaram",1024,1,"sidharth-rajaram-8196","1",1],
  ["Sidharth Sharma",1024,1,"sidharth-sharma-46680","1",1], ["Simon Tien",64,1,"simon-tien-21124","1",1], ["Sinclair Schuller",4,1,"sinclair--schuller-4281","1",1],
  ["Siva Valiveru",2048,1,"siva-valiveru-47298","1",1], ["Sondra Card",8,1,"sondra-card-6482","1",1], ["Sridhar Ramakrishnan",128,1,"sridhar-ramakrishnan-11709","1",1],
  ["Sriram Krishnan",1,1,"sriram-krishnan-181","1",0], ["Stacey Broadwell",8,1,"stacey-broadwell-6402","1",1], ["Stacia Misner",32,1,"stacia-misner-11326","1",1],
  ["Stan Carrico",2048,1,"stan-carrico-47485","1",1], ["Stan Knutson",1,1,"stan-knutson-408","1",0], ["Stephen Dempsey",2,1,"stephen-dempsey-2976","1",1],
  ["Stephen McCurry",32,1,"stephen-mccurry-10249","1",1], ["Steve Chen",16,1,"steve--chen-8611","1",0], ["Steve Corona",128,1,"steve-corona-39124","1",1],
  ["Steve Drucker",64,1,"steve-drucker-19824","1",1], ["Steve Fox",8,1,"steve-fox-6539","1",1], ["Steve Jones",64,1,"steve-jones-15105","1",1],
  ["Steve Zehngut",8,1,"steve-zehngut-6478","1",1], ["Suresh Koya",8,1,"suresh-koya-624","1",0], ["Suzanna Litwin",4,1,"suzanna-litwin-72","1",1],
  ["Swizec Teller",2048,1,"swizec-teller-47352","1",1], ["Tanay Sonthalia",256,1,"tanay-sonthalia-9276","1",1], ["Taylor Gautier",2,1,"taylor-gautier-3295","1",1],
  ["Taylor Leese",16,1,"taylor-leese-2933","1",1], ["Theresa Shafer",8,1,"theresa-shafer-4532","1",0], ["Thirugnanam Subbiah",16,1,"thirugnanam-subbiah-9952","1",1],
  ["Thomas Millar",4,1,"thomas-millar-4235","1",0], ["Thomas Zhang",2048,1,"thomas-zhang-47391","1",1], ["Thomas Zhou",2048,1,"thomas-zhou-47314","1",1],
  ["Tim Caswell",4,1,"tim-caswell-5269","1",0], ["Tim Pettersen",64,1,"tim-pettersen-16239","1",1], ["Todd Davies",1,1,"todd-davies-435","1",1],
  ["Todd Davies",8,1,"todd-davies-7014","1",0], ["Todd Farmer",8,1,"todd-farmer-6559","1",0], ["Todd McLeod",128,1,"todd-mcleod-17449","1",1],
  ["Tom Hughes-Croucher",4,1,"tom-hughes-croucher-439","1",1], ["Tom Tofigh",32,1,"tom-tofigh-7856","1",1], ["Tony Constantinides",8,1,"tony-constantinides-6379","1",1],
  ["Tony Morelan",1024,1,"tony-morelan-47002","1",1], ["Troy Taylor",512,1,"troy-taylor-45804","1",1], ["Twinklekumar Patel",256,1,"twinklekumar-patel-3056","1",1],
  ["Vamshideep Devershetty",128,1,"vamshideep-devershetty-7594","1",1], ["Venk Krishnamoorthy, Ph. D.",16,1,"venk-krishnamoorthy-ph-d-8940","1",1], ["Venkat Gajulapalli",64,1,"venkat-gajulapalli-16333","1",1],
  ["Victor Karkar",32,1,"victor-karkar-10254","1",1], ["Vidya Vrat Agarwal",512,1,"vidya-vrat-agarwal-44364","1",1], ["Vignesh Sukumar",16,1,"vignesh-sukumar-8661","1",1],
  ["Vijo Cherian",1024,1,"vijo-cherian-10009","1",1], ["Vishnu Nath",16,1,"vishnu--nath-8362","1",1], ["Vlad Kuznetsov",2,1,"vlad-kuznetsov-3080","1",1],
  ["Walt Ritscher",256,1,"walt-ritscher-41394","1",1], ["Warren Edwards",32,1,"warren-edwards-10738","1",1], ["Will Smith",64,1,"will-smith-19859","1",1],
  ["William Leong",16,1,"william-leong-1006","1",0], ["William Vablais",128,1,"william-vablais-39060","1",1], ["Wojciech Koszek",256,1,"wojciech-koszek-42939","1",1],
  ["Woody Zuill",2,1,"woody-zuill-3132","1",1], ["Yann Yu",64,1,"yann-yu-18773","1",1], ["Yavor Georgiev",32,1,"yavor-georgiev-12077","1",1],
  ["Yosun Chang",32,1,"yosun-chang-6291","1",1], ["Zach Maier",2,1,"zach-maier-3209","1",0], ["Zachary Abraham",256,1,"zachary-abraham-28471","1",1],
  ["bill braasch",2,1,"bill-braasch-2877","1",0], ["changjie yang",512,1,"changjie-yang-46087","1",1], ["jordan sterling",256,1,"jordan-sterling-41545","1",1],
  ["khushali Desai",128,1,"khushali-desai-29199","1",1], ["mich Cook",16,1,"mich-cook-6145","1",1], ["oliver marks",8,1,"oliver--marks-6516","1",0],
  ["srinivas kocharlakota",1024,1,"srinivas-kocharlakota-46025","1",1], ["yakov werde",8,1,"yakov-werde-6753","1",1], ["yeepin yheng",1,1,"yeepin-yheng-746","1",0],
];
