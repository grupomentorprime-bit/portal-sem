import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  listMedia,
  uploadMedia,
  purgeExpiredTrash,
} from "@/lib/cms/media";
import {
  validateMediaListQuery,
  validateMediaUpload,
} from "@/lib/cms/media-validation";
import type { MediaFolder, MediaListQuery } from "@/types/media";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant") ?? "";
    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const query: MediaListQuery = {
      tenant: tenantCheck.tenant,
      folder: searchParams.get("folder") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      visibility: (searchParams.get("visibility") as MediaListQuery["visibility"]) ?? "active",
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") as MediaListQuery["sort"]) ?? "date",
      direction: (searchParams.get("direction") as MediaListQuery["direction"]) ?? "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 24,
    };

    if (searchParams.get("tags")) {
      query.tags = searchParams.get("tags")!.split(",").map((t) => t.trim());
    }

    const errors = validateMediaListQuery(query);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    await purgeExpiredTrash(query.tenant);
    const result = await listMedia(query);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const tenantParam = String(formData.get("tenant") ?? "");
    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const tenant = tenantCheck.tenant;
    const folder = formData.get("folder") ? String(formData.get("folder")) : undefined;
    const alt = formData.get("alt") ? String(formData.get("alt")) : undefined;
    const tagsRaw = formData.get("tags") ? String(formData.get("tags")) : "";
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo requerido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    const errors = validateMediaUpload({
      tenant,
      mimeType,
      extension,
      size: buffer.length,
      folder,
    });
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const asset = await uploadMedia({
      tenant,
      buffer,
      originalName: file.name,
      mimeType,
      folder: folder as MediaFolder | undefined,
      tags,
      alt,
      createdBy: String(formData.get("createdBy") ?? "admin"),
    });

    return NextResponse.json({ ok: true, media: asset }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
