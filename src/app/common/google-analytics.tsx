import Script from "next/script";

// Hardcoded on purpose: a static export has no runtime env, and the live
// site's NEXT_PUBLIC_GOOGLE_ID was never set, so it shipped gtag with
// id=undefined. This is the GA4 property from src/lib/gtag.js.
const GA_MEASUREMENT_ID = "G-WW0GQXPPWK";

// GA4 enhanced measurement records client-side navigations (history changes)
// as page views, so no per-route tracking is needed.
export default function GoogleAnalytics() {
  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`,
        }}
      />
    </>
  );
}
