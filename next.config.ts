import type { NextConfig } from "next";
import path from "node:path";

/**
 * STATIC-SITE-PLAN.md Step 6: this branch builds a static, no-auth site
 * for GitHub Pages, so rewrites()/headers() are gone -- both are
 * unsupported under output: "export" (there's no server left to run them),
 * and GitHub Pages can't set response headers anyway. Kept below only as a
 * record of what the server-rendered site sent; a <meta> CSP
 * tag could approximate part of this, but can't cover
 * frame-ancestors/X-Frame-Options.
 *
 * const contentSecurityPolicy = [
 *   "default-src 'self'",
 *   "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com",
 *   "style-src 'self' 'unsafe-inline'",
 *   "img-src 'self' data: https://i.ytimg.com https://i3.ytimg.com https://siliconvalley-codecamp.com https://www.siliconvalley-codecamp.com https://avatars.githubusercontent.com https://graphql.svcc.mobi",
 *   "frame-src https://www.google.com https://www.youtube.com https://youtube.com",
 *   "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
 *   "font-src 'self' data:",
 *   "object-src 'none'",
 *   "base-uri 'self'",
 *   "form-action 'self'",
 *   "frame-ancestors 'self'",
 * ].join("; ");
 *
 * const securityHeaders = [
 *   { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
 *   { key: "X-Content-Type-Options", value: "nosniff" },
 *   { key: "X-Frame-Options", value: "SAMEORIGIN" },
 *   { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
 *   { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
 *   { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
 * ];
 */

// Set only for the pkellner.github.io/svcc-site/ project-pages test deploy
// (unset for the eventual custom-domain production build, which serves from
// the root). Next.js auto-prefixes next/link and next/image with this; the
// handful of hardcoded <img src="/..."> paths use withBasePath() instead.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // output: "export" produces out/; trailingSlash matches the Step 2
  // export's URLs (sitemap, every link builder) and avoids an extra Pages
  // 301 on every navigation.
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  // Keep production builds within the deployment host's memory limits while
  // Next.js prerenders pages.
  experimental: {
    cpus: 2,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
    quietDeps: true,
    silenceDeprecations: ["import", "global-builtin", "color-functions", "slash-div", "mixed-decls"],
    sourceMap: true,
    outputStyle: "compressed",
  },
  images: {
    // No image optimization server under static export; every image is
    // already a pre-sized WebP/JPG written by the Step 2 export script or
    // checked into public/ as-is.
    unoptimized: true,
  },
};

export default nextConfig;
