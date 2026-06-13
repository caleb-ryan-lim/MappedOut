import { brightDataSearch, brightDataScrapeMarkdown } from "@/lib/bright-data";
import { normalizeWhitespace } from "@/lib/normalize";

export type ScrapedUniversityProfile = {
  about: string | null;
  language: string;
  exchangeSpots: number | null;
  applicationDeadline: string | null;
  areasOfStudy: string[];
  heroImageUrl: string | null;
};

const KNOWN_AREAS = [
  "Engineering",
  "Business",
  "Computing",
  "Science",
  "Arts",
  "Medicine",
  "Law",
  "Economics",
  "Architecture",
  "Design",
  "Education",
  "Humanities",
  "Technology",
  "Management",
  "Finance",
  "Mathematics",
];

export async function scrapeUniversityProfile(
  universityName: string,
  exchangeUrl?: string | null,
): Promise<ScrapedUniversityProfile> {
  let targetUrl = exchangeUrl ?? null;

  if (!targetUrl) {
    const results = await brightDataSearch(
      `${universityName} student exchange program incoming international`,
    );
    const best =
      results.find((r) => /exchange|international|incoming/i.test(r.url)) ??
      results[0] ??
      null;
    if (!best) return emptyProfile();
    targetUrl = best.url;
  }

  try {
    const { markdown } = await brightDataScrapeMarkdown(targetUrl);
    return parseProfileMarkdown(markdown);
  } catch {
    return emptyProfile();
  }
}

function parseProfileMarkdown(markdown: string): ScrapedUniversityProfile {
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // First substantial paragraph that doesn't look like a nav link or heading
  const about =
    lines.find(
      (l) =>
        l.length > 60 &&
        !l.startsWith("#") &&
        !l.startsWith("!") &&
        !l.startsWith("[") &&
        !l.startsWith("|") &&
        !/^\*{1,2}[^*]/.test(l),
    ) ?? null;

  // Language of instruction
  const langLine = lines.find((l) =>
    /language.*instruction|taught in|medium.*instruction|language of/i.test(l),
  );
  const language =
    langLine?.match(
      /\b(english|mandarin|german|french|spanish|japanese|korean|dutch)\b/i,
    )?.[0] ?? "English";

  // Exchange spots / quota
  const spotsLine = lines.find((l) =>
    /\b\d+\b.*\b(spot|place|quota|seat)\b|\b(spot|place|quota|seat)\b.*\b\d+\b/i.test(
      l,
    ),
  );
  const exchangeSpots = spotsLine
    ? parseInt(spotsLine.match(/\d+/)?.[0] ?? "", 10) || null
    : null;

  // Application deadline — look for a date near deadline language
  const deadlineLine = lines.find((l) =>
    /deadline|apply by|application.*close|submission date|closing date/i.test(l),
  );
  const dateMatch = deadlineLine?.match(
    /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
  );
  const applicationDeadline = dateMatch?.[0] ?? null;

  // Areas of study — match known keywords anywhere in the markdown
  const areasOfStudy = KNOWN_AREAS.filter((area) =>
    new RegExp(`\\b${area}\\b`, "i").test(markdown),
  ).slice(0, 6);

  // First image in the markdown
  const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  const heroImageUrl = imgMatch?.[1] ?? null;

  return {
    about: about ? normalizeWhitespace(about) : null,
    language,
    exchangeSpots,
    applicationDeadline,
    areasOfStudy,
    heroImageUrl,
  };
}

function emptyProfile(): ScrapedUniversityProfile {
  return {
    about: null,
    language: "English",
    exchangeSpots: null,
    applicationDeadline: null,
    areasOfStudy: [],
    heroImageUrl: null,
  };
}
