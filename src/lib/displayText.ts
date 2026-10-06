// Some profile fields hold a placeholder like "." or "-". Treat a value with no letter or digit as empty.
export function meaningful(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return /[\p{L}\p{N}]/u.test(v) ? v : "";
}

// "Job · Company", skipping whichever part is empty or only punctuation.
export function jobLine(job: string | null | undefined, company: string | null | undefined, sep = " · "): string {
  return [meaningful(job), meaningful(company)].filter(Boolean).join(sep);
}
