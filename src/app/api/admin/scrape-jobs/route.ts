import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

export async function GET() {
  const status = await getAdminStatus();
  const configError = getConfigErrorResponse(status);

  if (configError) {
    return NextResponse.json({
      jobs: [],
      note: configError.error,
      readiness: status,
    });
  }

  const jobs = await prisma.scrapeJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ jobs, readiness: status });
}
