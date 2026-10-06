import React, { ReactNode } from "react";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { withBasePath } from "@/lib/basePath";
import { HOME_CARD, HOME_CARD_ALT, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/seo";
import GoogleAnalytics from "@/app/common/google-analytics";

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
}

// Site-wide defaults. Every page overrides title, description, canonical URL and card through its own
// generateMetadata (src/lib/seo.ts); these apply only where a page sets nothing, such as the 404 page.
const OG_IMAGE = { url: HOME_CARD, width: 1200, height: 630, alt: HOME_CARD_ALT };

export const metadata = {
  title: SITE_NAME,
  // Relative metadata URLs resolve against SITE_ORIGIN: github.io on the project-pages build, the custom domain otherwise.
  metadataBase: new URL(SITE_ORIGIN),
  description: SITE_DESCRIPTION,
  // Browsers only probe /favicon.ico at the host root, which misses it when
  // the site is served under a basePath.
  icons: { icon: withBasePath("/favicon.ico") },

  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
