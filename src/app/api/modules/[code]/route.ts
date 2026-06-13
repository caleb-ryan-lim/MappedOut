import { NextResponse } from "next/server";
import { fetchNusModule } from "@/lib/nusmods";

export async function GET(_: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const resolvedModule = await fetchNusModule(code);
  if (!resolvedModule) {
    return NextResponse.json({ error: "Module not found in NUSMods." }, { status: 404 });
  }
  return NextResponse.json(resolvedModule);
}
