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
  const ay = `${ayStartYear}-${ayStartYear + 1}`;
  const url = `https://api.nusmods.com/v2/${ay}/modules/${normalizedCode}.json`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return null;
    return { data: (await response.json()) as NusModsModule, url };
  } catch {
    return null;
  }
}

export async function fetchNusModule(code: string) {
  const normalizedCode = normalizeModuleCode(code);
  const now = new Date();
  // NUSMods AY starts in August; before August we're still in the previous AY
  const ayStartYear =
    now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();

  // Try current AY and up to 3 previous years
  let result = null;
  for (let offset = 0; offset <= 3; offset++) {
    result = await fetchFromNUSMods(normalizedCode, ayStartYear - offset);
    if (result) break;
  }

  if (!result) return null;

  const { data, url } = result;

  // Plain-object representation — safe for JSON serialisation regardless of DB state
  const moduleInfo = {
    moduleCode: normalizedCode,
    title: data.title,
    units: Number(data.moduleCredit ?? "0") || null,
    faculty: data.faculty ?? null,
    department: data.department ?? null,
    description: data.description ?? null,
    prerequisites: data.prerequisite ?? null,
    sourceUrl: url,
  };

  // Best-effort DB cache — never blocks or throws to the caller
  try {
    const dbFields = {
      ...moduleInfo,
      workload: data.workload
        ? (data.workload as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      semesterData: data.semesterData
        ? (data.semesterData as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      lastFetchedAt: new Date(),
    };
    await prisma.nusModule.upsert({
      where: { moduleCode: normalizedCode },
      update: dbFields,
      create: { ...dbFields },
    });
  } catch {
    // DB not ready / tables not yet created — ignore and continue
  }

  return moduleInfo;
}
