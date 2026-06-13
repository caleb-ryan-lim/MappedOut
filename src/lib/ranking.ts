import { MappingClassification, PreApprovalStatus } from "@prisma/client";
import { normalizeModuleCode } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { computeMappingScore } from "@/lib/scoring";
import type { MapRequest } from "@/lib/types";

const ORDER: MappingClassification[] = [
  MappingClassification.strong,
  MappingClassification.possible,
  MappingClassification.weak,
  MappingClassification.notRecommended,
];

export async function rankUniversities(request: MapRequest) {
  const moduleCodes = request.nusModuleCodes.map(normalizeModuleCode).filter(Boolean);
  const modules = await prisma.nusModule.findMany({
    where: { moduleCode: { in: moduleCodes } },
  });

  const historicalMappings = await prisma.historicalMapping.findMany({
    where: {
      OR: [{ nusCourse1Code: { in: moduleCodes } }, { nusCourse2Code: { in: moduleCodes } }],
    },
  });

  // No historical evidence for these modules → return all partners as unranked browse results
  if (historicalMappings.length === 0) {
    const allPartners = await prisma.partnerUniversity.findMany({
      where: {
        ...(request.overseasOnly !== false ? { isOverseas: { not: false } } : {}),
        ...(request.preferredCountries?.length ? { country: { in: request.preferredCountries } } : {}),
      },
      orderBy: { name: "asc" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allPartners.map((partner) => ({
      partnerUniversityId: partner.id,
      name: partner.name,
      country: partner.country,
      strongMappingCount: 0,
      possibleMappingCount: 0,
      averageConfidence: 0,
      warnings: [] as string[],
      moduleMappings: [] as any[],
      unmappedModules: moduleCodes,
    }));
  }

  const partnerNames = [...new Set(historicalMappings.map((mapping) => mapping.partnerUniversityNormalized))];
  const partners = await prisma.partnerUniversity.findMany({
    where: {
      normalizedName: { in: partnerNames.length ? partnerNames : ["__none__"] },
      ...(request.overseasOnly !== false ? { isOverseas: { not: false } } : {}),
      ...(request.preferredCountries?.length ? { country: { in: request.preferredCountries } } : {}),
    },
    include: { overseasCourses: true },
  });

  return partners
    .map((partner) => {
      const moduleMappings = modules
        .map((module) => {
          const partnerHistorical = historicalMappings.filter(
            (mapping) =>
              mapping.partnerUniversityNormalized === partner.normalizedName &&
              [mapping.nusCourse1Code, mapping.nusCourse2Code].includes(module.moduleCode),
          );

          const candidates = partner.overseasCourses
            .map((course) => {
              const historical =
                partnerHistorical.find((mapping) =>
                  [mapping.puCourse1Code, mapping.puCourse2Code].includes(course.normalizedCourseCode),
                ) ?? null;
              const score = computeMappingScore({
                module,
                course,
                historicalMapping: historical,
                targetSemester: request.targetSemester,
              });

              const warnings: string[] = [];
              if (course.creditSystem === "UNKNOWN") warnings.push("Credit system is unknown.");
              if (course.isOnlineOrHybrid) warnings.push("Course appears online or hybrid.");
              if (course.isAvailableToExchangeStudents === false) {
                warnings.push("Course may not be open to exchange students.");
              }

              return {
                nusModuleCode: module.moduleCode,
                courseCode: course.courseCode,
                title: course.title,
                confidence: score.finalScore,
                classification: score.classification,
                explanation:
                  historical?.preApprovalStatus === PreApprovalStatus.APPROVED
                    ? "Historical approved mapping exists and the live catalogue still looks compatible."
                    : "Recommendation based on historical evidence and current catalogue similarity.",
                warnings,
                historicalEvidence: {
                  foundInExcel: Boolean(historical),
                  preApprovalStatus: historical?.preApprovalStatus ?? null,
                  sourceRowNumbers: historical ? [historical.sourceRowNumber] : [],
                },
                scoreBreakdown: {
                  contentSimilarityScore: score.contentSimilarityScore,
                  workloadScore: score.workloadScore,
                  levelScore: score.levelScore,
                  prerequisiteScore: score.prerequisiteScore,
                  historicalMappingScore: score.historicalMappingScore,
                  availabilityScore: score.availabilityScore,
                  restrictionPenalty: score.restrictionPenalty,
                },
                sourceUrls: [course.sourceUrl],
              };
            })
            .sort((a, b) => b.confidence - a.confidence);

          return candidates[0] ?? null;
        })
        .filter(Boolean);

      const minimumClassification = request.minimumClassification;
      const filteredModuleMappings = minimumClassification
        ? moduleMappings.filter(
            (mapping) =>
              ORDER.indexOf(mapping.classification) <= ORDER.indexOf(minimumClassification),
          )
        : moduleMappings;

      const mappedCodes = new Set(filteredModuleMappings.map((mapping) => mapping.nusModuleCode));
      const strongMappingCount = filteredModuleMappings.filter(
        (mapping) => mapping.classification === MappingClassification.strong,
      ).length;
      const possibleMappingCount = filteredModuleMappings.filter(
        (mapping) => mapping.classification === MappingClassification.possible,
      ).length;
      const averageConfidence =
        filteredModuleMappings.reduce((sum, mapping) => sum + mapping.confidence, 0) /
        (filteredModuleMappings.length || 1);

      return {
        partnerUniversityId: partner.id,
        name: partner.name,
        country: partner.country,
        strongMappingCount,
        possibleMappingCount,
        averageConfidence: Number(averageConfidence.toFixed(2)),
        warnings: filteredModuleMappings.flatMap((mapping) => mapping.warnings).slice(0, 6),
        moduleMappings: filteredModuleMappings,
        unmappedModules: moduleCodes.filter((code) => !mappedCodes.has(code)),
      };
    })
    .sort((a, b) => {
      if (b.strongMappingCount !== a.strongMappingCount) {
        return b.strongMappingCount - a.strongMappingCount;
      }
      if (b.possibleMappingCount !== a.possibleMappingCount) {
        return b.possibleMappingCount - a.possibleMappingCount;
      }
      return b.averageConfidence - a.averageConfidence;
    });
}
