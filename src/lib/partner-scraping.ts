import { DiscoveredUrlType, ScrapeJobStatus, ScrapeJobType } from "@prisma/client";
import { load } from "cheerio";
import { brightDataScrapeMarkdown, brightDataSearch } from "@/lib/bright-data";
import { normalizeCourseCode, normalizeUniversityName, normalizeWhitespace } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { normalizeCredits } from "@/lib/credits";
import { saveScrapeEvidence } from "@/lib/scrape-evidence";

const SEARCH_PATTERNS = [
  "exchange course catalogue computer science",
  "incoming exchange courses computing",
  "undergraduate computer science courses exchange",
  "module catalogue computer science",
  "course catalog information systems",
] as const;

export async function scrapeNusPartnerUniversities() {
  const job = await prisma.scrapeJob.create({
    data: {
      type: ScrapeJobType.NUS_PARTNERS,
      status: ScrapeJobStatus.running,
      startedAt: new Date(),
    },
  });

  try {
    const sources = [
      "https://www.comp.nus.edu.sg/programmes/ug/beyond/global/",
      "https://nus.edu.sg/gro/global-programmes/student-exchange/partner-universities",
    ];

    const pages = await Promise.all(
      sources.map(async (url) => {
        const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
        return { url, html: await response.text() };
      }),
    );

    const partnerMap = new Map<string, { name: string; sourceUrl: string }>();

    for (const page of pages) {
      const $ = load(page.html);
      $("a, li, p, h2, h3, h4").each((_, element) => {
        const text = normalizeWhitespace($(element).text());
        if (!text || text.length < 6) return;
        if (!/university|college|institute|school/i.test(text)) return;
        const normalized = normalizeUniversityName(text);
        if (!normalized || partnerMap.has(normalized)) return;
        partnerMap.set(normalized, { name: text, sourceUrl: page.url });
      });
    }

    for (const partner of partnerMap.values()) {
      await prisma.partnerUniversity.upsert({
        where: { normalizedName: normalizeUniversityName(partner.name) },
        update: {
          name: partner.name,
          nusSourceUrl: partner.sourceUrl,
        },
        create: {
          name: partner.name,
          normalizedName: normalizeUniversityName(partner.name),
          nusSourceUrl: partner.sourceUrl,
          isSocPartner: true,
        },
      });
    }

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ScrapeJobStatus.succeeded,
        finishedAt: new Date(),
        resultSummaryJson: { importedPartners: partnerMap.size },
      },
    });

    return { importedPartners: partnerMap.size };
  } catch (error) {
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ScrapeJobStatus.failed,
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

function classifyDiscoveredUrl(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return DiscoveredUrlType.PDF_CATALOGUE;
  if (lower.includes("catalog") || lower.includes("course") || lower.includes("module")) {
    return DiscoveredUrlType.OFFICIAL_COURSE_CATALOGUE;
  }
  if (lower.includes("exchange")) return DiscoveredUrlType.EXCHANGE_COURSE_LIST;
  if (lower.includes("department") || lower.includes("computer-science")) {
    return DiscoveredUrlType.DEPARTMENT_COURSE_PAGE;
  }
  return DiscoveredUrlType.UNKNOWN;
}

export async function discoverPartnerCourseCatalogue(partnerUniversityId: string) {
  const partner = await prisma.partnerUniversity.findUniqueOrThrow({
    where: { id: partnerUniversityId },
  });

  const discovered: Array<{
    query: string;
    title: string;
    url: string;
    classification: DiscoveredUrlType;
  }> = [];

  for (const pattern of SEARCH_PATTERNS) {
    const query = `${partner.name} ${pattern}`;
    const results = await brightDataSearch(query);
    for (const result of results) {
      discovered.push({
        query,
        title: result.title,
        url: result.url,
        classification: classifyDiscoveredUrl(result.url),
      });
    }
  }

  for (const candidate of discovered) {
    await prisma.discoveredCourseUrl.upsert({
      where: {
        partnerUniversityId_url: {
          partnerUniversityId,
          url: candidate.url,
        },
      },
      update: {
        query: candidate.query,
        classification: candidate.classification,
      },
      create: {
        partnerUniversityId,
        url: candidate.url,
        query: candidate.query,
        classification: candidate.classification,
      },
    });
  }

  return discovered;
}

export function parseCourseCataloguePage(markdown: string) {
  const sections = markdown.split(/\n(?=[A-Z]{2,}\d{2,}|\*\*[A-Z]{2,}\d{2,})/g);

  return sections
    .map((section) => {
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const titleLine = lines[0] ?? "";
      const code = normalizeCourseCode(titleLine.match(/[A-Z]{2,}\s?\d{2,}[A-Z]?/)?.[0] ?? "");
      const title = normalizeWhitespace(titleLine.replace(code, ""));
      if (!code || !title) return null;

      const creditsLine = lines.find((line) => /credit|ects|unit/i.test(line)) ?? "";
      const description = lines.slice(1, 6).join(" ");
      return {
        courseCode: code,
        title,
        description,
        creditsRaw: creditsLine || null,
      };
    })
    .filter(Boolean) as Array<{
    courseCode: string;
    title: string;
    description: string;
    creditsRaw: string | null;
  }>;
}

export function detectRestrictions(markdown: string) {
  const lower = markdown.toLowerCase();
  return {
    isAvailableToExchangeStudents: !/not available to exchange|restricted to home students/.test(lower),
    isOnlineOrHybrid: /online|hybrid|distance learning/.test(lower),
    gradingMode: /pass\/fail/.test(lower) ? "PASS_FAIL" : null,
  };
}

export async function scrapePartnerCourseCatalogue(partnerUniversityId: string) {
  const job = await prisma.scrapeJob.create({
    data: {
      type: ScrapeJobType.PARTNER_COURSES,
      status: ScrapeJobStatus.running,
      startedAt: new Date(),
      partnerUniversityId,
    },
  });

  try {
    const partner = await prisma.partnerUniversity.findUniqueOrThrow({
      where: { id: partnerUniversityId },
      include: { discoveredCourseUrls: true },
    });

    const discoveredTargets = partner.discoveredCourseUrls.filter(
      (entry) => entry.classification !== DiscoveredUrlType.IRRELEVANT,
    );
    const savedCourses: string[] = [];

    for (const target of discoveredTargets.slice(0, 3)) {
      const scraped = await brightDataScrapeMarkdown(target.url);
      const parsedCourses = parseCourseCataloguePage(scraped.markdown);
      const restrictions = detectRestrictions(scraped.markdown);

      for (const course of parsedCourses) {
        const credit = normalizeCredits(course.creditsRaw);
        const snapshotPath = await saveScrapeEvidence(
          partner.normalizedName,
          course.courseCode.toLowerCase(),
          scraped.markdown,
        );

        await prisma.overseasCourse.upsert({
          where: {
            partnerUniversityId_normalizedCourseCode_sourceUrl: {
              partnerUniversityId: partner.id,
              normalizedCourseCode: normalizeCourseCode(course.courseCode),
              sourceUrl: target.url,
            },
          },
          update: {
            title: course.title,
            description: course.description,
            creditsRaw: course.creditsRaw,
            creditsNormalized: credit.creditsNormalized,
            creditSystem: credit.creditSystem,
            sourceUrl: target.url,
            rawMarkdownSnapshotPath: snapshotPath,
            scrapedAt: new Date(),
            isAvailableToExchangeStudents: restrictions.isAvailableToExchangeStudents,
            isOnlineOrHybrid: restrictions.isOnlineOrHybrid,
            gradingMode: restrictions.gradingMode,
          },
          create: {
            partnerUniversityId: partner.id,
            courseCode: course.courseCode,
            normalizedCourseCode: normalizeCourseCode(course.courseCode),
            title: course.title,
            description: course.description,
            creditsRaw: course.creditsRaw,
            creditsNormalized: credit.creditsNormalized,
            creditSystem: credit.creditSystem,
            sourceUrl: target.url,
            rawMarkdownSnapshotPath: snapshotPath,
            scrapedAt: new Date(),
            isAvailableToExchangeStudents: restrictions.isAvailableToExchangeStudents,
            isOnlineOrHybrid: restrictions.isOnlineOrHybrid,
            gradingMode: restrictions.gradingMode,
          },
        });

        savedCourses.push(course.courseCode);
      }
    }

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ScrapeJobStatus.succeeded,
        finishedAt: new Date(),
        resultSummaryJson: { savedCourses },
      },
    });

    return { savedCourses };
  } catch (error) {
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: ScrapeJobStatus.failed,
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
