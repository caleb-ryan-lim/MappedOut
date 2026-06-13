import { NextResponse } from "next/server";
import { importHistoricalMappings } from "@/lib/historical-mappings";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach an .xlsx or .csv file first." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await importHistoricalMappings(buffer, file.name);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 500 },
    );
  }
}
