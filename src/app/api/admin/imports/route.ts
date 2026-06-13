import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const imports = await prisma.historicalImportRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ imports });
}
