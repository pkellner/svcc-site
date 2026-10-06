// Next.js prefixes next/link (and the _next/ assets) with basePath, but not
// next/image src, redirect()/permanentRedirect() targets, raw <a>/<img>, or
// URLs inside database HTML -- those all go through these helpers.
// NEXT_PUBLIC_* is replaced at build time, so this resolves statically
// per-deploy (see next.config.ts); with no basePath every helper is a no-op.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** For URLs that come from data: only site-relative ones ("/x", not "//x" or "https://x") get the prefix. */
export function withBasePathIfSiteRelative<T extends string | null | undefined>(url: T): T {
  if (!BASE_PATH || !url || !url.startsWith("/") || url.startsWith("//")) return url;
  return `${BASE_PATH}${url}` as T;
}

/** Prefixes every site-relative href/src inside an HTML string. */
export function prefixSiteRelativeUrls(html: string): string {
  if (!BASE_PATH) return html;
  return html.replace(/(\s(?:href|src)\s*=\s*["'])\/(?!\/)/gi, `$1${BASE_PATH}/`);
}
