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
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) return null;
  return { data: (await response.json()) as NusModsModule, url };
}

export async function fetchNusModule(code: string) {
  const normalizedCode = normalizeModuleCode(code);
  const now = new Date();
  // NUSMods AY starts in August; before August we're still in the previous AY
  const ayStartYear =
    now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();

  // Try current AY and up to 3 previous years to handle recently-discontinued modules
  let result = null;
  for (let offset = 0; offset <= 3; offset++) {
    result = await fetchFromNUSMods(normalizedCode, ayStartYear - offset);
    if (result) break;
  }

  if (!result) return null;

  const { data, url } = result;

  const fields = {
    title: data.title,
    units: Number(data.moduleCredit ?? "0") || null,
    faculty: data.faculty ?? null,
    department: data.department ?? null,
    description: data.description ?? null,
    prerequisites: data.prerequisite ?? null,
    workload: data.workload ? (data.workload as Prisma.InputJsonValue) : Prisma.JsonNull,
    semesterData: data.semesterData
      ? (data.semesterData as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    sourceUrl: url,
    lastFetchedAt: new Date(),
  };

  try {
    return await prisma.nusModule.upsert({
      where: { moduleCode: normalizedCode },
      update: fields,
      create: { moduleCode: normalizedCode, ...fields },
    });
  } catch {
    // DB not yet initialised — return the NUSMods data directly so validation still works
    return { moduleCode: normalizedCode, ...fields };
  }
}
