import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MappingClassification, PreApprovalStatus } from "@prisma/client";
import { normalizeCredits } from "@/lib/credits";
import { mapPreApprovalStatus, validateHistoricalHeaders } from "@/lib/historical-mappings";
import { normalizeModuleCode, normalizeUniversityName } from "@/lib/normalize";
import { parseCourseCataloguePage } from "@/lib/partner-scraping";
import { computeMappingScore } from "@/lib/scoring";

describe("historical mapping import", () => {
  it("detects required headers", () => {
    const result = validateHistoricalHeaders([
      "Faculty",
      "Partner University",
      "PU Course 1",
      "PU Course 1 Title",
      "PU Crse1 Units",
      "PU Course 2",
      "PU Course 2 Title",
      "PU Crse2 Units",
      "NUS Course 1",
      "NUS Course 1 Title",
      "NUS Crse1 Units",
      "NUS Course 2",
      "NUS Course 2 Title",
      "NUS Crse2 Units",
      "Pre Approved?",
    ]);

    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("maps Y, N, and blank pre-approval values correctly", () => {
    expect(mapPreApprovalStatus("")).toBe(PreApprovalStatus.UNKNOWN);
    expect(mapPreApprovalStatus("Y")).toBe(PreApprovalStatus.APPROVED);
    expect(mapPreApprovalStatus("N")).toBe(PreApprovalStatus.REJECTED);
  });
});

describe("normalization helpers", () => {
  it("normalizes university and module identifiers", () => {
    expect(normalizeUniversityName("National University of Singapore ")).toBe(
      "national university of singapore",
    );
    expect(normalizeModuleCode(" cs2103t ")).toBe("CS2103T");
  });
});

describe("credit normalization", () => {
  it("parses ECTS into comparable units", () => {
    const normalized = normalizeCredits("6 ECTS");
    expect(normalized.creditSystem).toBe("ECTS");
    expect(normalized.creditsNormalized).toBe(3);
  });
});

describe("catalogue parser", () => {
  it("extracts courses from saved markdown fixtures", () => {
    const markdown = fs.readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "partner-course-page.md"),
      "utf8",
    );
    const courses = parseCourseCataloguePage(markdown);
    expect(courses).toHaveLength(3);
    expect(courses.some((course) => course.courseCode === "COMP4432")).toBe(true);
  });
});

describe("score formula", () => {
  it("keeps a strong mapping above the strong threshold", () => {
    const score = computeMappingScore({
      module: {
        id: "m1",
        moduleCode: "CS3244",
        title: "Machine Learning",
        units: 4,
        faculty: null,
        department: null,
        description: "supervised learning neural networks classification regression",
        prerequisites: "linear algebra probability",
        workload: null,
        semesterData: null,
        sourceUrl: null,
        lastFetchedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      course: {
        id: "c1",
        partnerUniversityId: "u1",
        courseCode: "COMP4432",
        normalizedCourseCode: "COMP4432",
        title: "Machine Learning",
        department: null,
        faculty: null,
        academicLevel: null,
        creditsRaw: "8 US credits",
        creditsNormalized: 4,
        creditSystem: "US_CREDITS",
        workloadHours: null,
        semesterOffered: "AY2026/2027 Semester 1",
        languageOfInstruction: null,
        gradingMode: null,
        isAvailableToExchangeStudents: true,
        isOnlineOrHybrid: false,
        prerequisites: "probability linear algebra",
        description: "machine learning classification regression neural networks",
        topics: null,
        learningOutcomes: null,
        assessment: null,
        sourceUrl: "https://example.edu/courses/comp4432",
        rawMarkdownSnapshotPath: "data/example.md",
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      historicalMapping: {
        id: "h1",
        faculty: "SoC",
        partnerUniversityRaw: "Example University",
        partnerUniversityNormalized: "example university",
        puCourse1Code: "COMP4432",
        puCourse1Title: "Machine Learning",
        puCourse1Units: "8",
        puCourse2Code: null,
        puCourse2Title: null,
        puCourse2Units: null,
        nusCourse1Code: "CS3244",
        nusCourse1TitleRaw: "Machine Learning",
        nusCourse1Units: "4",
        nusCourse2Code: null,
        nusCourse2TitleRaw: null,
        nusCourse2Units: null,
        preApprovedRaw: "Y",
        preApprovalStatus: PreApprovalStatus.APPROVED,
        sourceFileName: "test.xlsx",
        sourceSheetName: "SoC SEP mapping list",
        sourceRowNumber: 12,
        originalRowJson: {},
        warningsJson: [],
        importedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        importRunId: null,
      },
      targetSemester: "AY2026/2027 Semester 1",
    });

    expect(score.classification).toBe(MappingClassification.strong);
    expect(score.finalScore).toBeGreaterThanOrEqual(0.8);
  });
});
