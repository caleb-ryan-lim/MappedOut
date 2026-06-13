import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discoverPartnerCourseCatalogue, scrapePartnerCourseCatalogue } from "@/lib/partner-scraping";
import {
  getAdminStatus,
  getBrightDataErrorResponse,
  getConfigErrorResponse,
} from "@/lib/runtime-readiness";

export async function POST(request: Request) {
  try {
    const status = await getAdminStatus();
    const configError = getConfigErrorResponse(status);

    if (configError) {
      return NextResponse.json(
        { ...configError, readiness: status },
        { status: configError.status },
      );
    }

    if (!status.brightData.configured) {
      const brightDataError = getBrightDataErrorResponse();
      return NextResponse.json(
        { ...brightDataError, readiness: status },
        { status: brightDataError.status },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      partnerUniversityIds?: string[];
      limit?: number;
      priorityFromHistoricalMappings?: boolean;
      includeLocal?: boolean;
    };

    let partners = body.partnerUniversityIds?.length
      ? await prisma.partnerUniversity.findMany({
          where: { id: { in: body.partnerUniversityIds } },
          orderBy: { updatedAt: "desc" },
        })
      : await prisma.partnerUniversity.findMany({
          where: body.includeLocal ? {} : { isOverseas: { not: false } },
          orderBy: { updatedAt: "desc" },
          take: body.limit ?? 10,
        });

    if (body.priorityFromHistoricalMappings) {
      const grouped = await prisma.historicalMapping.groupBy({
        by: ["partnerUniversityNormalized"],
        _count: { _all: true },
        orderBy: { _count: { partnerUniversityNormalized: "desc" } },
        take: body.limit ?? 10,
      });

      const prioritized = await prisma.partnerUniversity.findMany({
        where: {
          normalizedName: { in: grouped.map((entry) => entry.partnerUniversityNormalized) },
        },
      });

      if (prioritized.length > 0) {
        partners = prioritized;
      }
    }

    for (const partner of partners) {
      await discoverPartnerCourseCatalogue(partner.id);
      await scrapePartnerCourseCatalogue(partner.id);
    }

    return NextResponse.json({ processedPartnerCount: partners.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to scrape partner courses." },
      { status: 500 },
    );
  }
}
