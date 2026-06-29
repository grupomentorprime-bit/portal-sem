import { NextResponse } from "next/server";
import { getBlockLibraryUncached, seedBlockLibrary } from "@/lib/cms/blocks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("seed") === "true") {
      const blocks = await seedBlockLibrary();
      return NextResponse.json({ ok: true, blocks, seeded: true });
    }
    const blocks = await getBlockLibraryUncached();
    return NextResponse.json({ ok: true, blocks });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
