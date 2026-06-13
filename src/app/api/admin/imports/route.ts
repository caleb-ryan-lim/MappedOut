import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

export async function GET() {
  const status = await getAdminStatus();
  const configError = getConfigErrorResponse(status);

  if (configError) {
    return NextResponse.json({
      imports: [],
      note: configError.error,
      readiness: status,
    });
  }

  const imports = await prisma.historicalImportRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ imports, readiness: status });
}
