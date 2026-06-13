import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchNusModule } from "@/lib/nusmods";
import { scrapeUniversityProfile } from "@/lib/university-profile";
import { hasBrightData, hasDatabase } from "@/lib/env";
import { normalizeModuleCode } from "@/lib/normalize";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasDatabase) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL before using this route." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const moduleCodes = (searchParams.get("modules") ?? "")
    .split(",")
    .map((c) => normalizeModuleCode(c.trim()))
    .filter(Boolean);

  try {
    const [university, totalOverseasCourses] = await Promise.all([
      prisma.partnerUniversity.findUniqueOrThrow({ where: { id } }),
      prisma.overseasCourse.count({ where: { partnerUniversityId: id } }),
    ]);

    let scraped = {
      about: null as string | null,
      language: "English" as string,
      exchangeSpots: null as number | null,
      applicationDeadline: null as string | null,
      areasOfStudy: [] as string[],
      heroImageUrl: null as string | null,
    };

    if (hasBrightData) {
      try {
        scraped = await scrapeUniversityProfile(
          university.name,
          university.officialExchangeUrl,
        );
      } catch {
        // Proceed with empty scraped profile
      }
    }

    const nusModules =
      moduleCodes.length > 0
        ? (
            await Promise.all(
              moduleCodes.map(async (code) => {
                const mod = await fetchNusModule(code);
                if (!mod) return null;
                const semesterData = mod.semesterData as
                  | Array<{ semester: number }>
                  | null;
                const semesters =
                  semesterData && semesterData.length > 0
                    ? semesterData.map((s) => `Sem ${s.semester}`).join(" & ")
                    : null;
                return {
                  code: mod.moduleCode,
                  title: mod.title,
                  description: mod.description,
                  units: mod.units,
                  semesters,
                };
              }),
            )
          ).filter((m): m is NonNullable<typeof m> => m !== null)
        : [];

    return NextResponse.json({
      id: university.id,
      name: university.name,
      country: university.country,
      region: university.region,
      officialExchangeUrl: university.officialExchangeUrl,
      ...scraped,
      totalOverseasCourses,
      nusModules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "University not found." },
      { status: 404 },
    );
  }
}
