import React from "react";
import Link from "next/link";
import {withBasePath} from "@/lib/basePath";
import HomeInteractive from "./HomeInteractive";
import {
  COLORS,
  EVENTS,
  RING_COLORS,
  SPEAKERS,
  SPONSORS,
  THEME_COUNT,
  THEME_REST,
  THEMES,
  TRACK_YEARS,
  TRACKS,
  VENUES,
  WHO_YEAR_LABELS,
  bits,
  eventLinks,
  speakerLink,
  speakerMeta,
  yearName,
  type HomeEvent,
  type VenueKey,
} from "./homeData";

// REDESIGN-PLAN.md: the home page, ported from the "SVCC Home Redesign" prototype. Everything here
// is server-rendered (text, headings and links stay in the HTML); HomeInteractive only binds
// behavior to this markup and draws the canvases. The header and footer come from the layout.

const YOUTUBE = "https://www.youtube.com/c/SiliconValleyCodeCampVideos";

const STACK = [
  { src: "/home/img/auditorium.jpg", cap: "A full auditorium, laptops open", alt: "A packed auditorium of developers with laptops open, watching a speaker on stage beside a slide of code." },
  { src: "/home/img/expo.jpg", cap: "Between sessions, at the sponsor tents", alt: "People walking past a row of white sponsor tents under trees on a sunny day." },
  { src: "/home/e/14.jpg", cap: "Volunteers outside PayPal Town Hall, 2019", alt: "Four volunteers with lanyards and coffee outside the Town Hall entrance." },
  { src: "/home/e/11.jpg", cap: "Talking to the crowd, 2016", alt: "A speaker with a microphone addressing a large standing crowd outdoors." },
  { src: "/home/e/9.jpg", cap: "On the lawn at Foothill College, 2014", alt: "A smiling attendee on a lawn with a long line of people behind." },
];

function MiniRings({ y }: { y: number }) {
  const circles = [];
  for (let k = y; k >= 1; k--) {
    circles.push(
      <circle key={k} cx="15" cy="15" r={(1.8 + 1.1 * (k - 1)).toFixed(1)} fill={RING_COLORS[(k - 1) % 4]} stroke={COLORS.ink} strokeWidth=".5" />,
    );
  }
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true">
      {circles}
    </svg>
  );
}

function WhoCard() {
  const [name, mask, talks, slug] = SPEAKERS[0];
  const y = bits(mask);
  const rings = [];
  for (let j = 12; j >= 1; j--) {
    rings.push(
      <circle
        key={j}
        data-ring={j}
        cx="32"
        cy="32"
        r={(3 + 2.3 * (j - 1)).toFixed(1)}
        fill={RING_COLORS[(j - 1) % 4]}
        stroke={COLORS.ink}
        strokeWidth=".7"
        style={{ opacity: j <= y ? 1 : 0 }}
      />,
    );
  }
  let on = 0;
  return (
    <div className="rd-hm-who-card" data-hm="who-card">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {rings}
      </svg>
      <div className="rd-hm-who-text" data-hm="who-text" aria-live="polite">
        <b data-hm="who-name">{name}</b>
        <span data-hm="who-meta">{speakerMeta(y, talks)}</span>
      </div>
      <ol className="rd-hm-who-years">
        {WHO_YEAR_LABELS.map((label, i) => {
          const lit = ((mask >> i) & 1) === 1;
          const bg = lit ? RING_COLORS[on++ % 4] : undefined;
          return (
            <li key={i}>
              {/* plain <a>: a year they spoke links to that year's speaker page, and the script retargets it when another speaker is shown */}
              <a data-year={i} href={lit ? withBasePath(speakerLink(slug, i)) : undefined} aria-label={lit ? `${name}, ${yearName(i)}` : undefined}>
                <i data-cell={i} style={bg ? { backgroundColor: bg } : undefined} />
                {label}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Phones: the card beside the cluster would sit a screen below it, so the chosen speaker is shown
// in a small lens pinned to their ring instead. The script positions it and keeps it hidden on wide
// layouts. The lens is the way in: it opens the card of their years (or their page, if they spoke once).
function SpeakerLens() {
  const [name, mask, talks] = SPEAKERS[0];
  const y = bits(mask);
  let on = 0;
  return (
    <a className="rd-hm-lens" data-hm="lens" href="#numbers" hidden>
      <span className="rd-hm-lens-tx">
        <b data-hm="lens-name">{name}</b>
        <span data-hm="lens-meta">{speakerMeta(y, talks)}</span>
        <span className="rd-hm-lens-years" aria-hidden="true">
          {WHO_YEAR_LABELS.map((label, i) => {
            const bg = (mask >> i) & 1 ? RING_COLORS[on++ % 4] : undefined;
            return <i key={i} data-lcell={i} style={bg ? { backgroundColor: bg } : undefined} />;
          })}
        </span>
      </span>
      <em aria-hidden="true">→</em>
    </a>
  );
}

// What a session tile or an event tile answers with (the script fills and places it), and the card
// a mark opens into: a speaker's years, or an event's facts. On phones the card is a bottom sheet.
function MarkLabel() {
  return (
    <a className="rd-hm-tag" data-hm="tag" tabIndex={-1} hidden>
      <i data-hm="tag-sw" />
      <span className="rd-hm-tag-tx">
        <b data-hm="tag-name" />
        <span data-hm="tag-meta" />
        <small data-hm="tag-more" />
      </span>
      <em aria-hidden="true">→</em>
    </a>
  );
}
function MarkCard() {
  return (
    <>
      <div className="rd-hm-scrim" data-hm="scrim" />
      <div className="rd-hm-pop" data-hm="pop" role="dialog" aria-labelledby="rd-hm-pop-h" hidden>
        <button type="button" className="rd-hm-pop-x" data-hm="pop-x" aria-label="Close">
          ×
        </button>
        <div data-hm="pop-body" />
      </div>
    </>
  );
}

function EventStage() {
  const e = EVENTS[0];
  const links = eventLinks(e);
  return (
    <article className="rd-hm-ev-stage rd-rv">
      <span className={`rd-hm-ev-stamp rd-hm-v-${e.v}`} data-hm="ev-stamp" aria-hidden="true">
        {e.stamp}
      </span>
      <canvas data-hm="ev-cv" role="img" aria-label="A photo from the selected event, drawn as a mosaic of small tiles." />
      <div className="rd-hm-ev-info" data-hm="ev-info" aria-live="polite">
        <p className="rd-hm-ev-venue">
          <i className={`rd-hm-sw rd-hm-v-${e.v}`} data-hm="ev-sw" />
          <span data-hm="ev-venue">{VENUES[e.v].name}</span>
          <span>·</span>
          <span data-hm="ev-date">{e.date}</span>
        </p>
        <div>
          <h3 data-hm="ev-title">{e.title}</h3>
          <p className="rd-hm-ev-note" data-hm="ev-note">
            {e.note}
          </p>
        </div>
        <dl className="rd-hm-ev-facts" data-hm="ev-facts" hidden={e.se == null}>
          <div>
            <dd data-hm="ev-se">{e.se ?? ""}</dd>
            <dt>sessions</dt>
          </div>
          <div>
            <dd data-hm="ev-sp">{e.sp ?? ""}</dd>
            <dt>speakers</dt>
          </div>
        </dl>
        {/* plain <a>: the script retargets these two when another year is picked */}
        <p className="rd-hm-ev-go">
          <a data-hm="ev-l1" href={withBasePath(links.l1)}>
            {links.l1Text}
          </a>
          <a data-hm="ev-l2" href={withBasePath(links.l2 ?? links.l1)} hidden={!links.l2}>
            Speakers
          </a>
          <a href={YOUTUBE}>Videos</a>
        </p>
      </div>
    </article>
  );
}

function EventWall() {
  const groups: { v: VenueKey; items: { e: HomeEvent; i: number }[] }[] = [];
  EVENTS.forEach((e, i) => {
    const last = groups[groups.length - 1];
    if (last && last.v === e.v) last.items.push({ e, i });
    else groups.push({ v: e.v, items: [{ e, i }] });
  });
  return (
    <div className="rd-hm-yrs rd-rv" data-hm="yrs">
      {groups.map((g) => (
        <div key={g.v}>
          <p className="rd-hm-yg-h">
            {VENUES[g.v].name}
            <small>{VENUES[g.v].years}</small>
          </p>
          <div className="rd-hm-yg-t">
            {g.items.map(({ e, i }) => (
              <button
                key={e.slug}
                type="button"
                className={`rd-hm-yt rd-hm-v-${e.v}${i === 0 ? " is-on" : ""}`}
                data-i={i}
                aria-pressed={i === 0}
                aria-label={`${e.title}, ${e.date}`}
              >
                {e.mon ? <small>{e.mon}</small> : null}
                {e.tile}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackYears() {
  const venueOf: Record<string, VenueKey> = {};
  EVENTS.forEach((e) => (venueOf[e.slug] = e.v));
  return (
    <div className="rd-hm-years" data-hm="years">
      {TRACK_YEARS.map((y) => (
        <div className="rd-hm-yr rd-rv" key={y}>
          <a className={`rd-hm-yt rd-hm-v-${venueOf[y] || "foothill"}`} href="#events" data-ev={y} aria-label={`Code Camp ${y}`}>
            {y.slice(2)}
          </a>
          <ul className="rd-hm-tags">
            {TRACKS[y].map((t) => {
              const s = t[1] >= 9 ? 3 : t[1] >= 5 ? 2 : 1;
              return (
                <li key={t[2]} className={`rd-hm-s${s}`} data-t={t[3]}>
                  <Link href={`/track/${y}/${t[2]}/`} prefetch={false} title={`${t[1]} sessions in ${y}`}>
                    {t[0]}
                    <i>{t[1]}</i>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <HomeInteractive>
      <section className="rd-hm-hero">
        <i className="rd-hm-deco rd-hm-deco--1" aria-hidden="true" />
        <i className="rd-hm-deco rd-hm-deco--2" aria-hidden="true" />
        <i className="rd-hm-deco rd-hm-deco--3" aria-hidden="true" />
        <i className="rd-hm-deco rd-hm-deco--4" aria-hidden="true" />
        <div className="rd-wrap rd-hm-hero-in">
          <div className="rd-hm-hero-copy">
            <span className="rd-chip">Since 2006 · 17 events</span>
            <h1>
              Where developers learn from <em>developers.</em>
            </h1>
            <p className="rd-hm-lede">
              A community coding conference in Silicon Valley. Whole weekends of sessions on everything from JavaScript to machine learning.
            </p>
            <div className="rd-hm-cta">
              <a className="rd-btn rd-btn--b" href="#events">
                Explore the 17 events
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 2v12M3 9l5 5 5-5" />
                </svg>
              </a>
              <a className="rd-btn" href={YOUTUBE}>
                Watch the videos
              </a>
            </div>
          </div>
          <div className="rd-hm-art">
            <canvas data-hm="mosaic" role="img" aria-label="The SVCC logo, four colored tiles with the letters S, V, C and C, built from 2,013 small tiles." />
            <p>
              <b>2,013 tiles.</b> One for every session. Run your cursor through it.
            </p>
          </div>
        </div>
      </section>

      <div className="rd-hm-ribbon">
        <div className="rd-hm-ribbon-in">
          <div className="rd-hm-ribbon-track">
            <span>
              <a href="#events" data-v="campfire">
                Code Campfire
              </a>
            </span>
            <span>
              <a href="#events" data-v="paypal">
                PayPal Town Hall
              </a>
            </span>
            <span>
              <a href="#events" data-v="evergreen">
                Evergreen Valley College
              </a>
            </span>
            <span>
              <a href="#events" data-v="foothill">
                Foothill College
              </a>
            </span>
          </div>
        </div>
      </div>

      <section className="rd-band rd-band--ink" id="numbers">
        <div className="rd-wrap">
          <div className="rd-hm-head rd-rv">
            <div>
              <h2 className="rd-h2">One mark for every one.</h2>
              <p className="rd-sub">
                Nothing here is rounded off. Every session, speaker and event from 2006 to 2023 gets its own mark, and so does every person who
                came to a Code Camp.
              </p>
            </div>
          </div>
          <div className="rd-hm-gal" data-hm="gal">
            <div className="rd-hm-gal-stage">
              <canvas
                data-hm="gal-cv"
                role="img"
                aria-label="A field of 37,954 specks of confetti, one per person who came to a Code Camp from 2006 to 2019, behind a disc of 2,013 session tiles ordered by year, a cluster of 930 speaker marks with one ring for every event each spoke at, and a dial of 17 event tiles labeled with their years."
              />
              <SpeakerLens />
              <MarkLabel />
              <MarkCard />
              <div className="rd-hm-labs">
                <div className="rd-hm-lab rd-hm-lab-crowd">
                  <b>37,954</b>
                  <span>people came to a Code Camp</span>
                  <small>
                    <i className="rd-hm-key rd-hm-key--speck" />
                    2006 to 2019 · 4,996 in 2014 alone
                  </small>
                </div>
                <div className="rd-hm-lab rd-hm-lab-speakers">
                  <b>930</b>
                  <span>speakers</span>
                  <small>
                    <i className="rd-hm-key rd-hm-key--ring" />
                    305 came back for more than one event
                  </small>
                </div>
                <div className="rd-hm-lab rd-hm-lab-sessions">
                  <b data-hm="ses-n">2,013</b>
                  <span data-hm="ses-what">sessions</span>
                  <small>
                    <i className="rd-hm-key rd-hm-key--tile" />
                    2008 to 2023
                  </small>
                </div>
                <div className="rd-hm-lab rd-hm-lab-events">
                  <b>17</b>
                  <span>events</span>
                  <small>
                    <i className="rd-hm-key rd-hm-key--block" />
                    14 camps · 3 online
                  </small>
                </div>
              </div>
            </div>
            <aside className="rd-hm-who rd-rv" aria-label="Returning speakers">
              <h3>They kept coming back</h3>
              <p className="rd-hm-who-sub">
                305 of the 930 speakers spoke at more than one event. These eight came back the most.
              </p>
              <WhoCard />
              <ol className="rd-hm-who-list" data-hm="who-list">
                {SPEAKERS.slice(0, 8).map(([name, mask], i) => {
                  const y = bits(mask);
                  return (
                    <li key={name}>
                      <button type="button" data-row={i}>
                        <MiniRings y={y} />
                        <b>{name}</b>
                        <small>{y} events</small>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>
          </div>
          <ul className="rd-hm-records rd-rv">
            <li>
              <a href="#events" data-ev="2014">
                <b>4,996</b>people in 2014, the biggest crowd
              </a>
            </li>
            <li>
              <a href="#events" data-ev="2013">
                <b>229</b>sessions in 2013, the fullest schedule
              </a>
            </li>
            <li>
              <a href="#numbers" data-spk="0">
                <b>12 for 12</b>Douglas Crockford, every year from 2008 to 2019
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="rd-band rd-band--b" id="events">
        <div className="rd-wrap">
          <div className="rd-hm-head rd-hm-head--flush rd-rv">
            <div>
              <h2 className="rd-h2">Seventeen events, four homes</h2>
              <p className="rd-sub">Pick a year. Code Camps come first, newest at the top, then the three online Campfires.</p>
            </div>
          </div>
          <div className="rd-hm-ev">
            <EventStage />
            <EventWall />
          </div>
        </div>
      </section>

      <section className="rd-band rd-band--g" id="tracks">
        <div className="rd-wrap">
          <div className="rd-hm-head rd-rv">
            <div>
              <h2 className="rd-h2">You can tell the year by the tracks</h2>
              <p className="rd-sub">
                Every track from 2009 to 2019, newest first, with its number of sessions. Pick a theme to follow it through the years.
              </p>
            </div>
          </div>
          <div className="rd-hm-themes rd-rv" data-hm="themes" role="group" aria-label="Themes">
            {THEMES.map(([k, label]) => (
              <button key={k} type="button" data-t={k} aria-pressed="false">
                {label}
                <small>
                  {THEME_COUNT[k]} of {TRACK_YEARS.length}
                </small>
              </button>
            ))}
          </div>
          <p className="rd-hm-theme-say" data-hm="theme-say" aria-live="polite">
            {THEME_REST}
          </p>
          <TrackYears />
        </div>
      </section>

      <section className="rd-band rd-band--p" id="sponsors">
        <div className="rd-wrap">
          <div className="rd-hm-head rd-rv">
            <div>
              <h2 className="rd-h2">We kept good company</h2>
              <p className="rd-sub">More than a hundred sponsors backed Code Camp over the years. Here are some you might recognize.</p>
            </div>
          </div>
          <div className="rd-hm-pile rd-rv" data-hm="pile">
            {SPONSORS.map(([id, name, size]) => (
              <div key={id} className={`rd-hm-logo rd-hm-${size}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, plain img with basePath */}
                <img src={withBasePath(`/static-images/sponsors/${id}.webp`)} alt={name} loading="lazy" decoding="async" />
              </div>
            ))}
            <canvas className="rd-hm-pile-fx" aria-hidden="true" />
            <div className="rd-hm-sp-tag" aria-hidden="true">
              <b />
              <span />
            </div>
          </div>
          <div className="rd-hm-after rd-rv">
            <Link className="rd-btn rd-btn--o" href="/sponsor/2014/">
              See every sponsor by year
            </Link>
          </div>
        </div>
      </section>

      <section className="rd-band" id="about">
        <div className="rd-wrap rd-hm-about">
          <div className="rd-hm-collage rd-rv">
            <button className="rd-hm-stack" data-hm="stack" type="button" aria-label="Show the next photo">
              {STACK.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- static export, plain img with basePath
                <img key={p.src} src={withBasePath(p.src)} data-cap={p.cap} data-p={i} alt={p.alt} loading="lazy" decoding="async" />
              ))}
            </button>
            <p className="rd-hm-stack-cap">
              <span data-hm="stack-cap">{STACK[0].cap}</span>Click the stack for the next photo
            </p>
            <div className="rd-hm-badge" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="rd-hm-ring" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" />
                </defs>
                <circle cx="60" cy="60" r="58" />
                <text>
                  <textPath href="#rd-hm-ring" textLength="278">
                    SINCE 2006 · 17 EVENTS · 930 SPEAKERS ·
                  </textPath>
                </text>
              </svg>
              <div className="rd-tiles">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div>
            <blockquote>
              “Silicon Valley Code Camp is put on by a dedicated group of volunteers whose mission is to both provide the highest quality content
              built around the topic of computer code, as well as create an environment where shared knowledge is paramount.”
              <cite>From the About page. The volunteers included the organizers and every speaker.</cite>
            </blockquote>
            <div className="rd-hm-cta">
              <Link className="rd-btn rd-btn--b" href="/about/2019/">
                About Code Camp
              </Link>
              <Link className="rd-btn" href="/news/2019/">
                Read the news
              </Link>
            </div>
          </div>
        </div>
      </section>
    </HomeInteractive>
  );
}
