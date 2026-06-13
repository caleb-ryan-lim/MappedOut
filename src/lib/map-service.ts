import { normalizeModuleCode, normalizeUniversityName } from "@/lib/normalize";
import { fetchNusModule } from "@/lib/nusmods";
import { prisma } from "@/lib/prisma";
import { rankUniversities } from "@/lib/ranking";
import { STATIC_PARTNERS } from "@/lib/static-partners";
import type { EmptyState } from "@/lib/runtime-readiness";
import type { MapRequest } from "@/lib/types";

async function seedPartnersIfEmpty() {
  const count = await prisma.partnerUniversity.count();
  if (count > 0) return;
  for (const p of STATIC_PARTNERS) {
    const normalizedName = normalizeUniversityName(p.name);
    await prisma.partnerUniversity.upsert({
      where: { normalizedName },
      create: { name: p.name, normalizedName, country: p.country, region: p.region, isOverseas: true, isSocPartner: true },
      update: {},
    });
  }
}

export async function buildMappingResponse(request: MapRequest) {
  // Auto-seed partner list from static data if DB is empty — best-effort, never blocks
  await seedPartnersIfEmpty().catch(() => {});

  const nusModuleCodes = request.nusModuleCodes.map(normalizeModuleCode).filter(Boolean);
  const resolvedModules = await Promise.all(nusModuleCodes.map((code) => fetchNusModule(code)));
  const unresolvedModules = nusModuleCodes.filter((code, index) => !resolvedModules[index]);

  const rankedUniversities = await rankUniversities({
    ...request,
    nusModuleCodes,
    overseasOnly: request.overseasOnly ?? true,
  });

  const historicalMappingCount = await prisma.historicalMapping.count();
  const browseMode = historicalMappingCount === 0 && rankedUniversities.length > 0;

  let emptyState: EmptyState | null = null;

  if (rankedUniversities.length === 0) {
    emptyState = {
      code: "NO_RESULTS",
      title: "No partner universities found",
      message: "No partner universities matched your filters. Try broadening your search.",
    };
  }

  return {
    inputModules: nusModuleCodes,
    unresolvedModules,
    rankedUniversities,
    emptyState,
    browseMode,
  };
}
