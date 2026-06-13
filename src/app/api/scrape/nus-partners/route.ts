import { NextResponse } from "next/server";
import { scrapeNusPartnerUniversities } from "@/lib/partner-scraping";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

export async function POST() {
  try {
    const status = await getAdminStatus();
    const configError = getConfigErrorResponse(status);

    if (configError) {
      return NextResponse.json(
        { ...configError, readiness: status },
        { status: configError.status },
      );
    }

    const summary = await scrapeNusPartnerUniversities();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to scrape partners." },
      { status: 500 },
    );
  }
}
