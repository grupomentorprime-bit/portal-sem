import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  executeContentQuery,
  toContentQuery,
  validateContentQuery,
} from "@/lib/content/query";
import type { ContentQueryRequest } from "@/lib/content/types";
import { ALLOWED_COLLECTIONS } from "@/lib/content/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant") ?? "";
    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

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
    const body = (await request.json()) as ContentQueryRequest;
    const tenantCheck = await assertActiveTenant(body.tenant);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

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

export async function OPTIONS() {
  return NextResponse.json({
    ok: true,
    collections: ALLOWED_COLLECTIONS,
    methods: ["GET", "POST"],
  });
}
