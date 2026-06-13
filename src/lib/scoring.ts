import { MappingClassification, PreApprovalStatus, type HistoricalMapping, type NusModule, type OverseasCourse } from "@prisma/client";
import { workloadScoreFromUnits } from "@/lib/credits";
import { inferCourseLevel, normalizeWhitespace } from "@/lib/normalize";

function tokens(value: string | null | undefined) {
  return new Set(
    normalizeWhitespace(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

export function contentSimilarityScore(module: NusModule, course: OverseasCourse) {
  const moduleTokens = tokens(`${module.title} ${module.description ?? ""}`);
  const courseTokens = tokens(`${course.title} ${course.description ?? ""} ${course.topics ?? ""}`);
  if (moduleTokens.size === 0 || courseTokens.size === 0) return 0.35;

  let overlap = 0;
  for (const token of moduleTokens) {
    if (courseTokens.has(token)) overlap += 1;
  }

  return Number((overlap / Math.max(moduleTokens.size, courseTokens.size)).toFixed(2));
}

export function prerequisiteScore(module: NusModule, course: OverseasCourse) {
  const moduleTokens = tokens(module.prerequisites);
  const courseTokens = tokens(course.prerequisites);
  if (moduleTokens.size === 0 || courseTokens.size === 0) return 0.5;

  let overlap = 0;
  for (const token of moduleTokens) {
    if (courseTokens.has(token)) overlap += 1;
  }

  return Number((overlap / Math.max(moduleTokens.size, courseTokens.size)).toFixed(2));
}

export function levelScore(moduleCode: string, courseCode: string) {
  const moduleLevel = inferCourseLevel(moduleCode);
  const courseLevel = inferCourseLevel(courseCode);
  if (!moduleLevel || !courseLevel) return 0.55;
  if (moduleLevel === courseLevel) return 1;
  if (
    (moduleLevel === "advanced-undergraduate" && courseLevel === "graduate") ||
    (moduleLevel === "intermediate" && courseLevel === "advanced-undergraduate")
  ) {
    return 0.75;
  }
  return 0.35;
}

export function historicalMappingScore(status: PreApprovalStatus | null, hasExactMapping: boolean) {
  if (!hasExactMapping) return 0;
  if (status === PreApprovalStatus.APPROVED) return 1;
  if (status === PreApprovalStatus.UNKNOWN) return 0.7;
  return 0.1;
}

export function availabilityScore(targetSemester: string | undefined, course: OverseasCourse) {
  if (!course.semesterOffered) return 0.7;
  if (!targetSemester) return 0.7;
  return course.semesterOffered.toLowerCase().includes(targetSemester.toLowerCase()) ? 1 : 0.25;
}

export function restrictionPenalty(course: OverseasCourse) {
  let penalty = 0;
  if (course.isOnlineOrHybrid) penalty += 0.1;
  if (course.gradingMode?.toLowerCase().includes("pass")) penalty += 0.08;
  if (course.isAvailableToExchangeStudents === false) penalty += 0.2;
  if ((course.creditsNormalized ?? 999) <= 3) penalty += 0.15;
  if (!course.description) penalty += 0.08;
  if (!course.rawMarkdownSnapshotPath) penalty += 0.05;
  return Number(penalty.toFixed(2));
}

export function classifyFinalScore(score: number): MappingClassification {
  if (score >= 0.8) return MappingClassification.strong;
  if (score >= 0.65) return MappingClassification.possible;
  if (score >= 0.5) return MappingClassification.weak;
  return MappingClassification.notRecommended;
}

export function computeMappingScore(params: {
  module: NusModule;
  course: OverseasCourse;
  historicalMapping: HistoricalMapping | null;
  targetSemester?: string;
}) {
  const content = contentSimilarityScore(params.module, params.course);
  const workload = workloadScoreFromUnits(params.module.units, params.course.creditsNormalized);
  const level = levelScore(params.module.moduleCode, params.course.courseCode);
  const prerequisite = prerequisiteScore(params.module, params.course);
  const hasExactMapping =
    Boolean(params.historicalMapping?.puCourse1Code) &&
    [params.historicalMapping?.puCourse1Code, params.historicalMapping?.puCourse2Code].includes(
      params.course.normalizedCourseCode,
    );
  const historical = historicalMappingScore(params.historicalMapping?.preApprovalStatus ?? null, hasExactMapping);
  const availability = availabilityScore(params.targetSemester, params.course);
  const penalty = restrictionPenalty(params.course);

  const finalScore =
    0.35 * content +
    0.2 * workload +
    0.1 * level +
    0.1 * prerequisite +
    0.2 * historical +
    0.05 * availability -
    penalty;

  const boundedScore = Number(Math.max(0, Math.min(1, finalScore)).toFixed(2));

  return {
    contentSimilarityScore: Number(content.toFixed(2)),
    workloadScore: Number(workload.toFixed(2)),
    levelScore: Number(level.toFixed(2)),
    prerequisiteScore: Number(prerequisite.toFixed(2)),
    historicalMappingScore: Number(historical.toFixed(2)),
    availabilityScore: Number(availability.toFixed(2)),
    restrictionPenalty: Number(penalty.toFixed(2)),
    finalScore: boundedScore,
    classification: classifyFinalScore(boundedScore),
  };
}
