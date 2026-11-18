import { NextResponse } from "next/server";
import { generateId } from "@/core/identity/auth/crypto";
import { planCongressImportCommit } from "@/core/congress/import-commit";
import { requireCongressImport } from "@/app/api/congress/guard";
import { previewCongressWorkbook } from "@/lib/congress/import-workbook";
import {
  appendCongressAudit,
  listCongressRegistrations,
} from "@/lib/congress/repository";

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

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: "import.prepare_commit",
      entity: "congress_import",
      metadata: {
        fileName: file instanceof File ? file.name : "archivo.xlsx",
        batchId,
        summary: plan.summary,
        committed: false,
      },
    });

    return NextResponse.json({
      ok: true,
      locked: true,
      batchId,
      previewSummary: preview.summary,
      plan,
      message:
        "Plan de importación listo. La confirmación definitiva aún no escribe fichas; revise altas, vinculaciones y pendientes.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo preparar la importación." },
      { status: 400 }
    );
  }
}
