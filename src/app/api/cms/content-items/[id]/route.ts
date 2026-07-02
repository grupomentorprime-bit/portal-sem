import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  deleteContentItem,
  getContentItem,
  isEditableCollection,
  updateContentItem,
  validateContentWrite,
  type ContentWriteInput,
} from "@/lib/content/content-write";
import type { AllowedCollection } from "@/lib/content/types";
import { authorizeApiWrite } from "@/lib/identity/api-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant");
    const collection = searchParams.get("collection");

    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    if (!collection || !isEditableCollection(collection)) {
      return NextResponse.json({ ok: false, error: "Colección no válida." }, { status: 400 });
    }

    const item = await getContentItem(
      tenantCheck.tenant,
      collection as AllowedCollection,
      id
    );
    if (!item) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.pages.update", {
      action: "content.update",
      entity: "content",
    });
    if (denied) return denied;

    const { id } = await params;
    const body = (await request.json()) as ContentWriteInput;
    const tenantCheck = await assertActiveTenant(body.tenant);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);
    body.tenant = tenantCheck.tenant;
    body._id = id;

    if (!isEditableCollection(body.collection)) {
      return NextResponse.json(
        { ok: false, error: "Colección no editable." },
        { status: 400 }
      );
    }

    const errors = validateContentWrite(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const item = await updateContentItem(id, body);
    if (!item) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.pages.delete", {
      action: "content.delete",
      entity: "content",
    });
    if (denied) return denied;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get("tenant");
    const collection = searchParams.get("collection");

    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    if (!collection || !isEditableCollection(collection)) {
      return NextResponse.json({ ok: false, error: "Colección no válida." }, { status: 400 });
    }

    const deleted = await deleteContentItem(
      tenantCheck.tenant,
      collection as AllowedCollection,
      id
    );
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
