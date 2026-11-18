import { NextResponse } from "next/server";
import { generateId } from "@/core/identity/auth/crypto";
import { planCongressImportCommit } from "@/core/congress/import-commit";
import { requireCongressImport } from "@/app/api/congress/guard";
import { executeCongressImportCommit } from "@/lib/congress/import-commit-write";
import { previewCongressWorkbook } from "@/lib/congress/import-workbook";
import { listCongressRegistrations } from "@/lib/congress/repository";

/** Confirma la importación: stubs + catálogo de iglesias (sin lodging del Excel). */
export async function POST(request: Request) {
  try {
    const ctx = await requireCongressImport();
    if (ctx instanceof NextResponse) return ctx;

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Debe adjuntar el Excel en el campo file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = previewCongressWorkbook(buffer);
    const existing = await listCongressRegistrations(ctx.tenantId);
    const batchId = generateId("cimp");
    const plan = planCongressImportCommit({ preview, existing, batchId });
    const result = await executeCongressImportCommit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      batchId,
      fileName: file instanceof File ? file.name : "archivo.xlsx",
      plan,
    });

    return NextResponse.json({
      ok: true,
      locked: false,
      batchId,
      summary: {
        created: result.created,
        churchesUpserted: result.churchesUpserted,
        skipped: result.skipped,
        namedCount: plan.summary.namedCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo confirmar la importación." },
      { status: 400 }
    );
  }
}
