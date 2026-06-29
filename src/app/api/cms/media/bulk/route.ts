import { NextResponse } from "next/server";
import { bulkMediaAction } from "@/lib/cms/media";
import { validateBulkAction } from "@/lib/cms/media-validation";
import type { MediaBulkAction } from "@/types/media";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MediaBulkAction;
    const errors = validateBulkAction(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const affected = await bulkMediaAction(body);
    return NextResponse.json({ ok: true, affected });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
