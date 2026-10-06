"use client";

import React from "react";
import Link from "next/link";

// REDESIGN-PLAN.md: the prototype footer. Rendered once by the (public-site) layout and the
// 404 page. A client component with no props, so each page's RSC payload carries only a module
// reference, not this markup (the payload is repeated in ~15.7k files; see the plan's size note).
const BROWSE = [
  { href: "/session/campfire-1003/", label: "Sessions" },
  { href: "/presenter/campfire-1003/", label: "Speakers" },
  { href: "/track/2019/", label: "Tracks" },
  { href: "/sponsor/2019/", label: "Sponsors" },
  { href: "/news/2019/", label: "News" },
  { href: "/about/2019/", label: "About" },
];

const CODESTARSSUMMIT_URL = "https://codestarssummit-static.github.io/codestarssummit-static/";

const ELSEWHERE = [
  { href: CODESTARSSUMMIT_URL, label: "CodeStarsSummit" },
  { href: "https://www.youtube.com/c/SiliconValleyCodeCampVideos", label: "YouTube" },
  { href: "https://x.com/sv_code_camp", label: "X" },
  { href: "https://www.facebook.com/groups/svcodecamp", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer className="rd-foot">
      <div className="rd-wrap">
        <div className="rd-foot-big" aria-hidden="true">
          <span>S</span>
          <span>V</span>
          <span>C</span>
          <span>C</span>
        </div>
        <div className="rd-foot-cols">
          <p className="rd-foot-say">Seventeen events. 930 speakers. One community.</p>
          <div>
            <h3>Browse</h3>
            <ul>
              {BROWSE.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Events</h3>
            <ul>
              <li>
                <Link href="/event/2019/">Code Camp 2019</Link>
              </li>
              <li>
                <Link href="/event/campfire-1003/">Code Campfire 2023</Link>
              </li>
              <li>
                <Link href="/">All 17 events</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Elsewhere</h3>
            <ul>
              {ELSEWHERE.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p>
          Silicon Valley Code Camp, SV Code Campfire,{" "}
          <a href={CODESTARSSUMMIT_URL} target="_blank" rel="noopener">
            CodeStarsSummit
          </a>{" "}
          and AngularU (tm) are trademarks of 73rd Street Associates (Copyright © 2006–{new Date().getUTCFullYear()} all rights reserved). Built by{" "}
          <a href="https://peterkellner.net" target="_blank" rel="noopener">
            PeterKellner.net
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
