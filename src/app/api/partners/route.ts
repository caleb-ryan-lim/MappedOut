import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partners = await prisma.partnerUniversity.findMany({
    orderBy: [{ isOverseas: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ partners });
}
