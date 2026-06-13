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

async function fetchFromNUSMods(normalizedCode: string, year: number) {
  const ay = `AY${year}/${year + 1}`;
  const url = `https://api.nusmods.com/v2/${ay}/modules/${normalizedCode}.json`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) return null;
  return { data: (await response.json()) as NusModsModule, url };
}

export async function fetchNusModule(code: string) {
  const normalizedCode = normalizeModuleCode(code);
  const currentYear = new Date().getFullYear();

  // Try current AY first, fall back to the previous one (NUSMods lags by ~6 months)
  const result =
    (await fetchFromNUSMods(normalizedCode, currentYear)) ??
    (await fetchFromNUSMods(normalizedCode, currentYear - 1));

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
