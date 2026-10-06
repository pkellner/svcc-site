#!/bin/sh
# STATIC-SITE-PLAN.md Step 6: remove files from out/ that must never be
# published, after `next build` has copied public/ into it.
#
# NOT the plan's full allowlist (that needs a one-time human review of all
# ~726 files in public/ -- not done this session, see
# STATIC-SITE-HANDOFF.md). This is the known-bad denylist: every file
# already identified by name during this conversion, plus every sponsor/
# signup document the owner decided not to publish.
set -e

OUT_DIR="${1:-out}"

if [ ! -d "$OUT_DIR" ]; then
  echo "prune-out.sh: $OUT_DIR does not exist -- run next build first" >&2
  exit 1
fi

remove() {
  if [ -e "$1" ]; then
    echo "  removing: $1"
    rm -f "$1"
  fi
}

echo "Pruning known-sensitive files from $OUT_DIR ..."

# Tax forms and signed agreements (emails/phone numbers inside).
find "$OUT_DIR/miscpages" -maxdepth 1 -iname "*agreement*" -print -delete 2>/dev/null || true
find "$OUT_DIR/miscpages" -maxdepth 1 \( -iname "*w-9*" -o -iname "*w9*" \) -print -delete 2>/dev/null || true
remove "$OUT_DIR/miscpages/State efile sheet (1).pdf"

# Data dumps (emails, phone numbers, bios).
remove "$OUT_DIR/miscpages/speakers.json"
remove "$OUT_DIR/miscpages/db.json"
remove "$OUT_DIR/miscpages/apod.json"

# Sponsor/signup/sales material for past events -- none of it is published
# (decided this session, see STATIC-SITE-PLAN.md's open decisions). Found by
# a manual pass over public/ (pdftotext on every PDF, checked for emails/
# phone numbers) rather than assumed safe by extension.
find "$OUT_DIR/miscpages" -maxdepth 1 -iname "*sponsorship*" -print -delete 2>/dev/null || true
find "$OUT_DIR/miscpages" -maxdepth 1 -iname "*brochure*" -print -delete 2>/dev/null || true
find "$OUT_DIR/miscpages" -maxdepth 1 -iname "*prospectus*" -print -delete 2>/dev/null || true
find "$OUT_DIR/miscpages" -maxdepth 1 -iname "AdvertiseJobOpenings*" -print -delete 2>/dev/null || true
remove "$OUT_DIR/miscpages/SamsungDeveloperConferencePromoCodeDetails.pdf"
remove "$OUT_DIR/miscpages/SiliconValleyCodeCampCard.vcf"
remove "$OUT_DIR/ads.txt"

# Scripts, source image formats nothing can render, and a dead page.
remove "$OUT_DIR/getSpeakerIdsScript.sh"
find "$OUT_DIR/images" -maxdepth 1 -iname "*.psd" -print -delete 2>/dev/null || true
remove "$OUT_DIR/images/blue.bmp"
remove "$OUT_DIR/images/ignore.bmp"
remove "$OUT_DIR/blocked.html"

# Dead, unreferenced legacy directories -- confirmed nothing in src/
# references either one (STATIC-SITE-PLAN.md's own "unless something links
# to them" conditional). pscourse/ in particular is a liability on its own:
# full-size, uncontrolled speaker photos that bypass the Step 2 image
# pipeline entirely.
rm -rf "$OUT_DIR/pscourse" "$OUT_DIR/react-vis"

SIZE_MB=$(du -sm "$OUT_DIR" | cut -f1)
echo "Done. $OUT_DIR is now ${SIZE_MB}MB."
if [ "$SIZE_MB" -gt 900 ]; then
  echo "ERROR: $OUT_DIR exceeds 900MB (Pages limit is 1GB)." >&2
  exit 1
fi
