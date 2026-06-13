import { MappingClassification } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { buildMappingResponse } from "@/lib/map-service";
import { getAdminStatus, getConfigErrorResponse } from "@/lib/runtime-readiness";

const schema = z.object({
  nusModuleCodes: z.array(z.string()).min(1),
  targetSemester: z.string().optional(),
  preferredCountries: z.array(z.string()).optional(),
  minimumClassification: z.nativeEnum(MappingClassification).optional(),
  overseasOnly: z.boolean().optional(),
});

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

    const payload = schema.parse(await request.json());
    const result = await buildMappingResponse(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to compute mappings." },
      { status: 500 },
    );
  }
}
