const protocolPrefix = "https://";

export function getUserBioShort(userBioShort: String, userBio: String) {
  if (userBioShort && userBioShort.length > 0) {
    return userBioShort;
  } else {
    return userBio ? userBio.slice(0, 100) : "...";
  }
}

// Twitter is X now: every profile link goes to x.com. Handles may be stored as "name", "@name" or a full
// twitter.com / x.com URL.
export function getTwitterUrl(twitterHandle: string) {
  if (twitterHandle && twitterHandle.trim().length > 1) {
    const handle = twitterHandle
      .trim()
      .replace(/^https?:\/\/(www\.|mobile\.)?(twitter|x)\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/+$/, "");
    if (!handle) return "";
    return `${protocolPrefix}x.com/${handle}`;
  }
  return "";
}

export function getFacebookUrl(facebookId: string) {

  if (facebookId && facebookId.startsWith("http")) {
    return facebookId;
  }

  if (facebookId && facebookId.length > 0) {
    return `${protocolPrefix}www.facebook.com/${facebookId.replace(" ", ".")}`;
  }
  return "";
}

export function getBlueskyInUrl(blueskyHandle: string) {
    if (blueskyHandle && blueskyHandle.length > 0) {
      if (blueskyHandle.startsWith("@")) {
        return `${protocolPrefix}bsky.app/profile/${blueskyHandle.slice(1)}`;
      }
      return `${protocolPrefix}bsky.app/profile/${blueskyHandle}`;
    }
    return "";
  }

export function getLinkedInUrl(linkedInId: string) {
  if (linkedInId && linkedInId.length > 0) {
    let linkedInName = linkedInId;
    const tokens = linkedInId.split("/").filter((rec: any) => rec && rec.length > 0);
    if (tokens?.length ?? 0 > 0) {
      linkedInName = tokens[tokens.length - 1]?.trim();
    }
    return `${protocolPrefix}www.linkedin.com/in/${linkedInName.replace(" ", ".")}`;
  }
  return "";
}
