import { NextResponse } from "next/server";
import { scrapeNusPartnerUniversities } from "@/lib/partner-scraping";

export async function POST() {
  try {
    const summary = await scrapeNusPartnerUniversities();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to scrape partners." },
      { status: 500 },
    );
  }
}
