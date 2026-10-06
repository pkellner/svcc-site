import React, { ReactNode } from "react";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { withBasePath } from "@/lib/basePath";
import GoogleAnalytics from "@/app/common/google-analytics";

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
}

// The social card (1200x630). metadataBase is the custom domain, which this archive is not served
// from yet, so on the project-pages build the image is addressed where that site really is.
// The ?v= changes whenever the card is redrawn (npm run og-card), so sites that cached the old one fetch it again.
const OG_PATH = "/images/og-svcc.jpg?v=2";
const OG_IMAGE = {
  url: process.env.NEXT_PUBLIC_BASE_PATH ? "https://pkellner.github.io" + withBasePath(OG_PATH) : OG_PATH,
  width: 1200,
  height: 630,
  alt: "Silicon Valley Code Camp: 37,954 people, 930 speakers, 2,013 sessions and 17 events. Douglas Crockford spoke at 12 of them.",
};

export const metadata = {
  title: "Silicon Valley Code Camp",
  // The CNAME for the static site is "www" (the apex redirects to it today),
  // so metadata URLs should resolve there directly (STATIC-SITE-PLAN.md Step 4).
  metadataBase: new URL("https://www.siliconvalley-codecamp.com"),
  description: "Silicon Valley Code Camp are community events where developers learn from fellow developers. Both virtual and live sessions.",
  // Browsers only probe /favicon.ico at the host root, which misses it when
  // the site is served under a basePath.
  icons: { icon: withBasePath("/favicon.ico") },

  openGraph: {
    title: "Silicon Valley Code Camp are community events where developers learn from fellow developers.",
    description: "Silicon Valley Code Camp are community events where developers learn from fellow developers. Both virtual and live sessions.",
    type: "article",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Silicon Valley Code Camp are community events where developers learn from fellow developers.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below may add .rd-dock-bottom to <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Phones: restore a menu bar docked at the bottom before first paint (see global-nav.tsx, DOCK_KEY).
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("rd-dock")==="bottom")document.documentElement.classList.add("rd-dock-bottom")}catch(e){}`,
          }}
        />
      </head>
      <body>
        {/* clip, not hidden: hidden makes this a scroll container, which stops the sticky mobile header from sticking. */}
        <div style={{ overflowX: "clip" }}>{children}</div>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
