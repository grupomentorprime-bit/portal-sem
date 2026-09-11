import { NextResponse } from "next/server";
import { getBlockLibraryUncached, revalidateBlockLibraryCache, seedBlockLibrary } from "@/lib/cms/blocks";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";

export async function GET() {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;
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

/** Acción explícita: sembrar biblioteca de bloques. */
export async function POST() {
  try {
    const denied = await authorizeApiWrite("cms.pages.update", {
      action: "blocks.seed",
      entity: "cms_blocks",
    });
    if (denied) return denied;
    const blocks = await seedBlockLibrary();
    revalidateBlockLibraryCache();
    return NextResponse.json({ ok: true, blocks, seeded: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
