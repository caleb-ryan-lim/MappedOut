import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { importHistoricalMappings } from "@/lib/historical-mappings";
import { scrapeNusPartnerUniversities } from "@/lib/partner-scraping";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

type BootstrapPayload = {
  fileName?: string;
  refreshPartners?: boolean;
};

function resolveCandidatePaths(fileName?: string) {
  const explicitFileName = fileName?.trim();

  return [
    explicitFileName
      ? path.join(/* turbopackIgnore: true */ process.cwd(), "data", explicitFileName)
      : null,
    path.join(process.cwd(), "data", "sep-mappings.xlsx"),
    path.join(process.cwd(), "data", "historical-mappings.xlsx"),
    path.join(process.cwd(), "data", "soc-sep-mapping-list.xlsx"),
    path.join(process.cwd(), "data", "sep-mappings.csv"),
  ].filter(Boolean) as string[];
}

async function findReadableWorkbook(fileName?: string) {
  for (const candidate of resolveCandidatePaths(fileName)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

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

    const payload = ((await request.json().catch(() => ({}))) ?? {}) as BootstrapPayload;
    const workbookPath = await findReadableWorkbook(payload.fileName);

    if (!workbookPath) {
      return NextResponse.json(
        {
          error:
            "No backend workbook was found. Add the SEP workbook under data/ or pass a fileName in the request body.",
        },
        { status: 400 },
      );
    }

    const buffer = await readFile(workbookPath);
    const importSummary = await importHistoricalMappings(buffer, path.basename(workbookPath));

    let partnerSummary: { importedPartners: number } | null = null;

    if (payload.refreshPartners !== false) {
      partnerSummary = await scrapeNusPartnerUniversities();
    }

    return NextResponse.json({
      workbookPath,
      importSummary,
      partnerSummary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to run backend bootstrap.",
      },
      { status: 500 },
    );
  }
}
