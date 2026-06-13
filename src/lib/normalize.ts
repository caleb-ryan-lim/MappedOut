const WHITESPACE = /\s+/g;
const PUNCTUATION = /[^a-z0-9]+/gi;

export function normalizeWhitespace(value: string | null | undefined) {
  return (value ?? "").replace(WHITESPACE, " ").trim();
}

export function normalizeModuleCode(value: string | null | undefined) {
  return normalizeWhitespace(value).toUpperCase().replace(/\s+/g, "");
}

export function normalizeCourseCode(value: string | null | undefined) {
  return normalizeWhitespace(value).toUpperCase().replace(/\s+/g, "");
}

export function normalizeUniversityName(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/&/g, " and ")
    .replace(PUNCTUATION, " ")
    .replace(WHITESPACE, " ")
    .trim()
    .toLowerCase();
}

export function inferCourseLevel(code: string | null | undefined) {
  const normalized = normalizeCourseCode(code);
  const match = normalized.match(/(\d{1,4})/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (numeric >= 5000) return "graduate";
  if (numeric >= 4000) return "advanced-undergraduate";
  if (numeric >= 3000) return "intermediate";
  if (numeric >= 2000) return "foundation";
  return "introductory";
}
