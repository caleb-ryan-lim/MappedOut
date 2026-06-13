import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const courses = await prisma.overseasCourse.findMany({
    where: { partnerUniversityId: id },
    orderBy: { title: "asc" },
  });
  return NextResponse.json({ courses });
}
