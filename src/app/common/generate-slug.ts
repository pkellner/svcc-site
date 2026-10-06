export function generateSlug(rawString: string, slugLength = 75) {
  // https://ourcodeworld.com/articles/read/255/creating-url-slugs-properly-in-javascript-including-transliteration-for-utf-8
  // Machine Learning - AI should go to machine-learning---ai
  if (!rawString) {
    return "";
  }
  const str = rawString
    .trim()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
  return str.slice(0, slugLength).trim();
}
