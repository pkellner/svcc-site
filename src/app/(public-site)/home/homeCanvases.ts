// REDESIGN-PLAN.md: the home page script, ported from the "SVCC Home Redesign" prototype.
// The prototype's IIFEs are init(env) => dispose sections. Every lookup goes through the root
// element, every listener gets the AbortController signal, every observer is disconnected, every
// timer and animation frame is cancelled, and every attribute a section changes is put back on
// dispose, so a second init (StrictMode, or a route kept alive and shown again) starts clean.
// The markup itself is server-rendered from homeData.ts; nothing here builds DOM that React owns.

import {withBasePath} from "@/lib/basePath";
import {
  COLORS,
  EVENTS,
  PEOPLE,
  SPEAKERS,
  SPONSORS,
  THEME_REST,
  VENUES,
  WHO_YEAR_SLUGS,
  bits,
  eventLinks,
  speakerLink,
  speakerMeta,
  themeSay,
  yearName,
  type HomeEvent,
  type SponsorRow,
  type ThemeKey,
  type VenueKey,
} from "./homeData";

type Ctx = CanvasRenderingContext2D;
type Dispose = () => void;

interface Gov {
  level: number;
  last: number;
  ema: number;
  n: number;
  tick(now: number): void;
}

interface Env {
  root: HTMLElement;
  signal: AbortSignal;
  reduce: boolean;
  GOV: Gov;
  LOGO: string[];
  tok(name: string, fallback: string): string;
  q<T extends Element = HTMLElement>(name: string): T | null;
  rr(c: Ctx, x: number, y: number, w: number, h: number, r: number): void;
  watch(el: Element, fn: (visible: boolean) => void): void;
  onResize(el: Element, fn: () => void): void;
  observe(el: Element, init: IntersectionObserverInit, fn: (en: IntersectionObserverEntry[]) => void): void;
  later(fn: () => void, ms: number): void;
  keep(el: Element | null | undefined): void;
  on<K extends keyof HTMLElementEventMap>(el: EventTarget, type: K, fn: (e: HTMLElementEventMap[K]) => void): void;
  hooks: { pickSpeaker: ((i: number) => void) | null; pickEvent: ((slug: string) => void) | null };
}

const KEPT_ATTRS = ["class", "style", "hidden", "aria-pressed", "href", "data-p"];

function ease(x: number) {
  x = x < 0 ? 0 : x > 1 ? 1 : x;
  return 1 - (1 - x) * (1 - x) * (1 - x);
}
function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function initHome(root: HTMLElement, signal: AbortSignal): Dispose {
  const cleanups: Dispose[] = [];
  const timers = new Set<number>();
  const kept = new Map<Element, (string | null)[]>();
  const css = getComputedStyle(document.documentElement);

  /* watches the real frame rate; if the machine can't keep up it steps quality down (level 1: lower resolution, level 2: simpler shapes and no idle motion) */
  const GOV: Gov = {
    level: 0,
    last: 0,
    ema: 16,
    n: 0,
    tick(now: number) {
      if (now === this.last) return;
      const dt = now - this.last;
      this.last = now;
      if (dt > 0 && dt < 200) {
        this.ema += (dt - this.ema) * 0.06;
        this.n++;
        if (this.n > 90 && this.ema > 27 && this.level < 2) {
          this.level++;
          this.n = 0;
          this.ema = 16;
        }
      }
    },
  };
  const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

  const env: Env = {
    root,
    signal,
    reduce: !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    GOV,
    LOGO: [tok("--rd-g", COLORS.g), tok("--rd-o", COLORS.o), tok("--rd-b", COLORS.b), tok("--rd-p", COLORS.p)],
    tok,
    q: <T extends Element = HTMLElement>(name: string) => root.querySelector<T>(`[data-hm="${name}"]`) as T | null,
    rr(c, x, y, w, h, r) {
      if (typeof c.roundRect === "function" && GOV.level < 2) c.roundRect(x, y, w, h, r);
      else c.rect(x, y, w, h);
    },
    watch(el, fn) {
      if (!("IntersectionObserver" in window)) {
        fn(true);
        return;
      }
      env.observe(el, { rootMargin: "120px" }, (en) => fn(en[en.length - 1].isIntersecting));
    },
    onResize(el, fn) {
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
          if (!signal.aborted) fn();
        });
        ro.observe(el);
        cleanups.push(() => ro.disconnect());
      } else window.addEventListener("resize", fn, { signal });
    },
    observe(el, init, fn) {
      const io = new IntersectionObserver((en) => {
        if (!signal.aborted) fn(en);
      }, init);
      io.observe(el);
      cleanups.push(() => io.disconnect());
    },
    later(fn, ms) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!signal.aborted) fn();
      }, ms);
      timers.add(id);
    },
    keep(el) {
      if (!el || kept.has(el)) return;
      kept.set(
        el,
        KEPT_ATTRS.map((a) => el.getAttribute(a)),
      );
    },
    on(el, type, fn) {
      el.addEventListener(type, fn as EventListener, { signal });
    },
    hooks: { pickSpeaker: null, pickEvent: null },
  };

  for (const init of [initMosaic, initGallery, initEvents, initTracks, initTies, initPile]) {
    try {
      cleanups.push(init(env));
    } catch (err) {
      // a section that can't run (old browser, no canvas) must not take the others down
      if (process.env.NODE_ENV !== "production") console.warn("home: section init failed", err);
    }
  }

  return () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
    cleanups.length = 0;
    kept.forEach((vals, el) => {
      KEPT_ATTRS.forEach((a, i) => {
        const v = vals[i];
        if (v == null) el.removeAttribute(a);
        else if (el.getAttribute(a) !== v) el.setAttribute(a, v);
      });
    });
    kept.clear();
    env.hooks.pickSpeaker = env.hooks.pickEvent = null;
  };
}

/** A requestAnimationFrame loop handle that is dead after dispose. */
function loop(env: Env, frame: (now: number) => void) {
  let raf = 0;
  const h = {
    get on() {
      return raf !== 0;
    },
    clear() {
      raf = 0;
    },
    next() {
      if (!env.signal.aborted) raf = requestAnimationFrame(frame);
    },
    kick() {
      if (!raf && !env.signal.aborted) raf = requestAnimationFrame(frame);
    },
    cancel() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
  return h;
}

/* ---------- hero: the logo as a mosaic of 2,013 tiles ---------- */
function initMosaic(env: Env): Dispose {
  const { GOV, rr, reduce, LOGO } = env;
  const cv = env.q<HTMLCanvasElement>("mosaic");
  if (!cv || !cv.getContext) return () => {};
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  interface P {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ux: number;
    uy: number;
    c: number;
  }
  const N = 2013;
  let G = 54,
    size = 0,
    dpr = 1,
    P: P[] = [],
    lists: P[][] = [[], [], [], []],
    visible = false,
    born = 0,
    lvl = 0,
    drawn = 0,
    busy = 0;
  const ptr = { on: false, x: 0, y: 0 };
  const ripples: { x: number; y: number; t: number }[] = [];

  function sample(g: number) {
    const SS = 4,
      n = g * SS,
      c = mk(n, n);
    const x = c.getContext("2d", { willReadFrequently: true });
    const out: { gx: number; gy: number; cov: number; c: number }[] = [];
    if (!x) return out;
    const pad = n * 0.01,
      gap = n * 0.05,
      t = (n - pad * 2 - gap) / 2;
    ["S", "V", "C", "C"].forEach((ch, i) => {
      const x0 = pad + (i % 2) * (t + gap),
        y0 = pad + (i >> 1) * (t + gap);
      x.globalCompositeOperation = "source-over";
      x.clearRect(0, 0, n, n);
      x.fillStyle = "#000";
      x.beginPath();
      rr(x, x0, y0, t, t, t * 0.2);
      x.fill();
      x.globalCompositeOperation = "destination-out";
      x.font = "800 " + Math.round(t * 0.6) + 'px Unbounded, "Arial Black", Arial, sans-serif';
      x.textAlign = "center";
      x.textBaseline = "alphabetic";
      const m = x.measureText(ch),
        asc = m.actualBoundingBoxAscent || t * 0.44,
        desc = m.actualBoundingBoxDescent || 0;
      x.fillText(ch, x0 + t / 2, y0 + t / 2 + (asc - desc) / 2);
      const d = x.getImageData(0, 0, n, n).data;
      for (let gy = 0; gy < g; gy++)
        for (let gx = 0; gx < g; gx++) {
          let s = 0;
          for (let a = 0; a < SS; a++) for (let b = 0; b < SS; b++) s += d[((gy * SS + a) * n + gx * SS + b) * 4 + 3];
          const cov = s / (SS * SS * 255);
          if (cov >= 0.5) out.push({ gx, gy, cov, c: i });
        }
    });
    return out;
  }
  function build() {
    let cells: ReturnType<typeof sample> = [],
      g: number;
    for (g = 44; g <= 84; g += 2) {
      cells = sample(g);
      if (cells.length >= N) break;
    }
    G = Math.min(g, 84);
    cells.sort((a, b) => b.cov - a.cov);
    cells = cells.slice(0, N);
    cells.sort((a, b) => a.c - b.c || a.gy - b.gy || a.gx - b.gx);
    const fresh = P.length !== cells.length;
    if (fresh) P = cells.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, ux: 0, uy: 0, c: 0 }));
    lists = [[], [], [], []];
    cells.forEach((c, i) => {
      const p = P[i];
      p.ux = (c.gx + 0.5) / G;
      p.uy = (c.gy + 0.5) / G;
      p.c = c.c;
      lists[c.c].push(p);
      if (fresh && size) {
        p.x = p.ux * size;
        p.y = p.uy * size;
      }
    });
  }
  function fit(keep?: boolean) {
    size = cv!.clientWidth || 400;
    dpr = Math.min(window.devicePixelRatio || 1, GOV.level ? 1 : 2);
    cv!.width = cv!.height = Math.round(size * dpr);
    if (!keep)
      P.forEach((p) => {
        p.x = p.ux * size;
        p.y = p.uy * size;
        p.vx = p.vy = 0;
      });
  }
  const L = loop(env, frame);
  function frame(now: number) {
    L.clear();
    if (now) GOV.tick(now);
    if (lvl !== GOV.level) {
      lvl = GOV.level;
      fit(true);
    }
    if (!born && now) born = now;
    const it = reduce ? 1e6 : born ? now - born : 0,
      intro = it < 1900;
    if (ptr.on || ripples.length) busy = now + 800;
    const hot = intro || now < busy,
      still = GOV.level > 1 && !hot;
    if (now && !hot && !still && now - drawn < 31) {
      if (visible && !reduce) L.next();
      return;
    }
    drawn = now;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, size, size);
    const s0 = (size / G) * 0.84,
      R = size * 0.17,
      R2 = R * R;
    let i, k, p, dx, dy, d2, d, f, tx, ty, rp, age, w, s, e, oy, c, Ls;
    for (k = ripples.length - 1; k >= 0; k--) if (now - ripples[k].t > 1500) ripples.splice(k, 1);
    for (i = 0; i < P.length; i++) {
      p = P[i];
      tx = p.ux * size;
      ty = p.uy * size;
      for (k = 0; k < ripples.length; k++) {
        rp = ripples[k];
        age = now - rp.t;
        dx = tx - rp.x;
        dy = ty - rp.y;
        d = Math.sqrt(dx * dx + dy * dy) || 1;
        w = Math.exp(-Math.pow((d - age * 0.4) / 48, 2)) * (1 - age / 1500) * size * 0.03;
        tx += (dx / d) * w;
        ty += (dy / d) * w;
      }
      p.vx += (tx - p.x) * 0.07;
      p.vy += (ty - p.y) * 0.07;
      if (ptr.on) {
        dx = p.x - ptr.x;
        dy = p.y - ptr.y;
        d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          d = Math.sqrt(d2) || 1;
          f = (1 - d / R) * 3;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      p.vx *= 0.8;
      p.vy *= 0.8;
      p.x += p.vx;
      p.y += p.vy;
    }
    for (c = 0; c < 4; c++) {
      ctx!.fillStyle = LOGO[c];
      Ls = lists[c];
      if (!intro) ctx!.beginPath();
      for (i = 0; i < Ls.length; i++) {
        p = Ls[i];
        s = reduce || still ? s0 : s0 * (1 + 0.07 * Math.sin(now * 0.0016 + p.ux * 9 + p.uy * 6));
        if (intro) {
          e = ease((it - (p.ux + p.uy) * 420) / 800);
          ctx!.globalAlpha = 0.25 + 0.75 * e;
          s *= 0.5 + 0.5 * e;
          oy = (1 - e) * size * 0.025;
          ctx!.beginPath();
          rr(ctx!, p.x - s / 2, p.y + oy - s / 2, s, s, s * 0.24);
          ctx!.fill();
        } else rr(ctx!, p.x - s / 2, p.y - s / 2, s, s, s * 0.24);
      }
      if (!intro) ctx!.fill();
    }
    ctx!.globalAlpha = 1;
    if (visible && !reduce && !still) L.next();
  }
  build();
  fit();
  frame(0);
  if (document.fonts && document.fonts.load) {
    document.fonts
      .load("800 40px Unbounded")
      .then(() => {
        if (env.signal.aborted) return;
        build();
        L.kick();
      })
      .catch(() => {});
  }
  env.onResize(cv, () => {
    if (Math.abs((cv.clientWidth || 0) - size) > 1) {
      fit();
      L.kick();
    }
  });
  env.watch(cv, (v) => {
    visible = v;
    if (v) L.kick();
  });
  if (!reduce) {
    env.on(cv, "pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.on = true;
      L.kick();
    });
    env.on(cv, "pointerleave", () => (ptr.on = false));
    env.on(cv, "pointercancel", () => (ptr.on = false));
    env.on(cv, "pointerdown", (e) => {
      const r = cv.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      if (ripples.length > 4) ripples.shift();
      L.kick();
    });
  }
  return () => L.cancel();
}

/* ---------- numbers: confetti for people, tiles for sessions, rings for speakers, a dial of year tiles for events ---------- */
interface Spk {
  name: string;
  mask: number;
  talks: number;
  slug: string;
  per: string;
  photo: number;
  y: number;
  r: number;
  ux: number;
  uy: number;
  h: number;
  l: number;
  dn: number;
  row: HTMLElement | null;
}
/** A mark the cursor can land on: speaker i of SPEAKERS, session tile i, or event i of EVENTS. */
type Mark = { t: "spk" | "ses" | "evt"; i: number };
/** public/home/sessions.json: [title, slug, first speaker, time, room], in tile order. */
type SessionRow = [string, string, string, string, string];

const GA = 2.399963229728653,
  STEP = 0.62,
  POP_KEY = "rd-hm-pop";
let speakerLayout: { SPK: Spk[]; EXT: number } | null = null;
let sessionRows: SessionRow[] | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));
const count = (n: number, word: string) => n + " " + word + (n === 1 ? "" : "s");

/* one mark per speaker, sized by how many events they spoke at, packed with the regulars in the middle (computed once per page load) */
function packSpeakers() {
  if (speakerLayout) {
    speakerLayout.SPK.forEach((s) => {
      s.h = 0;
      s.l = 0;
      s.row = null;
    });
    return speakerLayout;
  }
  const SPK: Spk[] = SPEAKERS.map((d) => {
    const y = bits(d[1]);
    return { name: d[0], mask: d[1], talks: d[2], slug: d[3], per: d[4], photo: d[5], y, r: 1 + STEP * (y - 1), ux: 0, uy: 0, h: 0, l: 0, dn: 0, row: null };
  });
  let A = 0;
  const n = SPK.length;
  SPK.forEach((s, k) => {
    const rad = Math.sqrt(A / Math.PI);
    s.ux = rad * Math.cos(k * GA);
    s.uy = rad * Math.sin(k * GA);
    A += (Math.PI * s.r * s.r) / 0.68;
  });
  for (let it = 0; it < 46; it++) {
    const pull = it < 36 ? 0.99 : 1;
    for (let i = 0; i < n; i++) {
      SPK[i].ux *= pull;
      SPK[i].uy *= pull;
    }
    for (let i = 0; i < n; i++) {
      const a = SPK[i];
      for (let j = i + 1; j < n; j++) {
        const b = SPK[j];
        let dx = b.ux - a.ux,
          dy = b.uy - a.uy;
        const min = a.r + b.r + 0.4;
        if (dx > min || dx < -min || dy > min || dy < -min) continue;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d >= min) continue;
        if (d < 0.001) {
          dx = 0.01;
          dy = 0.01;
          d = 0.0141;
        }
        const o = (min - d) / d,
          wa = (b.r * b.r) / (a.r * a.r + b.r * b.r);
        a.ux -= dx * o * wa;
        a.uy -= dy * o * wa;
        b.ux += dx * o * (1 - wa);
        b.uy += dy * o * (1 - wa);
      }
    }
  }
  let EXT = 1;
  SPK.forEach((s) => (EXT = Math.max(EXT, Math.sqrt(s.ux * s.ux + s.uy * s.uy) + s.r)));
  SPK.forEach((s) => (s.dn = Math.sqrt(s.ux * s.ux + s.uy * s.uy) / EXT));
  speakerLayout = { SPK, EXT };
  return speakerLayout;
}

function initGallery(env: Env): Dispose {
  const { GOV, rr, reduce, LOGO, tok } = env;
  const gal = env.q("gal"),
    cv = env.q<HTMLCanvasElement>("gal-cv");
  if (!gal || !cv || !cv.getContext) return () => {};
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  const stage = cv.parentElement as HTMLElement,
    card = env.q("who-card"),
    elText = env.q("who-text"),
    elName = env.q("who-name"),
    elMeta = env.q("who-meta"),
    elList = env.q("who-list");
  if (!card || !elText || !elName || !elMeta || !elList) return () => {};
  const lens = env.q<HTMLAnchorElement>("lens"),
    lensName = env.q("lens-name"),
    lensMeta = env.q("lens-meta"),
    lensCells = lens ? Array.from(lens.querySelectorAll<HTMLElement>("i[data-lcell]")) : [];
  if (lens) {
    env.keep(lens);
    lensCells.forEach((c) => env.keep(c));
  }
  /* the label a session or an event answers with, and the card a mark opens into */
  const tag = env.q<HTMLAnchorElement>("tag"),
    tagSw = env.q("tag-sw"),
    tagName = env.q("tag-name"),
    tagMeta = env.q("tag-meta"),
    tagMore = env.q("tag-more"),
    pop = env.q("pop"),
    popBody = env.q("pop-body"),
    popX = env.q<HTMLButtonElement>("pop-x"),
    scrim = env.q("scrim"),
    sesN = env.q("ses-n"),
    sesWhat = env.q("ses-what");
  [tag, tagSw, pop, scrim].forEach((el) => env.keep(el));
  const sesRest = sesN && sesWhat ? [sesN.textContent || "", sesWhat.textContent || ""] : null;
  const phone = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;

  const WIDE = { W: 860, H: 760, ses: [175, 290, 150], spk: [590, 360, 250], evt: [335, 632, 112] };
  const TALL = { W: 400, H: 730, ses: [110, 128, 98], spk: [200, 520, 190], evt: [302, 146, 90] };
  const INK = tok("--rd-ink", COLORS.ink),
    PAPER = tok("--rd-paper", COLORS.paper),
    SPECK = tok("--rd-speck", COLORS.speck),
    RINGS = [LOGO[0], LOGO[1], LOGO[2], tok("--rd-p2", COLORS.p2)],
    DISPLAY = tok("--rd-display", '"Unbounded", "Arial Black", sans-serif'),
    MONO = tok("--rd-mono", "monospace");
  /* the venue colors of the Events section: [tile, text] */
  const VCOL: Record<VenueKey, [string, string]> = {
    foothill: [LOGO[3], PAPER],
    evergreen: [LOGO[0], INK],
    paypal: [tok("--rd-y", COLORS.y), INK],
    campfire: [LOGO[1], INK],
  };
  function seed(a: number) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mix(k: number) {
    let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h & 3;
  }

  const { SPK, EXT } = packSpeakers();

  /* sessions are laid out oldest first, so tile k belongs to the event whose range holds k */
  const YEV = WHO_YEAR_SLUGS.map((slug) => EVENTS.find((e) => e.slug === slug) as HomeEvent),
    yCount = YEV.map((e) => e.se || 0),
    yStart: number[] = [];
  let NS = 0;
  yCount.forEach((n, i) => {
    yStart[i] = NS;
    NS += n;
  });
  const sesY = new Uint8Array(NS);
  yCount.forEach((n, i) => sesY.fill(i, yStart[i], yStart[i] + n));

  /* events: the Code Camps go round a dial in order, 2006 at the top; the three Campfires sit in the middle */
  interface DialTile {
    e: HomeEvent;
    ring: boolean;
    k: number;
    m: number;
  }
  const DIAL: DialTile[] = EVENTS.map((e) => {
    const ring = e.v !== "campfire";
    return { e, ring, k: ring ? +e.slug - 2006 : +e.slug.slice(-1) - 1, m: 0 };
  });
  const NRING = DIAL.filter((d) => d.ring).length || 1,
    NMID = DIAL.length - NRING || 1;

  /* the panel beside the cluster: one card for the chosen speaker, and the eight who came back the most */
  const ringEls: SVGCircleElement[] = [];
  card.querySelectorAll<SVGCircleElement>("circle[data-ring]").forEach((c) => {
    ringEls[+(c.getAttribute("data-ring") || 0)] = c;
    env.keep(c);
  });
  const cellEls = Array.from(card.querySelectorAll<HTMLElement>("i[data-cell]"));
  cellEls.forEach((c) => env.keep(c));
  const linkEls = Array.from(card.querySelectorAll<HTMLAnchorElement>("a[data-year]"));
  linkEls.forEach((a) => env.keep(a));
  env.keep(elText);
  env.keep(gal);
  env.keep(cv);

  let pinned: Spk | null = SPK[0] || null,
    wanted: Spk | null = null,
    shown: Spk | null = null,
    tm = 0,
    seq = 0;
  env.hooks.pickSpeaker = (i) => {
    const s = SPK[i];
    if (s) {
      pinned = s;
      want(s, true);
    }
  };
  function want(s: Spk | null, now?: boolean) {
    wanted = s;
    clearTimeout(tm);
    if (now) apply();
    else tm = window.setTimeout(apply, 60);
  }
  /* the year cells of the card are links to that year's speaker page */
  function yearLinks(s: Spk) {
    linkEls.forEach((a) => {
      const i = +(a.getAttribute("data-year") || 0);
      if ((s.mask >> i) & 1) {
        a.setAttribute("href", withBasePath(speakerLink(s.slug, i)));
        a.setAttribute("aria-label", s.name + ", " + yearName(i));
      } else {
        a.removeAttribute("href");
        a.removeAttribute("aria-label");
      }
    });
  }
  function apply() {
    if (env.signal.aborted) return;
    const s = wanted || pinned;
    if (!s || s === shown) {
      L.kick();
      return;
    }
    const prev = shown,
      my = ++seq;
    let idx = 0;
    shown = s;
    if (prev && prev.row) prev.row.classList.remove("is-on");
    if (s.row) s.row.classList.add("is-on");
    for (let k = 1; k <= 12; k++) if (ringEls[k]) ringEls[k].style.opacity = k <= s.y ? "1" : "0";
    cellEls.forEach((el, i) => {
      if ((s.mask >> i) & 1) {
        el.style.backgroundColor = RINGS[idx % 4];
        idx++;
      } else el.style.backgroundColor = "";
    });
    yearLinks(s);
    if (!prev) {
      elName!.textContent = s.name;
      elMeta!.textContent = speakerMeta(s.y, s.talks);
    } else {
      elText!.classList.add("is-out");
      env.later(() => {
        if (my !== seq) return;
        elName!.textContent = s.name;
        elMeta!.textContent = speakerMeta(s.y, s.talks);
        elText!.classList.remove("is-out");
      }, 110);
    }
    lensUpdate(s, true);
    busy = performance.now() + 900;
    drawn = 0;
    L.kick();
  }
  /* a label rides just above its mark (below it when there is no room), with its arrow on the mark */
  function float(el: HTMLElement, g: { x: number; y: number; r: number; under?: boolean }) {
    const lw = el.offsetWidth,
      lh = el.offsetHeight,
      left = Math.max(8, Math.min(cw - lw - 8, g.x - lw / 2));
    let top = g.y - g.r - 14 - lh;
    const flip = top < 8 || !!g.under;
    if (flip) top = g.y + g.r + 14;
    el.toggleAttribute("data-flip", flip);
    el.style.setProperty("--lx", left.toFixed(1) + "px");
    el.style.setProperty("--ly", top.toFixed(1) + "px");
    el.style.setProperty("--ax", Math.max(16, Math.min(lw - 16, g.x - left)).toFixed(1) + "px");
  }
  /* phones: the chosen speaker rides in a lens pinned above their ring, so the change shows where the finger is */
  let lensFor: Spk | null = null;
  function ringAt(s: Spk) {
    const k = SP.r / EXT;
    return { x: SP.x + s.ux * k, y: SP.y + s.uy * k, r: s.r * k };
  }
  function lensUpdate(s: Spk | null, pop: boolean) {
    if (!lens || !lensName || !lensMeta) return;
    if (lastWide !== false || !s || popM) {
      lens.hidden = true;
      return;
    }
    lens.hidden = false;
    if (s !== lensFor) {
      lensName.textContent = s.name;
      lensMeta.textContent = speakerMeta(s.y, s.talks);
      let idx = 0;
      lensCells.forEach((el, i) => {
        if ((s.mask >> i) & 1) {
          el.style.backgroundColor = RINGS[idx % 4];
          idx++;
        } else el.style.backgroundColor = "";
      });
      // one event: the lens is a link straight to that page. More: it opens the card of their years.
      lens.setAttribute("href", s.y === 1 ? withBasePath(speakerLink(s.slug, 31 - Math.clz32(s.mask))) : "#numbers");
      if (pop && !reduce && lensFor) {
        lens.classList.remove("is-pop");
        void lens.offsetWidth;
        lens.classList.add("is-pop");
      }
      lensFor = s;
    }
    float(lens, ringAt(s));
  }
  // A name picked from the row below should never light up a ring that is off screen.
  function revealRing(s: Spk) {
    if (lastWide !== false) return;
    const g = ringAt(s),
      y = cv!.getBoundingClientRect().top + g.y;
    if (y < 120 || y > window.innerHeight - 60) window.scrollBy({ top: y - window.innerHeight * 0.42, behavior: reduce ? "auto" : "smooth" });
  }
  elList.querySelectorAll<HTMLButtonElement>("button[data-row]").forEach((b) => {
    const s = SPK[+(b.getAttribute("data-row") || 0)];
    if (!s) return;
    env.keep(b);
    s.row = b;
    env.on(b, "pointerenter", () => want(s, true));
    env.on(b, "pointerleave", () => want(null));
    env.on(b, "focus", () => want(s, true));
    env.on(b, "blur", () => want(null));
    env.on(b, "click", () => {
      pinned = s;
      want(s, true);
      revealRing(s);
    });
  });

  interface Tile {
    r: number;
    c: number;
    u: number;
    x: number;
    y: number;
  }
  type Disc = { x: number; y: number; r: number };
  let cw = 0,
    ch = 0,
    dpr = 1,
    sc = 1,
    SES: Disc = { x: 0, y: 0, r: 1 },
    SP: Disc = { x: 0, y: 0, r: 1 },
    EV: Disc = { x: 0, y: 0, r: 1 },
    layers: HTMLCanvasElement[] = [],
    T: Tile[] = [],
    tile = 3,
    visible = false,
    lastW = -1,
    lastWide: boolean | null = null;
  const ptr = { on: false, x: 0, y: 0, touch: false };
  const F = { x: 0, y: 0, r: 0, set: false },
    C = { x: 0, y: 0, set: false };
  let glow = 0,
    clu: HTMLCanvasElement | null = null,
    cluS = 0,
    lvl = 0,
    drawn = 0,
    busy = 0,
    tick = 0,
    dim = 0,
    cardY = -1,
    started = false,
    tb = 0,
    bloom = reduce ? 1 : 0,
    spin = 0,
    spinK = 1,
    sesDim = 0,
    sesF = 0,
    popK = 0;
  /* what is in focus besides the speaker panel: the session or event under the label, and the mark whose card is open */
  let tagM: Mark | null = null,
    tagPin = false,
    tagFor: Mark | null = null,
    popM: Mark | null = null,
    popTm = 0,
    popW = 0,
    popT = 0,
    popFrom: Element | null = null,
    touched = false,
    touring = false,
    tourN = 0,
    tourWait = 0,
    tsx = 0,
    tsy = 0,
    scrub = false;
  const same = (a: Mark | null, b: Mark | null) => !!a && !!b && a.t === b.t && a.i === b.i;

  function measure() {
    if (lastWide && card) {
      const a = card.getBoundingClientRect(),
        b = cv!.getBoundingClientRect();
      cardY = a.top + a.height / 2 - b.top;
    } else cardY = -1;
  }
  function layout() {
    const gw = gal!.clientWidth;
    if (!gw) return false;
    const wide = gw >= 980;
    gal!.classList.toggle("is-wide", wide);
    // On narrow layouts the stage is display:contents (so the speaker row can sit right under the canvas); use the gallery's width.
    const w = wide ? stage.clientWidth : gw;
    if (w === lastW && wide === lastWide) {
      measure();
      return false;
    }
    lastW = w;
    lastWide = wide;
    const Lt = wide ? WIDE : TALL;
    sc = w / Lt.W;
    cw = w;
    ch = Math.round((w * Lt.H) / Lt.W);
    dpr = Math.min(window.devicePixelRatio || 1, GOV.level ? 1 : 2);
    cv!.width = Math.round(cw * dpr);
    cv!.height = Math.round(ch * dpr);
    const disc = (d: number[]): Disc => ({ x: d[0] * sc, y: d[1] * sc, r: d[2] * sc });
    SES = disc(Lt.ses);
    SP = disc(Lt.spk);
    EV = disc(Lt.evt);
    const ld = Math.min(dpr, 1.5),
      rnd = seed(7),
      per = [Math.ceil(PEOPLE / 2), Math.floor(PEOPLE / 2)];
    layers = per.map((n, li) => {
      const c = mk(Math.round(cw * ld), Math.round(ch * ld));
      const x = c.getContext("2d");
      if (!x) return c;
      const base = (li ? 2.1 : 1.3) * Math.max(0.7, Math.min(1, sc * 1.2)) * ld;
      for (let k = 0; k < n; k++) {
        const q = rnd(),
          sz = base * (0.7 + 0.6 * rnd());
        x.fillStyle = q < 0.4 ? SPECK : RINGS[Math.min(3, Math.floor((q - 0.4) / 0.15))];
        x.globalAlpha = (li ? 0.78 : 0.45) * (0.6 + 0.4 * rnd());
        x.fillRect(rnd() * (c.width - sz), rnd() * (c.height - sz), sz, sz);
      }
      return c;
    });
    tile = Math.sqrt((Math.PI * SES.r * SES.r) / NS) * 0.62;
    T = [];
    for (let k = 0; k < NS; k++) {
      const u = Math.sqrt((k + 0.5) / NS),
        r = SES.r * u * 0.97,
        a = k * GA + spin;
      T.push({ r, c: mix(k), u, x: SES.x + r * Math.cos(a), y: SES.y + r * Math.sin(a) });
    }
    F.set = false;
    measure();
    buildCluster();
    lensFor = null;
    lensUpdate(shown, false);
    if (popM && Math.abs(cw - popW) > 1) closePop(false);
    if (tagM && tag && !tag.hidden) float(tag, anchor(tagM));
    return true;
  }

  /* ---------- where a mark is, and which one the pointer is on ---------- */
  function dialRest(d: DialTile) {
    // the ring leaves one slot empty at the top, so the years have a visible start
    if (d.ring) return { a: -Math.PI / 2 + ((d.k + 1) / (NRING + 1)) * 6.2832, rad: EV.r * 0.74, s: EV.r * 0.27 };
    return { a: -Math.PI / 2 + (d.k / NMID) * 6.2832, rad: EV.r * 0.26, s: EV.r * 0.34 };
  }
  function anchor(m: Mark): { x: number; y: number; r: number; under?: boolean } {
    if (m.t === "spk") {
      const g = ringAt(SPK[m.i]);
      return { x: g.x, y: g.y, r: g.r * 1.3 + 5 };
    }
    if (m.t === "ses") return { x: T[m.i].x, y: T[m.i].y, r: tile / 2 + 5 };
    const d = DIAL[m.i],
      g = dialRest(d),
      rad = g.rad + (d.ring ? g.s * 0.42 : 0);
    // a tile in the lower half of the dial is labeled from below, so the label never covers the rest of the dial
    return { x: EV.x + rad * Math.cos(g.a), y: EV.y + rad * Math.sin(g.a), r: g.s * 0.92, under: Math.sin(g.a) > 0.2 };
  }
  function pick(): Mark | null {
    if (!ptr.on) return null;
    let dx = ptr.x - SP.x,
      dy = ptr.y - SP.y,
      best = -1,
      bd: number;
    if (dx * dx + dy * dy < SP.r * SP.r * 1.17) {
      bd = ptr.touch ? 22 : 6;
      const k = SP.r / EXT;
      for (let i = 0; i < SPK.length; i++) {
        const s = SPK[i],
          ex = ptr.x - (SP.x + s.ux * k),
          ey = ptr.y - (SP.y + s.uy * k),
          d = Math.sqrt(ex * ex + ey * ey) - s.r * k;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best < 0 ? null : { t: "spk", i: best };
    }
    dx = ptr.x - SES.x;
    dy = ptr.y - SES.y;
    if (dx * dx + dy * dy < SES.r * SES.r * 1.1) {
      bd = ptr.touch ? 22 : 10;
      bd *= bd;
      for (let i = 0; i < T.length; i++) {
        const ex = ptr.x - T[i].x,
          ey = ptr.y - T[i].y,
          d = ex * ex + ey * ey;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best < 0 ? null : { t: "ses", i: best };
    }
    dx = ptr.x - EV.x;
    dy = ptr.y - EV.y;
    if (dx * dx + dy * dy < EV.r * EV.r * 1.4) {
      bd = ptr.touch ? 1.2 : 0.78;
      for (let i = 0; i < DIAL.length; i++) {
        const g = dialRest(DIAL[i]),
          ex = ptr.x - (EV.x + g.rad * Math.cos(g.a)),
          ey = ptr.y - (EV.y + g.rad * Math.sin(g.a)),
          d = Math.sqrt(ex * ex + ey * ey) / g.s;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best < 0 ? null : { t: "evt", i: best };
    }
    return null;
  }

  /* ---------- the label: what a session or an event answers with ---------- */
  function sessionHref(i: number) {
    // before the titles arrive (or if they never do) a tile leads to its year's session list
    const row = sessionRows && sessionRows[i];
    return withBasePath("/session/" + YEV[sesY[i]].slug + "/" + (row ? row[1] + "/" : ""));
  }
  function tagFill(m: Mark) {
    if (!tag || !tagSw || !tagName || !tagMeta || !tagMore) return;
    if (m.t === "ses") {
      const row = sessionRows && sessionRows[m.i],
        yi = sesY[m.i];
      tagSw.style.backgroundColor = LOGO[T[m.i] ? T[m.i].c : 0];
      tagName.textContent = row ? row[0] : YEV[yi].title;
      tagMeta.textContent = yearName(yi) + (row && row[2] ? " · " + row[2] : "");
      tagMore.textContent = row ? [row[3], row[4] ? (/^\d/.test(row[4]) ? "Room " : "") + row[4] : ""].filter(Boolean).join(" · ") : "";
      tag.setAttribute("href", sessionHref(m.i));
    } else {
      const e = EVENTS[m.i];
      tagSw.style.backgroundColor = VCOL[e.v][0];
      tagName.textContent = e.title;
      tagMeta.textContent = VENUES[e.v].name + " · " + e.date;
      tagMore.textContent = e.se == null ? e.note : count(e.se, "session") + " · " + count(e.sp || 0, "speaker");
      tag.setAttribute("href", "#events");
    }
  }
  function readout(m: Mark | null) {
    if (!sesN || !sesWhat || !sesRest) return;
    const live = !!m && m.t === "ses";
    if (live) {
      const yi = sesY[m!.i];
      sesN.textContent = String(yCount[yi]);
      sesWhat.textContent = "sessions in " + yearName(yi);
    } else {
      sesN.textContent = sesRest[0];
      sesWhat.textContent = sesRest[1];
    }
    if (sesN.parentElement) sesN.parentElement.classList.toggle("is-live", live);
  }
  function setTag(m: Mark | null, pin: boolean, auto?: boolean) {
    // while a card is open nothing sits under the label, so nothing stale is left behind when it closes
    if (popM) m = null;
    tagM = m;
    tagPin = !!m && pin;
    if (tag) {
      if (!m) {
        tag.hidden = true;
        tagFor = null;
      } else {
        if (!same(m, tagFor)) {
          tagFill(m);
          tagFor = m;
        }
        tag.classList.toggle("is-pin", tagPin);
        tag.hidden = false;
        float(tag, anchor(m));
      }
    }
    readout(auto ? null : m);
    busy = performance.now() + 900;
    L.kick();
  }
  /* the titles arrive after the page: until then a session tile answers with its year alone */
  let asked = false;
  function loadRows() {
    if (sessionRows || asked) return;
    asked = true;
    fetch(withBasePath("/home/sessions.json"), { signal: env.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length !== NS) return;
        sessionRows = rows as SessionRow[];
        if (tagFor && tagFor.t === "ses" && tagM && tag) {
          tagFill(tagFor);
          float(tag, anchor(tagFor));
        }
      })
      .catch(() => {
        asked = false;
      });
  }

  /* ---------- the card: a speaker's rings open into their years, an event tile into its facts ---------- */
  function speakerCard(s: Spk) {
    const yrs: number[] = [];
    for (let i = 0; i < WHO_YEAR_SLUGS.length; i++) if ((s.mask >> i) & 1) yrs.push(i);
    const n = yrs.length,
      inner = s.photo ? 27 : 0,
      first = yearName(yrs[0]).slice(-4),
      last = yearName(yrs[n - 1]).slice(-4),
      every = n === yrs[n - 1] - yrs[0] + 1 && yrs[n - 1] < 12;
    let halo = "",
      tiles = "";
    for (let q = n; q >= 1; q--)
      halo += `<circle data-q="${q}" style="--rd-hm-i:${q - 1}" cx="50" cy="50" r="${(inner + ((48 - inner) * q) / n).toFixed(1)}" fill="${RINGS[(q - 1) % 4]}"/>`;
    if (s.photo)
      halo +=
        `<defs><clipPath id="rd-hm-halo-clip"><circle cx="50" cy="50" r="26"/></clipPath></defs><circle cx="50" cy="50" r="26" fill="${PAPER}" style="--rd-hm-i:0"/>` +
        `<image style="--rd-hm-i:0" href="${esc(withBasePath("/static-images/speakers/" + s.slug.slice(s.slug.lastIndexOf("-") + 1) + ".webp"))}" x="24" y="24" width="52" height="52" clip-path="url(#rd-hm-halo-clip)" preserveAspectRatio="xMidYMid slice"/>`;
    yrs.forEach((i, k) => {
      const e = YEV[i],
        talks = parseInt(s.per.charAt(k), 36) || 0;
      tiles +=
        `<a class="rd-hm-pop-yt" data-q="${k + 1}" style="background-color:${RINGS[k % 4]};--rd-hm-i:${k}" href="${esc(withBasePath(speakerLink(s.slug, i)))}" aria-label="${esc(s.name + ", " + yearName(i) + ", " + count(talks, "session"))}">` +
        (e.mon ? `<small>${esc(e.mon)}</small>` : "") +
        `<b>’${esc(e.tile)}</b><i>${count(talks, "talk")}</i></a>`;
    });
    return (
      `<div class="rd-hm-pop-top"><svg class="rd-hm-halo" viewBox="0 0 100 100" aria-hidden="true">${halo}</svg><div><h3 id="rd-hm-pop-h">${esc(s.name)}</h3>` +
      `<p class="rd-hm-pop-meta">${speakerMeta(s.y, s.talks)}</p><p class="rd-hm-pop-span">${every ? "every year, " + first + " to " + last : "between " + first + " and " + last}</p></div></div>` +
      `<div class="rd-hm-pop-yrs">${tiles}</div>`
    );
  }
  function eventCard(e: HomeEvent) {
    const links = eventLinks(e);
    return (
      `<div class="rd-hm-pop-top rd-hm-pop-top--ev"><span class="rd-hm-pop-stamp rd-hm-v-${e.v}" aria-hidden="true">${esc(e.stamp)}</span><div>` +
      `<p class="rd-hm-pop-venue">${esc(VENUES[e.v].name)} · ${esc(e.date)}</p><h3 id="rd-hm-pop-h">${esc(e.title)}</h3></div></div>` +
      (e.note ? `<p class="rd-hm-pop-note">${esc(e.note)}</p>` : "") +
      (e.se != null ? `<dl class="rd-hm-ev-facts"><div><dd>${e.se}</dd><dt>sessions</dt></div><div><dd>${e.sp ?? ""}</dd><dt>speakers</dt></div></dl>` : "") +
      `<p class="rd-hm-ev-go"><a href="${esc(withBasePath(links.l1))}">${esc(links.l1Text)}</a>` +
      (links.l2 ? `<a href="${esc(withBasePath(links.l2))}">Speakers</a>` : "") +
      `<a href="#events" data-ev="${esc(e.slug)}">Photo</a></p>`
    );
  }
  const markKey = (m: Mark) => (m.t === "spk" ? "spk:" + SPK[m.i].slug : "evt:" + EVENTS[m.i].slug);
  function openPop(m: Mark, restoring?: boolean) {
    if (!pop || !popBody || (m.t !== "spk" && m.t !== "evt")) return;
    clearTimeout(popTm);
    if (touring) endTour();
    popFrom = restoring ? null : document.activeElement;
    popM = m;
    popW = cw;
    popT = performance.now();
    setTag(null, false);
    popBody.innerHTML = m.t === "spk" ? speakerCard(SPK[m.i]) : eventCard(EVENTS[m.i]);
    pop.classList.remove("is-open");
    pop.hidden = false;
    if (phone && phone.matches) {
      pop.style.left = "";
      pop.style.top = "";
    } else {
      // beside the mark, on the side with more room; the card grows out of the mark itself
      // and it stays inside the part of the galaxy that is on screen
      const g = anchor(m),
        W = pop.offsetWidth,
        H = pop.offsetHeight,
        box = cv!.getBoundingClientRect(),
        lo = Math.max(8, 8 - box.top),
        hi = Math.min(ch - 8, window.innerHeight - box.top - 8),
        left = Math.max(8, Math.min(cw - W - 8, g.x > cw / 2 ? g.x - g.r - 26 - W : g.x + g.r + 26)),
        top = Math.max(lo, Math.min(Math.max(lo, hi - H), g.y - H / 2));
      pop.style.left = left.toFixed(1) + "px";
      pop.style.top = top.toFixed(1) + "px";
      pop.style.setProperty("--ox", (g.x - left).toFixed(1) + "px");
      pop.style.setProperty("--oy", (g.y - top).toFixed(1) + "px");
    }
    void pop.offsetWidth;
    pop.classList.add("is-open");
    if (scrim) scrim.classList.add("is-on");
    /* a year tile and its ring are the same year: point at one and the other answers */
    const halo = popBody.querySelector(".rd-hm-halo");
    if (halo)
      popBody.querySelectorAll<HTMLElement>(".rd-hm-pop-yt").forEach((a) => {
        const lit = (on: boolean) => {
          halo.classList.toggle("is-pick", on);
          halo.querySelectorAll("circle[data-q]").forEach((c) => c.classList.toggle("is-lit", on && c.getAttribute("data-q") === a.getAttribute("data-q")));
        };
        env.on(a, "pointerenter", () => lit(true));
        env.on(a, "pointerleave", () => lit(false));
        env.on(a, "focus", () => lit(true));
        env.on(a, "blur", () => lit(false));
      });
    lensUpdate(shown, false);
    if (!restoring && popX) popX.focus({ preventScroll: true });
    busy = performance.now() + 1200;
    L.kick();
  }
  function closePop(refocus: boolean) {
    if (!pop || !popM) return;
    popM = null;
    pop.classList.remove("is-open");
    if (scrim) scrim.classList.remove("is-on");
    clearTimeout(popTm);
    popTm = window.setTimeout(() => {
      pop.hidden = true;
      if (popBody) popBody.textContent = "";
    }, 320);
    lensUpdate(shown, false);
    if (refocus) {
      // back to whatever opened the card, or to the lens if that label is gone
      const from = popFrom instanceof HTMLElement && env.root.contains(popFrom) && popFrom.offsetParent ? popFrom : lens && !lens.hidden ? lens : null;
      if (from) from.focus({ preventScroll: true });
    }
    popFrom = null;
    try {
      sessionStorage.removeItem(POP_KEY);
    } catch {}
    busy = performance.now() + 900;
    L.kick();
  }
  /* a click on a mark: one destination goes straight there (same tab, so Back comes back), several open the card */
  function activate(m: Mark, newTab?: boolean) {
    const go = (href: string) => {
      if (newTab) window.open(href, "_blank", "noopener");
      else window.location.assign(href);
    };
    if (m.t === "spk") {
      const s = SPK[m.i];
      pinned = s;
      want(s, true);
      if (s.y > 1) openPop(m);
      else go(withBasePath(speakerLink(s.slug, 31 - Math.clz32(s.mask))));
    } else if (m.t === "evt") openPop(m);
    else go(sessionHref(m.i));
  }

  /* Left alone, the galaxy points at a few of its own sessions and events, so nobody has to guess that the marks
     have names (the speaker panel already shows one). Two rounds, and never again once someone has touched it. */
  function endTour() {
    if (!touring) return;
    touring = false;
    if (!tagPin) setTag(null, false);
  }
  function tourStep() {
    if (reduce || touched || tourN >= 4) {
      endTour();
      return;
    }
    if (touring) {
      endTour();
      env.later(tourStep, 1500);
      return;
    }
    if (visible && bloom >= 1 && sessionRows && !popM && !ptr.on && !tagM && !document.hidden) {
      setTag(tourN++ % 2 ? { t: "evt", i: Math.floor(Math.random() * DIAL.length) } : { t: "ses", i: Math.floor(Math.random() * NS) }, false, true);
      touring = true;
      env.later(tourStep, 2800);
    } else if (++tourWait < 180) env.later(tourStep, 1000);
  }

  function grow(u: number) {
    return bloom >= 1 ? 1 : 0.55 + 0.45 * ease(bloom * 1.7 - u * 0.7);
  }
  function ringPass(c: Ctx, k: number, live: boolean) {
    const n = SPK.length;
    c.lineWidth = Math.max(0.5, k * 0.16);
    c.strokeStyle = INK;
    for (let q = 12; q >= 1; q--) {
      c.fillStyle = RINGS[(q - 1) % 4];
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const s = SPK[i];
        if (s.y < q) break;
        const rj = (1 + STEP * (q - 1)) * k * (live ? (1 + 0.2 * s.h) * grow(s.dn) : 1),
          x = SP.x + s.ux * k,
          y = SP.y + s.uy * k;
        c.moveTo(x + rj, y);
        c.arc(x, y, rj, 0, 6.2832);
      }
      c.fill();
      if (GOV.level < 2) c.stroke();
    }
  }
  /* the resting cluster is drawn once and reused; only marks under the cursor or selected are redrawn each frame */
  function buildCluster() {
    cluS = Math.ceil(SP.r * 2.5);
    clu = mk(Math.round(cluS * dpr), Math.round(cluS * dpr));
    const c = clu.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, (cluS / 2 - SP.x) * dpr, (cluS / 2 - SP.y) * dpr);
    ringPass(c, SP.r / EXT, false);
  }
  function rings(s: Spk, k: number, alpha: number, lift: number) {
    const x = SP.x + s.ux * k,
      y = SP.y + s.uy * k,
      m = k * (1 + 0.2 * s.h + 0.75 * s.l + lift) * grow(s.dn);
    ctx!.globalAlpha = alpha;
    for (let q = s.y; q >= 1; q--) {
      ctx!.fillStyle = RINGS[(q - 1) % 4];
      ctx!.beginPath();
      ctx!.arc(x, y, (1 + STEP * (q - 1)) * m, 0, 6.2832);
      ctx!.fill();
      ctx!.stroke();
    }
    ctx!.globalAlpha = 1;
  }
  const L = loop(env, frame);
  function frame(now: number) {
    L.clear();
    if (now) GOV.tick(now);
    if (lvl !== GOV.level) {
      lvl = GOV.level;
      lastW = -1;
      layout();
    }
    if (ptr.on || (started && bloom < 1)) busy = now + 900;
    const hot = now < busy,
      still = GOV.level > 1 && !hot;
    if (now && !hot && !still && now - drawn < 31) {
      if (visible && !reduce) L.next();
      return;
    }
    const dt = drawn && now > drawn ? Math.min(64, now - drawn) : 0;
    drawn = now;
    const c2 = ctx!;
    const t = reduce ? 0 : now,
      RL = Math.max(70, cw * 0.11);
    let moving = false,
      i: number,
      q: number,
      p: Tile,
      dx: number,
      dy: number,
      d: number,
      x: number,
      y: number,
      c: number,
      s: Spk,
      sz: number,
      rj: number,
      tg: number,
      lt: number;
    if (started && bloom < 1) {
      bloom = Math.min(1, (now - tb) / 1700);
      moving = true;
    }
    if (++tick % 20 === 0) {
      measure();
      if (!started) {
        // the observer below can miss its one threshold crossing; a fifth of the canvas on screen is the same test
        const b = cv!.getBoundingClientRect();
        if (Math.min(b.bottom, window.innerHeight) - Math.max(b.top, 0) > b.height * 0.2) {
          started = true;
          tb = now;
          moving = true;
        }
      }
    }
    const eb = ease(bloom);
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, cw, ch);

    /* the cursor: an eased point that the confetti drifts away from and a soft light follows */
    if (ptr.on) {
      if (!C.set) {
        C.x = ptr.x;
        C.y = ptr.y;
        C.set = true;
      } else {
        C.x += (ptr.x - C.x) * 0.12;
        C.y += (ptr.y - C.y) * 0.12;
      }
    }
    tg = ptr.on ? 1 : 0;
    if (glow !== tg) {
      glow += (tg - glow) * 0.07;
      if (Math.abs(tg - glow) < 0.004) glow = tg;
      else moving = true;
    }
    const pxo = (C.x - cw / 2) * glow,
      pyo = (C.y - ch / 2) * glow,
      mg = cw * 0.025;
    c2.globalAlpha = 0.35 + 0.65 * eb;
    layers.forEach((Ly, li) => {
      const fz = li ? -0.045 : -0.018,
        off = (((t * (li ? 0.014 : 0.006) + pyo * fz) % ch) + ch) % ch,
        ox = pxo * fz - mg;
      c2.drawImage(Ly, ox, off, cw + 2 * mg, ch);
      c2.drawImage(Ly, ox, off - ch, cw + 2 * mg, ch);
    });
    c2.globalAlpha = 1;
    if (glow > 0.01) {
      c2.globalCompositeOperation = "lighter";
      const gg = c2.createRadialGradient(C.x, C.y, 0, C.x, C.y, RL * 1.6);
      gg.addColorStop(0, "rgba(159,220,247," + (0.26 * glow).toFixed(3) + ")");
      gg.addColorStop(1, "rgba(159,220,247,0)");
      c2.fillStyle = gg;
      c2.beginPath();
      c2.arc(C.x, C.y, RL * 1.6, 0, 6.2832);
      c2.fill();
      c2.globalCompositeOperation = "source-over";
    }
    const g = c2.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, INK);
    g.addColorStop(0.07, "rgba(12,18,38,0)");
    g.addColorStop(0.93, "rgba(12,18,38,0)");
    g.addColorStop(1, INK);
    c2.fillStyle = g;
    c2.fillRect(0, 0, cw, ch);
    [SES, SP, EV].forEach((Dd) => {
      const v = c2.createRadialGradient(Dd.x, Dd.y, Dd.r * 0.82, Dd.x, Dd.y, Dd.r * 1.16);
      v.addColorStop(0, "rgba(12,18,38,.92)");
      v.addColorStop(1, "rgba(12,18,38,0)");
      c2.fillStyle = v;
      c2.beginPath();
      c2.arc(Dd.x, Dd.y, Dd.r * 1.16, 0, 6.2832);
      c2.fill();
    });

    /* sessions: oldest in the middle, so each year is a ring. The disc turns slowly and holds still while the cursor or the label is on it. */
    const sesOn = tagM && tagM.t === "ses" ? tagM.i : -1;
    dx = ptr.x - SES.x;
    dy = ptr.y - SES.y;
    tg = sesOn >= 0 || (ptr.on && dx * dx + dy * dy < SES.r * SES.r * 1.21) ? 0 : 1;
    if (spinK !== tg) {
      spinK += (tg - spinK) * 0.12;
      if (Math.abs(tg - spinK) < 0.004) spinK = tg;
      else moving = true;
    }
    if (!reduce) spin -= dt * 0.00006 * spinK;
    if (sesOn >= 0) sesF = sesOn;
    tg = sesOn >= 0 ? 1 : 0;
    if (sesDim !== tg) {
      sesDim += (tg - sesDim) * 0.16;
      if (Math.abs(tg - sesDim) < 0.004) sesDim = tg;
      else moving = true;
    }
    const fy = sesY[sesF],
      nt = T.length;
    for (i = 0; i < nt; i++) {
      p = T[i];
      d = i * GA + spin;
      p.x = SES.x + p.r * Math.cos(d);
      p.y = SES.y + p.r * Math.sin(d);
    }
    /* the year of the tile in focus stays lit while the other years step back */
    for (q = 0; q < 2; q++) {
      if (q && !sesDim) break;
      c2.globalAlpha = q ? 1 : 1 - 0.7 * sesDim;
      for (c = 0; c < 4; c++) {
        c2.fillStyle = LOGO[c];
        c2.beginPath();
        for (i = q ? yStart[fy] : 0, d = q ? yStart[fy] + yCount[fy] : nt; i < d; i++) {
          p = T[i];
          if (p.c !== c) continue;
          sz = tile * grow(p.u);
          rr(c2, p.x - sz / 2, p.y - sz / 2, sz, sz, sz * 0.24);
        }
        c2.fill();
      }
    }
    c2.globalAlpha = 1;
    if (sesDim && T[sesF]) {
      c2.strokeStyle = "rgba(255,255,255," + (0.55 * sesDim).toFixed(3) + ")";
      c2.lineWidth = 1;
      rj = SES.r * Math.sqrt(yStart[fy] / NS) * 0.97 - tile * 0.8;
      if (rj > tile) {
        c2.beginPath();
        c2.arc(SES.x, SES.y, rj, 0, 6.2832);
        c2.stroke();
      }
      c2.beginPath();
      c2.arc(SES.x, SES.y, SES.r * Math.sqrt((yStart[fy] + yCount[fy]) / NS) * 0.97 + tile * 0.1, 0, 6.2832);
      c2.stroke();
      p = T[sesF];
      sz = tile + 8;
      c2.strokeStyle = "rgba(255,255,255," + sesDim.toFixed(3) + ")";
      c2.lineWidth = 2;
      c2.beginPath();
      rr(c2, p.x - sz / 2, p.y - sz / 2, sz, sz, sz * 0.26);
      c2.stroke();
    }

    const k = SP.r / EXT,
      n = SPK.length,
      popS = popM && popM.t === "spk" ? SPK[popM.i] : null;
    /* speakers: each mark swells as the cursor comes near, like a lens passing over the cluster */
    for (i = 0; i < n; i++) {
      s = SPK[i];
      tg = s === shown ? 1 : 0;
      if (s.h !== tg) {
        s.h += (tg - s.h) * 0.22;
        if (Math.abs(tg - s.h) < 0.004) s.h = tg;
        else moving = true;
      }
      lt = 0;
      if (ptr.on && !popM) {
        dx = ptr.x - (SP.x + s.ux * k);
        dy = ptr.y - (SP.y + s.uy * k);
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < RL) {
          lt = 1 - d / RL;
          lt *= lt;
        }
      }
      if (s.l !== lt) {
        s.l += (lt - s.l) * 0.14;
        if (Math.abs(lt - s.l) < 0.004) s.l = lt;
        else moving = true;
      }
    }
    if (bloom < 1 || !clu) ringPass(c2, k, true);
    else c2.drawImage(clu, SP.x - cluS / 2, SP.y - cluS / 2, cluS, cluS);
    tg = popS ? 1.3 : wanted ? 1 : 0;
    if (dim !== tg) {
      dim += (tg - dim) * 0.12;
      if (Math.abs(tg - dim) < 0.004) dim = tg;
      else moving = true;
    }
    if (dim > 0) {
      c2.fillStyle = "rgba(12,18,38," + (dim * 0.58).toFixed(3) + ")";
      c2.beginPath();
      c2.arc(SP.x, SP.y, SP.r * 1.03, 0, 6.2832);
      c2.fill();
    }
    /* the mark whose card is open stands a little taller than the rest */
    tg = popS ? 1 : 0;
    if (popK !== tg) {
      popK += (tg - popK) * 0.14;
      if (Math.abs(tg - popK) < 0.004) popK = tg;
      else moving = true;
    }
    c2.lineWidth = Math.max(0.5, k * 0.16);
    c2.strokeStyle = INK;
    for (i = n - 1; i >= 0; i--) {
      s = SPK[i];
      if (s.h > 0.02 || s.l > 0.02) rings(s, k, 1, s === shown ? 0.6 * popK : 0);
    }
    if (shown) {
      x = SP.x + shown.ux * k;
      y = SP.y + shown.uy * k;
      rj = shown.r * k * (1.2 + 0.6 * popK) * grow(shown.dn) + 4;
      if (!F.set) {
        F.x = x;
        F.y = y;
        F.r = rj;
        F.set = true;
      } else {
        F.x += (x - F.x) * 0.3;
        F.y += (y - F.y) * 0.3;
        F.r += (rj - F.r) * 0.3;
        if (Math.abs(x - F.x) + Math.abs(y - F.y) + Math.abs(rj - F.r) > 0.3) moving = true;
      }
      c2.strokeStyle = PAPER;
      c2.lineWidth = 2;
      c2.globalAlpha = 0.35 + 0.65 * eb;
      c2.beginPath();
      c2.arc(F.x, F.y, F.r, 0, 6.2832);
      c2.stroke();
      if (cardY >= 0) {
        const x0 = F.x + F.r,
          mx = x0 + (cw - x0) * 0.55;
        c2.globalAlpha = 0.2 + 0.5 * eb;
        c2.lineWidth = 1.5;
        c2.beginPath();
        c2.moveTo(x0, F.y);
        c2.bezierCurveTo(mx, F.y, mx, cardY, cw - 1, cardY);
        c2.stroke();
        c2.fillStyle = PAPER;
        c2.beginPath();
        c2.arc(cw - 4, cardY, 3.5, 0, 6.2832);
        c2.fill();
      }
      c2.globalAlpha = 1;
    }

    /* events: a dial of year tiles in venue colors. The one in focus grows. */
    const evOn = popM && popM.t === "evt" ? popM.i : tagM && tagM.t === "evt" ? tagM.i : -1;
    DIAL.forEach((dl, j) => {
      tg = j === evOn ? 1 : 0;
      if (dl.m !== tg) {
        dl.m += (tg - dl.m) * 0.2;
        if (Math.abs(tg - dl.m) < 0.004) dl.m = tg;
        else moving = true;
      }
    });
    c2.textAlign = "center";
    c2.textBaseline = "middle";
    for (q = 0; q < 2; q++) {
      // resting tiles first, then whichever is growing, so it sits on top. It grows outward and its neighbors stay put.
      DIAL.forEach((dl) => {
        if (dl.m > 0.001 ? !q : q) return;
        const gr = dialRest(dl),
          col = VCOL[dl.e.v],
          a = gr.a,
          rad = gr.rad + (dl.ring ? gr.s * 0.42 * dl.m : 0);
        sz = gr.s * (1 + (dl.ring ? 0.85 : 0.5) * dl.m) * grow(dl.ring ? 0.8 : 0.2);
        c2.save();
        c2.translate(EV.x + rad * Math.cos(a), EV.y + rad * Math.sin(a));
        c2.rotate((dl.k % 2 ? 0.045 : -0.06) * (1 - dl.m));
        c2.fillStyle = col[0];
        c2.strokeStyle = INK;
        c2.lineWidth = 1.5;
        c2.beginPath();
        rr(c2, -sz / 2, -sz / 2, sz, sz, sz * 0.22);
        c2.fill();
        c2.stroke();
        if (dl.m > 0.02) {
          c2.strokeStyle = "rgba(255,255,255," + dl.m.toFixed(3) + ")";
          c2.lineWidth = 2;
          c2.beginPath();
          rr(c2, -sz / 2 - 3, -sz / 2 - 3, sz + 6, sz + 6, sz * 0.22 + 3);
          c2.stroke();
        }
        c2.fillStyle = col[1];
        c2.globalAlpha = eb;
        if (dl.e.mon && sz > 26) {
          c2.font = "600 " + (sz * 0.19).toFixed(1) + "px " + MONO;
          c2.fillText(dl.e.mon.toUpperCase(), 0, -sz * 0.2);
          c2.font = "800 " + (sz * 0.4).toFixed(1) + "px " + DISPLAY;
          c2.fillText(dl.e.tile, 0, sz * 0.13);
        } else {
          c2.font = "800 " + (sz * 0.42).toFixed(1) + "px " + DISPLAY;
          c2.fillText(dl.e.tile, 0, sz * 0.03);
        }
        c2.restore();
      });
    }

    if (moving) busy = now + 300;
    if (!reduce && visible && !still) L.next();
    else if (moving) L.next();
  }
  const buzz = () => {
    try {
      navigator.vibrate?.(6);
    } catch {}
  };
  /* touch: put the label on a mark. A second tap on the mark that already has the label opens it, the same as tapping the label. */
  function choose(m: Mark | null, tap: boolean) {
    const s = m && m.t === "spk" ? SPK[m.i] : null,
      other = m && m.t !== "spk" ? m : null;
    if (s) {
      if (tap && s === pinned && s === shown) activate(m!);
      else {
        if (s !== pinned) {
          pinned = s;
          want(s, true);
          buzz();
        }
        if (tagM) setTag(null, false);
      }
    } else if (other) {
      if (tap && tagPin && same(other, tagM)) activate(other);
      else if (!same(other, tagM) || !tagPin) {
        setTag(other, true);
        if (other.t === "evt") buzz();
      }
    } else if (tap && tagM) setTag(null, false);
  }
  /* kind: 0 move, 1 down, 2 up */
  function point(e: PointerEvent, kind: number) {
    const r = cv!.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.on = true;
    ptr.touch = e.pointerType !== "mouse";
    touched = true;
    if (touring) endTour();
    if (ptr.touch) {
      // Touch: a finger that lands to scroll the page must not pick anything, so nothing is chosen on the way down.
      // A sideways drag scrubs through the marks, and a clean tap picks the nearest one; the choice sticks after lifting.
      if (kind === 1) {
        tsx = ptr.x;
        tsy = ptr.y;
        scrub = false;
      } else if (kind === 0) {
        if (!scrub && Math.abs(ptr.x - tsx) > 8 && Math.abs(ptr.x - tsx) > Math.abs(ptr.y - tsy)) scrub = true;
        if (scrub) choose(pick(), false);
      } else if (!scrub && Math.abs(ptr.x - tsx) + Math.abs(ptr.y - tsy) < 12) {
        if (popM) closePop(false);
        else choose(pick(), true);
      }
      L.kick();
      return;
    }
    if (kind === 2) return;
    const m = pick(),
      s = m && m.t === "spk" ? SPK[m.i] : null,
      other = m && m.t !== "spk" ? m : null;
    cv!.style.cursor = m ? "pointer" : "";
    if (kind === 1 && s) {
      pinned = s;
      want(s, true);
    } else want(s, false);
    if (other ? !same(other, tagM) || tagPin : !!tagM) setTag(other, false);
    L.kick();
  }
  function leave() {
    ptr.on = false;
    cv!.style.cursor = "";
    want(null);
    if (!tagPin) setTag(null, false);
    L.kick();
  }
  layout();
  apply();
  measure();
  frame(0);
  env.onResize(gal, () => {
    layout();
    L.kick();
  });
  env.watch(cv, (v) => {
    visible = v;
    if (v) {
      loadRows();
      L.kick();
    }
  });
  if (reduce || !("IntersectionObserver" in window)) {
    started = true;
    bloom = 1;
  } else
    env.observe(cv, { threshold: 0.2 }, (en) => {
      if (!started && en[en.length - 1].isIntersecting) {
        started = true;
        tb = performance.now();
        L.kick();
      }
    });
  env.on(cv, "pointermove", (e) => point(e, 0));
  env.on(cv, "pointerdown", (e) => point(e, 1));
  env.on(cv, "pointerup", (e) => point(e, 2));
  env.on(cv, "pointerleave", leave);
  env.on(cv, "pointercancel", leave);
  // a page restored from the back/forward cache gets no pointerleave, so the hover ends when the page is left
  window.addEventListener("pagehide", leave, { signal: env.signal });
  env.on(cv, "click", (e) => {
    // a mouse click opens the mark under it; touch goes through choose(), so a scroll or a scrub never navigates
    if (ptr.touch) return;
    const m = pick();
    if (m) activate(m, e.metaKey || e.ctrlKey);
    else if (popM) closePop(false);
  });
  env.on(gal, "focusin", () => (touched = true));
  if (lens)
    env.on(lens, "click", (e) => {
      if (!shown) return;
      if (shown.y > 1) {
        e.preventDefault();
        activate({ t: "spk", i: SPK.indexOf(shown) });
      }
    });
  if (tag)
    env.on(tag, "click", (e) => {
      if (!tagM) return;
      if (tagM.t === "evt") {
        e.preventDefault();
        openPop(tagM);
      }
    });
  if (pop) {
    if (popX) env.on(popX, "click", () => closePop(true));
    if (scrim)
      env.on(scrim, "click", () => {
        // a tap that opens the sheet is followed by its own click, which lands on the scrim that has just appeared
        if (performance.now() - popT > 400) closePop(false);
      });
    env.on(pop, "click", (e) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a || !popM) return;
      if ((a.getAttribute("href") || "").startsWith("#")) closePop(false);
      else
        try {
          // coming Back from that page reopens this card (see the end of init)
          sessionStorage.setItem(POP_KEY, markKey(popM));
        } catch {}
    });
    env.on(pop, "keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = Array.from(pop.querySelectorAll<HTMLElement>("a[href], button"));
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
  env.on(document, "keydown", (e) => {
    if (e.key !== "Escape") return;
    if (popM) closePop(true);
    else if (tagPin) setTag(null, false);
  });
  env.on(document, "pointerdown", (e) => {
    const t = e.target as Node | null;
    if (!t || t === cv || t === scrim) return;
    if (popM && pop && !pop.contains(t) && !(lens && lens.contains(t)) && !(tag && tag.contains(t))) closePop(false);
    if (tagPin && tag && !tag.contains(t)) setTag(null, false);
  });
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(() => {
      // the dial's year labels are canvas text: redraw once the display face has arrived
      drawn = 0;
      L.kick();
    });
  try {
    // Back from a page reached through the card: open the same card again. The note is dropped when
    // the card is closed, or when the page is reached any other way.
    const key = sessionStorage.getItem(POP_KEY),
      nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (key) {
      // the entry describes the document, so a client-side visit inside a document that was itself reached by Back does not count
      if (!nav || nav.type !== "back_forward" || new URL(nav.name).pathname !== window.location.pathname) sessionStorage.removeItem(POP_KEY);
      else {
        const slug = key.slice(4),
          i = key.startsWith("spk:") ? SPK.findIndex((s) => s.slug === slug) : EVENTS.findIndex((e) => e.slug === slug);
        if (i >= 0) {
          if (key.startsWith("spk:")) {
            pinned = SPK[i];
            want(pinned, true);
          }
          openPop({ t: key.startsWith("spk:") ? "spk" : "evt", i }, true);
        }
      }
    }
  } catch {}
  env.later(tourStep, 3200);
  return () => {
    clearTimeout(tm);
    clearTimeout(popTm);
    L.cancel();
    SPK.forEach((s) => (s.row = null));
    DIAL.forEach((d) => (d.m = 0));
    if (popBody) popBody.textContent = "";
    if (sesN && sesWhat && sesRest) {
      sesN.textContent = sesRest[0];
      sesWhat.textContent = sesRest[1];
      if (sesN.parentElement) sesN.parentElement.classList.remove("is-live");
    }
    if (SPK[0]) yearLinks(SPK[0]);
  };
}

/* ---------- events: a photo made of tiles, driven by a wall of year tiles ---------- */
function initEvents(env: Env): Dispose {
  const { GOV, rr, reduce, LOGO, tok } = env;
  const E = EVENTS;
  const cv = env.q<HTMLCanvasElement>("ev-cv"),
    wall = env.q("yrs");
  if (!cv || !cv.getContext || !wall) return () => {};
  const ctx = cv.getContext("2d");
  const info = env.q("ev-info"),
    stamp = env.q("ev-stamp"),
    INK = tok("--rd-ink", COLORS.ink),
    YEL = tok("--rd-y", COLORS.y);
  const el = {
    venue: env.q("ev-venue"),
    date: env.q("ev-date"),
    title: env.q("ev-title"),
    se: env.q("ev-se"),
    sp: env.q("ev-sp"),
    facts: env.q("ev-facts"),
    note: env.q("ev-note"),
    l1: env.q<HTMLAnchorElement>("ev-l1"),
    l2: env.q<HTMLAnchorElement>("ev-l2"),
    sw: env.q("ev-sw"),
  };
  if (!ctx || !info || !stamp || Object.values(el).some((x) => !x)) return () => {};
  [info, stamp, el.facts, el.l1, el.l2, el.sw].forEach((x) => env.keep(x));

  const btns = Array.from(wall.querySelectorAll<HTMLButtonElement>(".rd-hm-yt[data-i]"));
  btns.forEach((b) => env.keep(b));

  interface Tile {
    c: number;
    r: number;
    s: number;
    l: number;
    k: number;
    img: HTMLCanvasElement | null;
    want: HTMLCanvasElement | null;
    t0: number;
  }
  interface Img {
    im: HTMLImageElement;
    ok: boolean;
    q: (() => void)[];
  }
  let cw = 0,
    ch = 0,
    dpr = 1,
    lvl = -1,
    cols = 0,
    rows = 0,
    cell = 0,
    cd = 0,
    mask: HTMLCanvasElement | null = null,
    back: HTMLCanvasElement | null = null,
    cache: Record<string, HTMLCanvasElement> = {},
    lru: string[] = [],
    tiles: Tile[] = [],
    last = 0;
  const imgs: Record<string, Img> = {};
  const ptr = { on: false, x: 0, y: 0 };
  const ripples: { x: number; y: number; t: number }[] = [];
  let pinned: HomeEvent = E[0],
    wanted: HomeEvent | null = null,
    shown: HomeEvent | null = null,
    tm = 0,
    seq = 0,
    dir = 1,
    started = false,
    tb = 0,
    bloom = reduce ? 1 : 0;

  function hash(c: number, r: number) {
    let h = Math.imul(((c + 1) * 73856093) ^ ((r + 1) * 19349663), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h & 3;
  }
  function load(e: HomeEvent, cb: () => void) {
    let rec = imgs[e.slug];
    if (rec) {
      if (rec.ok) cb();
      else rec.q.push(cb);
      return;
    }
    const im = new Image();
    rec = imgs[e.slug] = { im, ok: false, q: [cb] };
    im.onload = () => {
      if (env.signal.aborted) return;
      rec.ok = true;
      const q = rec.q;
      rec.q = [];
      q.forEach((f) => f());
    };
    im.src = withBasePath("/home/e/" + e.img + ".jpg");
  }
  /* each photo is cut once into rounded tiles; after that a tile is just a small copy from that sheet */
  function atlas(e: HomeEvent) {
    let a: HTMLCanvasElement | undefined = cache[e.slug];
    const rec = imgs[e.slug];
    if (a) return a;
    if (!rec || !rec.ok || !mask) return null;
    const im = rec.im;
    a = mk(mask.width, mask.height);
    const x = a.getContext("2d");
    if (!x) return null;
    const s = Math.max(a.width / im.naturalWidth, a.height / im.naturalHeight),
      w = im.naturalWidth * s,
      h = im.naturalHeight * s;
    x.drawImage(im, (a.width - w) / 2, (a.height - h) / 2, w, h);
    x.globalCompositeOperation = "destination-in";
    x.drawImage(mask, 0, 0);
    cache[e.slug] = a;
    lru.push(e.slug);
    while (lru.length > 7) {
      const old = lru.shift()!;
      if (shown && old === shown.slug) {
        lru.push(old);
        break;
      }
      delete cache[old];
    }
    return a;
  }
  function layout() {
    const w = cv!.clientWidth;
    if (!w || (w === cw && lvl === GOV.level)) return;
    cw = w;
    lvl = GOV.level;
    dpr = Math.min(window.devicePixelRatio || 1, lvl ? 1 : 2);
    cols = Math.max(15, Math.min(30, 3 * Math.round(cw / 60)));
    rows = (cols * 2) / 3;
    cell = cw / cols;
    ch = rows * cell;
    cd = cell * dpr;
    cv!.width = Math.round(cw * dpr);
    cv!.height = Math.round(ch * dpr);
    mask = mk(cv!.width, cv!.height);
    let x = mask.getContext("2d")!;
    const gap = Math.max(1, cell * 0.065) * dpr;
    x.fillStyle = "#000";
    x.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rr(x, c * cd + gap / 2, r * cd + gap / 2, cd - gap, cd - gap, cd * 0.2);
    x.fill();
    back = mk(cv!.width, cv!.height);
    x = back.getContext("2d")!;
    const inset = cd * 0.2;
    x.fillStyle = INK;
    x.fillRect(0, 0, back.width, back.height);
    for (let k = 0; k < 4; k++) {
      x.fillStyle = k === 3 ? YEL : LOGO[k];
      x.beginPath();
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) if (hash(c, r) === k) rr(x, c * cd + inset, r * cd + inset, cd - 2 * inset, cd - 2 * inset, cd * 0.14);
      x.fill();
    }
    cache = {};
    lru = [];
    const a = shown ? atlas(shown) : null;
    tiles = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tiles.push({ c, r, s: a ? 1 : 0, l: 0, k: 0, img: a, want: a, t0: 0 });
  }
  function aim(e: HomeEvent) {
    load(e, () => {
      if (shown !== e) return;
      const a = atlas(e);
      if (!a) return;
      const now = performance.now(),
        span = cols + rows * 0.6;
      tiles.forEach((t) => {
        if (t.want === a) return;
        t.want = a;
        t.t0 = now + (((dir > 0 ? t.c : cols - 1 - t.c) + t.r * 0.6) / span) * 520;
      });
      L.kick();
    });
  }
  function fill(e: HomeEvent) {
    stamp!.className = "rd-hm-ev-stamp rd-hm-v-" + e.v;
    stamp!.textContent = e.stamp;
    el.sw!.className = "rd-hm-sw rd-hm-v-" + e.v;
    el.venue!.textContent = VENUES[e.v].name;
    el.date!.textContent = e.date;
    el.title!.textContent = e.title;
    el.note!.textContent = e.note;
    el.facts!.hidden = e.se == null;
    if (e.se != null) {
      el.se!.textContent = String(e.se);
      el.sp!.textContent = String(e.sp);
    }
    const links = eventLinks(e);
    el.l1!.textContent = links.l1Text;
    el.l1!.href = withBasePath(links.l1);
    el.l2!.hidden = !links.l2;
    if (links.l2) el.l2!.href = withBasePath(links.l2);
  }
  function want(e: HomeEvent | null, now: boolean) {
    wanted = e;
    clearTimeout(tm);
    if (now) apply();
    else tm = window.setTimeout(apply, 70);
  }
  function apply() {
    if (env.signal.aborted) return;
    const e = wanted || pinned;
    if (!e || e === shown) return;
    const prev = shown,
      my = ++seq;
    shown = e;
    dir = prev && E.indexOf(e) < E.indexOf(prev) ? -1 : 1;
    btns.forEach((b) => {
      const on = E[+(b.getAttribute("data-i") || 0)] === e;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (!prev) fill(e);
    else {
      info!.classList.add("is-out");
      env.later(() => {
        if (my !== seq) return;
        fill(e);
        info!.classList.remove("is-out");
      }, 120);
    }
    aim(e);
  }
  const L = loop(env, frame);
  function frame(now: number) {
    L.clear();
    if (now) GOV.tick(now);
    if (lvl !== GOV.level) layout();
    const dt = Math.min(50, last && now ? now - last : 16),
      first = tiles.length ? tiles[0].img : null;
    let anim = false,
      uniform = true;
    const R = Math.max(56, cw * 0.17),
      span = cols + rows;
    last = now;
    if (started && bloom < 1) {
      bloom = Math.min(1, (now - tb) / 1500);
      anim = true;
    }
    for (let k = ripples.length - 1; k >= 0; k--) if (now - ripples[k].t > 1300) ripples.splice(k, 1);
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i],
        cx = (t.c + 0.5) * cell,
        cy = (t.r + 0.5) * cell;
      if (t.img !== t.want) {
        anim = true;
        if (now >= t.t0) {
          t.s -= dt / 170;
          if (t.s <= 0) {
            t.s = 0;
            t.img = t.want;
          }
        }
      } else if (t.s < 1) {
        t.s = Math.min(1, t.s + dt / 240);
        anim = true;
      }
      let lt = 0,
        dx: number,
        dy: number,
        d: number;
      if (ptr.on) {
        dx = cx - ptr.x;
        dy = cy - ptr.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < R) {
          lt = 1 - d / R;
          lt *= lt;
        }
      }
      for (let k = 0; k < ripples.length; k++) {
        const rp = ripples[k],
          age = now - rp.t;
        dx = cx - rp.x;
        dy = cy - rp.y;
        d = Math.sqrt(dx * dx + dy * dy);
        lt = Math.max(lt, Math.exp(-Math.pow((d - age * 0.42) / 34, 2)) * (1 - age / 1300) * 0.9);
      }
      if (t.l !== lt) {
        t.l += (lt - t.l) * 0.2;
        if (Math.abs(lt - t.l) < 0.004) t.l = lt;
        else anim = true;
      }
      const g = bloom < 1 ? 0.55 + 0.45 * ease(bloom * 1.6 - ((t.c + t.r) / span) * 0.6) : 1;
      t.k = ease(t.s) * (1 - 0.8 * t.l) * g;
      if (t.k < 0.999 || t.img !== first) uniform = false;
    }
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    if (back) ctx!.drawImage(back, 0, 0);
    if (uniform && first) ctx!.drawImage(first, 0, 0);
    else
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (t.img && t.k > 0.02) {
          const sz = cd * t.k,
            x0 = t.c * cd,
            y0 = t.r * cd;
          ctx!.drawImage(t.img, x0, y0, cd, cd, x0 + (cd - sz) / 2, y0 + (cd - sz) / 2, sz, sz);
        }
      }
    if (anim || ptr.on || ripples.length) L.next();
    else last = 0;
  }

  btns.forEach((b) => {
    const e = E[+(b.getAttribute("data-i") || 0)];
    env.on(b, "pointerenter", (ev) => {
      if (ev.pointerType === "mouse") want(e, false);
    });
    env.on(b, "pointerleave", (ev) => {
      if (ev.pointerType === "mouse") want(null, false);
    });
    env.on(b, "focus", () => want(e, true));
    env.on(b, "blur", () => want(null, false));
    env.on(b, "click", () => {
      pinned = e;
      want(e, true);
    });
  });
  env.hooks.pickEvent = (slug) => {
    const m = E.find((x) => x.slug === slug);
    if (m) {
      pinned = m;
      want(m, true);
    }
  };
  layout();
  apply();
  frame(0);
  env.onResize(cv, () => {
    layout();
    if (shown) aim(shown);
    L.kick();
  });
  if (reduce || !("IntersectionObserver" in window)) {
    started = true;
    bloom = 1;
  } else
    env.observe(cv, { threshold: 0.25 }, (en) => {
      if (!started && en[en.length - 1].isIntersecting) {
        started = true;
        tb = performance.now();
        L.kick();
      }
    });
  if (!reduce) {
    env.on(cv, "pointermove", (e) => {
      ptr.x = e.offsetX;
      ptr.y = e.offsetY;
      ptr.on = true;
      L.kick();
    });
    env.on(cv, "pointerleave", () => {
      ptr.on = false;
      L.kick();
    });
    env.on(cv, "pointercancel", () => {
      ptr.on = false;
      L.kick();
    });
    env.on(cv, "pointerdown", (e) => {
      ripples.push({ x: e.offsetX, y: e.offsetY, t: performance.now() });
      if (ripples.length > 4) ripples.shift();
      L.kick();
    });
  }
  env.later(() => E.forEach((e) => load(e, () => {})), 1500);
  return () => {
    clearTimeout(tm);
    L.cancel();
    Object.values(imgs).forEach((r) => {
      r.im.onload = null;
      r.q = [];
    });
  };
}

/* ---------- tracks: every track from 2009 to 2019, with themes you can follow through the years ---------- */
function initTracks(env: Env): Dispose {
  const box = env.q("years"),
    bar = env.q("themes"),
    say = env.q("theme-say");
  if (!box || !bar || !say) return () => {};
  const chips = Array.from(box.querySelectorAll<HTMLLIElement>("li[data-t]"));
  const btns = Array.from(bar.querySelectorAll<HTMLButtonElement>("button[data-t]"));
  [box, say, ...chips, ...btns].forEach((x) => env.keep(x));
  let pinned: ThemeKey | null = null,
    wanted: ThemeKey | null = null,
    shown: ThemeKey | null = null,
    tm = 0,
    seq = 0;
  function want(t: ThemeKey | null, now: boolean) {
    wanted = t;
    clearTimeout(tm);
    if (now) apply();
    else tm = window.setTimeout(apply, 70);
  }
  function apply() {
    if (env.signal.aborted) return;
    const t = wanted || pinned;
    if (t === shown) return;
    const my = ++seq;
    shown = t;
    box!.classList.toggle("is-theme", !!t);
    chips.forEach((li) => li.classList.toggle("is-hit", !!t && li.getAttribute("data-t") === t));
    btns.forEach((b) => {
      const k = b.getAttribute("data-t");
      b.classList.toggle("is-on", k === t);
      b.setAttribute("aria-pressed", String(k === pinned));
    });
    say!.classList.add("is-out");
    env.later(() => {
      if (my !== seq) return;
      say!.textContent = themeSay(t);
      say!.classList.remove("is-out");
    }, 130);
  }
  btns.forEach((b) => {
    const k = b.getAttribute("data-t") as ThemeKey;
    env.on(b, "pointerenter", (e) => {
      if (e.pointerType === "mouse") want(k, false);
    });
    env.on(b, "pointerleave", (e) => {
      if (e.pointerType === "mouse") want(null, false);
    });
    env.on(b, "focus", () => want(k, true));
    env.on(b, "blur", () => want(null, false));
    env.on(b, "click", () => {
      pinned = pinned === k ? null : k;
      wanted = null;
      apply();
    });
  });
  chips.forEach((li) => {
    const k = li.getAttribute("data-t") as ThemeKey;
    if (k === "other") return;
    env.on(li, "pointerenter", (e) => {
      if (e.pointerType === "mouse") want(k, false);
    });
    env.on(li, "pointerleave", (e) => {
      if (e.pointerType === "mouse") want(null, false);
    });
  });
  return () => {
    clearTimeout(tm);
    if (say.textContent !== THEME_REST) say.textContent = THEME_REST;
  };
}

/* ---------- small ties: links that drive other sections, photo stack ---------- */
function initTies(env: Env): Dispose {
  const { root, reduce } = env;
  env.on(root, "click", (e) => {
    const target = e.target as Element | null;
    const a = target && target.closest ? target.closest("[data-ev],[data-v],[data-spk]") : null;
    if (!a || !root.contains(a)) return;
    if (a.hasAttribute("data-spk")) {
      env.hooks.pickSpeaker?.(+(a.getAttribute("data-spk") || 0));
      return;
    }
    let slug = a.getAttribute("data-ev");
    const v = a.getAttribute("data-v");
    if (!slug && v) slug = EVENTS.find((x) => x.v === v)?.slug ?? null;
    if (slug) env.hooks.pickEvent?.(slug);
  });
  const stack = env.q("stack"),
    cap = env.q("stack-cap");
  if (stack) {
    const ph = Array.from(stack.querySelectorAll("img"));
    let busy = false;
    ph.forEach((im) => env.keep(im));
    env.keep(cap);
    const place = () => {
      ph.forEach((im, i) => im.setAttribute("data-p", String(i)));
      if (cap && ph[0]) cap.textContent = ph[0].getAttribute("data-cap") || "";
    };
    place();
    env.on(stack, "click", () => {
      if (busy || !ph.length) return;
      busy = true;
      const top = ph[0];
      top.classList.add("is-away");
      if (cap) cap.classList.add("is-out");
      env.later(
        () => {
          ph.push(ph.shift()!);
          top.classList.remove("is-away");
          place();
          if (cap) cap.classList.remove("is-out");
          env.later(() => (busy = false), 300);
        },
        reduce ? 0 : 430,
      );
    });
    return () => {
      // put the original first photo's caption back (the attributes are restored by keep)
      const first = stack.querySelector("img");
      if (cap && first) cap.textContent = first.getAttribute("data-cap") || "";
    };
  }
  return () => {};
}

/* ---------- sponsors: a pile of stickers that leans toward the cursor, with a frame of tiles that follows it ---------- */
function initPile(env: Env): Dispose {
  const { GOV, rr, reduce, LOGO, tok } = env;
  const pile = env.q("pile");
  if (!pile || reduce || !window.requestAnimationFrame) return () => {};
  const cv = pile.querySelector("canvas"),
    ctx = cv && cv.getContext ? cv.getContext("2d") : null,
    tag = pile.querySelector<HTMLElement>(".rd-hm-sp-tag");
  if (!cv || !ctx || !tag) return () => {};
  const tagName = tag.querySelector("b"),
    tagMeta = tag.querySelector("span"),
    INK = tok("--rd-ink", COLORS.ink),
    FC = [LOGO[0], LOGO[1], LOGO[2], tok("--rd-paper", COLORS.paper)];
  if (!tagName || !tagMeta) return () => {};
  interface T {
    el: HTMLElement;
    rot: number;
    ty: number;
    v: number;
    h: number;
    f: number;
    x: number;
    y: number;
    w: number;
    hh: number;
    d: SponsorRow;
  }
  const logos = Array.from(pile.querySelectorAll<HTMLElement>(".rd-hm-logo"));
  const T: T[] = logos.map((el, i) => {
    const n = i + 1,
      m = n % 4;
    let rot = m === 1 ? -4 : m === 2 ? 3 : m === 3 ? -1.5 : 5,
      ty = m === 2 ? 8 : m === 3 ? -6 : 0;
    if (n % 7 === 0) {
      rot = -7;
      ty = 9;
    }
    env.keep(el);
    return { el, rot, ty, v: 0, h: 0, f: 0, x: 0, y: 0, w: 0, hh: 0, d: SPONSORS[i] };
  });
  env.keep(pile);
  env.keep(tag);
  const PAD = 44,
    N = 180,
    R = 150;
  let W = 0,
    H = 0,
    dpr = 1,
    lvl = -1,
    hot: T | null = null,
    A = 0;
  const ptr = { on: false, x: 0, y: 0 },
    tp = { x: 0, y: 0, set: false };
  const P: { u: number; row: number; c: number; x: number; y: number; vx: number; vy: number; hx: number; hy: number }[] = [];
  for (let i = 0; i < N; i++) P.push({ u: (i >> 1) / (N / 2), row: i & 1, c: (i >> 1) % 4, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0 });

  function measure() {
    W = pile!.clientWidth;
    H = pile!.clientHeight;
    T.forEach((t) => {
      t.w = t.el.offsetWidth;
      t.hh = t.el.offsetHeight;
      t.x = t.el.offsetLeft + t.w / 2;
      t.y = t.el.offsetTop + t.hh / 2;
    });
    dpr = Math.min(window.devicePixelRatio || 1, GOV.level ? 1 : 2);
    lvl = GOV.level;
    cv!.width = Math.round((W + PAD * 2) * dpr);
    cv!.height = Math.round((H + PAD * 2) * dpr);
  }
  /* a point u (0 to 1) of the way round a rounded rectangle centred on 0,0 */
  function perim(u: number, w: number, h: number, r: number): [number, number] {
    const a = w - 2 * r,
      b = h - 2 * r,
      q = (Math.PI * r) / 2;
    let s = u * (2 * a + 2 * b + 4 * q),
      g: number;
    if (s < a) return [-a / 2 + s, -h / 2];
    s -= a;
    if (s < q) {
      g = s / r - Math.PI / 2;
      return [a / 2 + r * Math.cos(g), -b / 2 + r * Math.sin(g)];
    }
    s -= q;
    if (s < b) return [w / 2, -b / 2 + s];
    s -= b;
    if (s < q) {
      g = s / r;
      return [a / 2 + r * Math.cos(g), b / 2 + r * Math.sin(g)];
    }
    s -= q;
    if (s < a) return [a / 2 - s, h / 2];
    s -= a;
    if (s < q) {
      g = s / r + Math.PI / 2;
      return [-a / 2 + r * Math.cos(g), b / 2 + r * Math.sin(g)];
    }
    s -= q;
    if (s < b) return [-w / 2, b / 2 - s];
    s -= b;
    g = s / r + Math.PI;
    return [-a / 2 + r * Math.cos(g), -b / 2 + r * Math.sin(g)];
  }
  function setHot(n: T | null) {
    const prev = hot;
    hot = n;
    if (n) {
      if (A < 0.05)
        P.forEach((p) => {
          const g = Math.random() * 6.2832,
            q = Math.max(n.w, n.hh) * (0.9 + Math.random() * 0.5);
          p.x = n.x + PAD + Math.cos(g) * q;
          p.y = n.y + PAD + Math.sin(g) * q;
          p.vx = p.vy = 0;
        });
      if (n.d) {
        tagName!.textContent = n.d[1];
        tagMeta!.textContent = n.d[4] > 1 ? n.d[4] + " years · " + n.d[3] : n.d[3];
      }
      tag!.classList.add("is-on");
    } else {
      if (prev)
        P.forEach((p) => {
          const dx = p.x - (prev.x + PAD),
            dy = p.y - (prev.y + PAD);
          p.hx = p.x + dx * (0.35 + Math.random() * 0.5);
          p.hy = p.y + dy * (0.35 + Math.random() * 0.5);
        });
      tag!.classList.remove("is-on");
    }
  }
  const L = loop(env, frame);
  function frame(now: number) {
    L.clear();
    if (now) GOV.tick(now);
    if (lvl !== GOV.level) measure();
    let busy = false,
      near: T | null = null,
      best = 1e9,
      t: T,
      k: number,
      dx: number,
      dy: number,
      d: number,
      cd: number,
      f: number,
      tv: number,
      th: number,
      px: number,
      py: number,
      rx: number,
      ry: number,
      ex: number,
      ey: number,
      ed: number,
      tx: number,
      ty: number,
      c: number,
      lift: number;
    for (k = 0; k < T.length; k++) {
      t = T[k];
      f = 0;
      if (ptr.on) {
        dx = Math.max(Math.abs(ptr.x - t.x) - t.w / 2, 0);
        dy = Math.max(Math.abs(ptr.y - t.y) - t.hh / 2, 0);
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < R) {
          f = 1 - d / R;
          f *= f;
        }
        if (d < 2) {
          cd = Math.abs(ptr.x - t.x) / t.w + Math.abs(ptr.y - t.y) / t.hh;
          if (t === hot) cd -= 0.25;
          if (cd < best) {
            best = cd;
            near = t;
          }
        }
      }
      t.f = f;
    }
    if (near !== hot) setHot(near);
    for (k = 0; k < T.length; k++) {
      t = T[k];
      tv = t === hot ? 1 : t.f;
      th = t === hot ? 1 : 0;
      if (t.v !== tv) {
        t.v += (tv - t.v) * 0.15;
        if (Math.abs(tv - t.v) < 0.002) t.v = tv;
        else busy = true;
      }
      if (t.h !== th) {
        t.h += (th - t.h) * 0.15;
        if (Math.abs(th - t.h) < 0.002) t.h = th;
        else busy = true;
      }
      px = py = rx = ry = 0;
      if (hot && t !== hot) {
        ex = t.x - hot.x;
        ey = t.y - hot.y;
        ed = Math.sqrt(ex * ex + ey * ey) || 1;
        lift = t.f * 18 * hot.h;
        px = (ex / ed) * lift;
        py = (ey / ed) * lift;
      }
      if (t.h > 0.01 && ptr.on) {
        rx = Math.max(-1, Math.min(1, (ptr.y - t.y) / (t.hh / 2))) * -8 * t.h;
        ry = Math.max(-1, Math.min(1, (ptr.x - t.x) / (t.w / 2))) * 8 * t.h;
      }
      c = Math.max(t.v * 0.85, t.h);
      t.el.style.transform =
        "translate(" +
        (px - 3 * t.h).toFixed(2) +
        "px," +
        (py + t.ty * (1 - t.v) - 3 * t.h).toFixed(2) +
        "px) perspective(700px) rotateX(" +
        rx.toFixed(2) +
        "deg) rotateY(" +
        ry.toFixed(2) +
        "deg) rotate(" +
        (t.rot * (1 - c)).toFixed(2) +
        "deg) scale(" +
        (1 + 0.05 * t.v + 0.16 * t.h).toFixed(3) +
        ")";
      t.el.style.boxShadow = (4 + 7 * t.h).toFixed(1) + "px " + (4 + 7 * t.h).toFixed(1) + "px 0 " + INK;
      t.el.style.zIndex = String(t === hot ? 200 : Math.round(t.v * 100));
    }

    tv = hot ? 1 : 0;
    if (A !== tv) {
      A += (tv - A) * 0.1;
      if (Math.abs(tv - A) < 0.004) A = tv;
      else busy = true;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W + PAD * 2, H + PAD * 2);
    if (A > 0) {
      let fw = 0,
        fh = 0,
        fr = 0;
      if (hot) {
        fw = hot.w * 1.21 + 30;
        fh = hot.hh * 1.21 + 30;
        fr = 34;
      }
      for (k = 0; k < N; k++) {
        const p = P[k];
        if (hot) {
          const pt = perim((((p.u + (p.row ? -1 : 1) * now * 0.00003) % 1) + 1) % 1, fw + p.row * 18, fh + p.row * 18, fr + p.row * 9);
          tx = hot.x + PAD + 2 + pt[0];
          ty = hot.y + PAD + 2 + pt[1];
        } else {
          tx = p.hx;
          ty = p.hy;
        }
        p.vx += (tx - p.x) * 0.08;
        p.vy += (ty - p.y) * 0.08;
        p.vx *= 0.78;
        p.vy *= 0.78;
        p.x += p.vx;
        p.y += p.vy;
      }
      ctx!.globalAlpha = A;
      const s = 5.5 * (0.5 + 0.5 * A);
      for (c = 0; c < 4; c++) {
        ctx!.fillStyle = FC[c];
        ctx!.beginPath();
        for (k = 0; k < N; k++) {
          const p = P[k];
          if (p.c === c) rr(ctx!, p.x - s / 2, p.y - s / 2, s, s, s * 0.24);
        }
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (hot) busy = true;
    }
    if (hot) {
      tx = hot.x;
      ty = hot.y + hot.hh * 0.6 + 30;
      if (!tp.set) {
        tp.x = tx;
        tp.y = ty;
        tp.set = true;
      } else {
        tp.x += (tx - tp.x) * 0.22;
        tp.y += (ty - tp.y) * 0.22;
      }
      tag!.style.transform = "translate(" + tp.x.toFixed(1) + "px," + tp.y.toFixed(1) + "px) translate(-50%,0)";
    }
    if (busy || ptr.on) L.next();
  }
  function point(e: PointerEvent) {
    const r = pile!.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.on = true;
    L.kick();
  }
  pile.classList.add("is-live");
  measure();
  frame(0);
  env.onResize(pile, () => {
    measure();
    L.kick();
  });
  env.on(pile, "pointermove", point);
  env.on(pile, "pointerdown", point);
  env.on(pile, "pointerleave", (e) => {
    if (e.pointerType === "mouse") {
      ptr.on = false;
      L.kick();
    }
  });
  env.on(document, "pointerdown", (e) => {
    if (ptr.on && !pile.contains(e.target as Node)) {
      ptr.on = false;
      L.kick();
    }
  });
  return () => {
    L.cancel();
    tagName.textContent = "";
    tagMeta.textContent = "";
  };
}
