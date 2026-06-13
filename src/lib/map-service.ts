import { MappingClassification } from "@prisma/client";
import { normalizeModuleCode } from "@/lib/normalize";
import { fetchNusModule } from "@/lib/nusmods";
import { rankUniversities } from "@/lib/ranking";
import type { MapRequest } from "@/lib/types";

export async function buildMappingResponse(request: MapRequest) {
  const nusModuleCodes = request.nusModuleCodes.map(normalizeModuleCode).filter(Boolean);
  const resolvedModules = await Promise.all(nusModuleCodes.map((code) => fetchNusModule(code)));
  const unresolvedModules = nusModuleCodes.filter((code, index) => !resolvedModules[index]);

  const rankedUniversities = await rankUniversities({
    ...request,
    nusModuleCodes,
    minimumClassification: request.minimumClassification ?? MappingClassification.possible,
    overseasOnly: request.overseasOnly ?? true,
  });

  return {
    inputModules: nusModuleCodes,
    unresolvedModules,
    rankedUniversities,
  };
}
