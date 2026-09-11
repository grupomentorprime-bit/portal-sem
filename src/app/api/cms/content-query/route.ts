import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  executeContentQuery,
  toContentQuery,
  validateContentQuery,
} from "@/lib/content/query";
import type { ContentQueryRequest } from "@/lib/content/types";
import { authorizeApiRead } from "@/lib/identity/api-guard";

export async function GET(request: Request) {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection") ?? "";

    const body: ContentQueryRequest = {
      tenant: tenantCheck.tenant,
      collection,
      filters: {
        ...(searchParams.get("featured") === "true" ? { featured: true } : {}),
        ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
        ...(searchParams.get("status") ? { status: searchParams.get("status")! } : {}),
        ...(searchParams.get("search") ? { search: searchParams.get("search")! } : {}),
      },
      sort: searchParams.get("sortField")
        ? {
            field: searchParams.get("sortField")!,
            direction: searchParams.get("sortDirection") ?? "asc",
          }
        : undefined,
      pagination: {
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
      },
    };

    const errors = validateContentQuery(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const query = toContentQuery(body);
    const includeDraft = searchParams.get("preview") === "true";
    const mapItems = searchParams.get("raw") !== "true";
    const result = await executeContentQuery(query, { includeDraft, mapItems });

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
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const body = (await request.json()) as ContentQueryRequest;
    const securedBody = { ...body, tenant: tenantCheck.tenant };
    const errors = validateContentQuery(securedBody);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const query = toContentQuery(securedBody);
    const includeDraft = securedBody.preview === true;
    const mapItems = securedBody.mapItems !== false;
    const result = await executeContentQuery(query, { includeDraft, mapItems });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
