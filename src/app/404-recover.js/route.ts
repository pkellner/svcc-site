import { getCodeCampYears } from "@/lib/staticData/codeCampYears/codeCampYears";
import { withBasePath } from "@/lib/basePath";
import { year as yearData } from "@/lib/staticData/load";

// The 404 page's old-link recovery script (STATIC-SITE-PLAN.md Step 4), served as one static file,
// out/404-recover.js. It used to be inlined in not-found.tsx, but Next serializes the not-found
// tree into every page's RSC payload, so its 28 KB speaker-slug map was repeated in ~15.7k files
// (about 440 MB of out/). See REDESIGN-PLAN.md, review round 1. The logic is unchanged.
export const dynamic = "force-static";

export async function GET() {
  const codeCampYears = await getCodeCampYears();
  const validYears = codeCampYears?.map((rec: any) => rec.urlPostToken) ?? [];
  const slugById: Record<string, string> = {};
  for (const token of validYears) {
    for (const presenter of yearData(token)?.uniquePresenters ?? []) slugById[presenter.id] = presenter.slug;
  }
  const body = `
(function () {
  var base = ${JSON.stringify(withBasePath(""))};
  var path = window.location.pathname;
  if (base && path.indexOf(base + "/") === 0) path = path.slice(base.length);
  var requested = path;

  function generateSlug(raw) {
    if (!raw) return "";
    return raw.trim().toLowerCase().replace(/ /g, "-").replace(/[^\\w-]+/g, "").slice(0, 75).trim();
  }

  function go(to) {
    if (to && to !== requested) window.location.replace(base + to);
  }

  // /account/*, /login, /profile, /admin/* -> /
  if (/^\\/(account|login|profile|admin)(\\/|$)/.test(path)) {
    go("/");
    return;
  }

  // The old site matched the year token case-insensitively (/session/Campfire-1003 worked), so a
  // capitalized year in an otherwise lowercase section is normalized and the other rules still run.
  var ym = path.match(/^\\/(session|presenter|track|sponsor|news|about|event)\\/([^/]+)(\\/.*)?$/);
  if (ym && ym[2] !== ym[2].toLowerCase()) path = "/" + ym[1] + "/" + ym[2].toLowerCase() + (ym[3] || "");

  // Old capitalized /Session/... or /Presenter/... (YouTube description links) -> lowercase
  if (/^\\/(Session|Presenter)\\//.test(path)) {
    go(path.toLowerCase());
    return;
  }

  // Old-form speaker URL: /presenter/{year}/{first last, punctuation and all}-{id}
  // Looked up by id first: names in the DB have changed since old links were
  // written (e.g. ".../gaylelaakmann-mcdowell-8367" is now "gayle-mcdowell-8367").
  var slugById = ${JSON.stringify(slugById)};
  var m = path.match(/^\\/presenter\\/([^/]+)\\/(.+)-(\\d+)\\/?$/);
  if (m) {
    var year = m[1], namePart = m[2], id = m[3];
    try { namePart = decodeURIComponent(namePart); } catch (e) {}
    var slug = slugById[id] || generateSlug(namePart) + "-" + id;
    go("/presenter/" + year.toLowerCase() + "/" + slug + "/");
    return;
  }

  go(path);
})();
`;
  return new Response(body, { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
}
