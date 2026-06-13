import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIC_PARTNERS } from "@/lib/static-partners";

export async function GET() {
  try {
    const dbPartners = await prisma.partnerUniversity.findMany({
      orderBy: [{ isOverseas: "desc" }, { name: "asc" }],
      include: { _count: { select: { overseasCourses: true } } },
    });

    // If we have real DB data, use it; otherwise fall back to the static list
    const partners = dbPartners.length > 0 ? dbPartners : STATIC_PARTNERS;
    return NextResponse.json({ partners });
  } catch {
    // DB not ready — return the static list so the explore page is always useful
    return NextResponse.json({ partners: STATIC_PARTNERS });
  }
}
