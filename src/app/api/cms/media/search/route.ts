import { NextResponse } from "next/server";
import { searchMedia } from "@/lib/cms/media";
import { validateMediaSearch } from "@/lib/cms/media-validation";
import type { MediaSearchQuery } from "@/types/media";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MediaSearchQuery;
    const errors = validateMediaSearch(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const result = await searchMedia(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body: MediaSearchQuery = {
      tenant: searchParams.get("tenant") ?? "",
      search: searchParams.get("q") ?? undefined,
      folder: searchParams.get("folder") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 24,
    };

    const errors = validateMediaSearch(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const result = await searchMedia(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
