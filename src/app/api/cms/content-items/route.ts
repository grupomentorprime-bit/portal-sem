import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  createContentItem,
  isEditableCollection,
  validateContentWrite,
  type ContentWriteInput,
} from "@/lib/content/content-write";
import { authorizeApiWrite } from "@/lib/identity/api-guard";

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("cms.pages.create", {
      action: "content.create",
      entity: "content",
    });
    if (denied) return denied;

    const body = (await request.json()) as ContentWriteInput;
    const tenantCheck = await assertActiveTenant(body.tenant);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);
    body.tenant = tenantCheck.tenant;

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

    const doc = await createContentItem(body);
    return NextResponse.json({ ok: true, item: doc }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
