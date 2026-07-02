import { NextResponse } from "next/server";
import { getTemplatesUncached, revalidateTemplatesCache, seedTemplates } from "@/lib/cms/templates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("seed") === "true") {
      const templates = await seedTemplates();
      revalidateTemplatesCache();
      return NextResponse.json({ ok: true, templates, seeded: true });
    }
    const templates = await getTemplatesUncached();
    return NextResponse.json({ ok: true, templates });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
