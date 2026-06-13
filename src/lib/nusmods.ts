import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeModuleCode } from "@/lib/normalize";

type NusModsModule = {
  moduleCode: string;
  title: string;
  moduleCredit?: string;
  faculty?: string;
  department?: string;
  description?: string;
  prerequisite?: string;
  workload?: Record<string, number>;
  semesterData?: unknown;
};

async function fetchFromNUSMods(normalizedCode: string, ayStartYear: number) {
  // NUSMods URL format: /v2/2025-2026/modules/CS1010A.json
  const ay = `${ayStartYear}-${ayStartYear + 1}`;
  const url = `https://api.nusmods.com/v2/${ay}/modules/${normalizedCode}.json`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) return null;
  return { data: (await response.json()) as NusModsModule, url };
}

export async function fetchNusModule(code: string) {
  const normalizedCode = normalizeModuleCode(code);
  const now = new Date();
  // NUSMods academic year starts in August; before August we're still in the previous AY
  const ayStartYear =
    now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();

  // Try the current AY, fall back to the one before it
  const result =
    (await fetchFromNUSMods(normalizedCode, ayStartYear)) ??
    (await fetchFromNUSMods(normalizedCode, ayStartYear - 1));

  if (!result) return null;

  const { data, url } = result;

  return prisma.nusModule.upsert({
    where: { moduleCode: normalizedCode },
    update: {
      title: data.title,
      units: Number(data.moduleCredit ?? "0") || null,
      faculty: data.faculty ?? null,
      department: data.department ?? null,
      description: data.description ?? null,
      prerequisites: data.prerequisite ?? null,
      workload: data.workload
        ? (data.workload as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      semesterData: data.semesterData
        ? (data.semesterData as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      sourceUrl: url,
      lastFetchedAt: new Date(),
    },
    create: {
      moduleCode: normalizedCode,
      title: data.title,
      units: Number(data.moduleCredit ?? "0") || null,
      faculty: data.faculty ?? null,
      department: data.department ?? null,
      description: data.description ?? null,
      prerequisites: data.prerequisite ?? null,
      workload: data.workload
        ? (data.workload as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      semesterData: data.semesterData
        ? (data.semesterData as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      sourceUrl: url,
      lastFetchedAt: new Date(),
    },
  });
}
