import { normalizeModuleCode } from "@/lib/normalize";
import { fetchNusModule } from "@/lib/nusmods";
import { prisma } from "@/lib/prisma";
import { rankUniversities } from "@/lib/ranking";
import type { EmptyState } from "@/lib/runtime-readiness";
import type { MapRequest } from "@/lib/types";

export async function buildMappingResponse(request: MapRequest) {
  const nusModuleCodes = request.nusModuleCodes.map(normalizeModuleCode).filter(Boolean);
  const resolvedModules = await Promise.all(nusModuleCodes.map((code) => fetchNusModule(code)));
  const unresolvedModules = nusModuleCodes.filter((code, index) => !resolvedModules[index]);

  const rankedUniversities = await rankUniversities({
    ...request,
    nusModuleCodes,
    overseasOnly: request.overseasOnly ?? true,
  });

  const [historicalMappingCount, partnerUniversityCount] = await Promise.all([
    prisma.historicalMapping.count(),
    prisma.partnerUniversity.count(),
  ]);

  let emptyState: EmptyState | null = null;

  if (historicalMappingCount === 0) {
    emptyState = {
      code: "NO_HISTORICAL_MAPPINGS",
      title: "Historical mappings are not loaded yet",
      message: "The historical SEP workbook has not been imported into the backend yet.",
    };
  } else if (partnerUniversityCount === 0) {
    emptyState = {
      code: "NO_PARTNER_UNIVERSITIES",
      title: "Partner universities are not loaded yet",
      message: "Partner university data has not been refreshed in the backend yet.",
    };
  } else if (rankedUniversities.length === 0) {
    emptyState = {
      code: "NO_RESULTS",
      title: "No ranked universities yet",
      message:
        "The current database has evidence loaded, but no partners matched your selected modules and filters.",
    };
  }

  return {
    inputModules: nusModuleCodes,
    unresolvedModules,
    rankedUniversities,
    emptyState,
  };
}
