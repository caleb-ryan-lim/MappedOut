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

export async function fetchNusModule(code: string) {
  const normalizedCode = normalizeModuleCode(code);
  const currentYear = new Date().getFullYear();
  const ay = `AY${currentYear}/${currentYear + 1}`;
  const url = `https://api.nusmods.com/v2/${ay}/modules/${normalizedCode}.json`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NusModsModule;

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
