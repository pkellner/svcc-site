#!/usr/bin/env node
// Pushes out/ to the gh-pages branch of this repo (pkellner/svcc-site). Two kinds
// of build can be deployed, and the script refuses to mix them up:
//   - `npm run build:gh-pages` (basePath /svcc-site), with PAGES_CNAME unset:
//     the pkellner.github.io/svcc-site/ test site.
//   - `npm run build:static` (no basePath), with PAGES_CNAME set to the custom
//     domain (archive.siliconvalley-codecamp.com for staging, then
//     www.siliconvalley-codecamp.com): writes out/CNAME. GitHub Pages reads the
//     custom domain from that file on a branch-built site, so a deploy without
//     it would drop the domain and take the site offline.
// The git metadata for gh-pages lives in .gh-pages-git/ (not in out/, which
// next build wipes) and is fetched from the remote first, so a redeploy only
// uploads the files that changed instead of all ~475MB.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

// !!! DO NOT DEPLOY WITHOUT PETER'S SAY-SO !!!
// Peter may edit the gh-pages branch directly; a deploy replaces it with out/.
// Set ALLOW_SVCC_SITE_DEPLOY=1 only when he has said to in a prompt.
if (process.env.ALLOW_SVCC_SITE_DEPLOY !== "1") {
  console.error("REFUSING TO DEPLOY: gh-pages may have been edited directly and this would overwrite those changes. Set ALLOW_SVCC_SITE_DEPLOY=1 only with Peter's explicit say-so.");
  process.exit(1);
}

const REPO_URL = "https://github.com/pkellner/svcc-site.git";
const WEB_DIR = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(WEB_DIR, "out");
const GIT_DIR = path.join(WEB_DIR, ".gh-pages-git");

if (!existsSync(path.join(OUT_DIR, "index.html"))) {
  console.error(`${OUT_DIR}/index.html does not exist -- run \`npm run build:gh-pages\` or \`npm run build:static\` first`);
  process.exit(1);
}

const CNAME = process.env.PAGES_CNAME?.trim() ?? "";
const isSubpathBuild = readFileSync(path.join(OUT_DIR, "index.html"), "utf8").includes("/svcc-site/_next/");
if (CNAME && isSubpathBuild) {
  console.error(`PAGES_CNAME=${CNAME} but out/ is a /svcc-site build -- run \`npm run build:static\` first`);
  process.exit(1);
}
if (!CNAME && !isSubpathBuild) {
  console.error("out/ is a root (custom-domain) build but PAGES_CNAME is unset -- set PAGES_CNAME, or run `npm run build:gh-pages` for the test site");
  process.exit(1);
}
if (CNAME) writeFileSync(path.join(OUT_DIR, "CNAME"), `${CNAME}\n`);
else rmSync(path.join(OUT_DIR, "CNAME"), { force: true });

function git(args, { allowFail = false, quiet = false } = {}) {
  if (!quiet) console.log("  $ git", args.join(" "));
  try {
    const output = execFileSync("git", [`--git-dir=${GIT_DIR}`, `--work-tree=${OUT_DIR}`, ...args], {
      stdio: quiet ? "pipe" : "inherit",
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
    // execFileSync returns null when stdout is inherited; null here means failure.
    return output ?? "";
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

// GitHub Pages runs Jekyll by default, which drops _next/ (leading underscore).
writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");

// The README doubles as the README of gh-pages, the repo's default branch.
copyFileSync(path.join(WEB_DIR, "README.md"), path.join(OUT_DIR, "README.md"));

if (!existsSync(GIT_DIR)) {
  git(["init", "-q", "-b", "gh-pages"]);
  git(["remote", "add", "origin", REPO_URL]);
}

console.log(`Deploying ${OUT_DIR} to ${REPO_URL}#gh-pages ...`);
// Blob-less: only commits/trees come down, which is all git needs to tell
// which files are unchanged and skip uploading them.
const fetched = git(["fetch", "--depth=1", "--filter=blob:none", "origin", "gh-pages"], { allowFail: true });
if (fetched !== null) {
  // Point the branch at the remote tip without touching out/, so the commit
  // below is a diff against what's already deployed.
  git(["reset", "-q", "--soft", "FETCH_HEAD"]);
}
git(["add", "-A"]);

const changed = git(["status", "--porcelain"], { quiet: true }).trim();
if (fetched !== null && changed === "") {
  console.log("Nothing changed since the last deploy.");
  process.exit(0);
}
const changedLines = changed.split("\n");
const counts = {};
for (const line of changedLines) counts[line[0]] = (counts[line[0]] ?? 0) + 1;
console.log(`  ${changedLines.length} files changed (${Object.entries(counts).map(([k, n]) => `${k}:${n}`).join(" ")})`);

git(["-c", "user.name=Peter Kellner", "-c", "user.email=peter@peterkellner.net", "commit", "-q", "-m", "Deploy SVCC site"]);
git(["push", "origin", "HEAD:gh-pages"]);

console.log(`Deployed. GitHub Pages rebuilds in a minute or two: ${CNAME ? `https://${CNAME}/` : "https://pkellner.github.io/svcc-site/"}`);
