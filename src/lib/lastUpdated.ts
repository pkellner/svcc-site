import "server-only";
import { execSync } from "node:child_process";

// When the site was last changed: the date of the commit being built. Using the
// commit date rather than the build clock keeps a local build byte-identical to
// the deployed one for the same commit (npm run test:gh-pages compares them).
// Falls back to the build time when git isn't available.
function commitDate(): Date {
  try {
    const iso = execSync("git log -1 --format=%cI", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  } catch {
    // not a git checkout
  }
  return new Date();
}

export const LAST_UPDATED = commitDate();
export const LAST_UPDATED_ISO = LAST_UPDATED.toISOString();

/** "October 6, 2026, 4:25 PM PT": Code Camp's home time zone. */
export const LAST_UPDATED_TEXT =
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(LAST_UPDATED) + " PT";
